"""
Company (HR) API:
- list / add / remove employees of the manager's company
- set an employee's annual budget, credit/debit it, view its ledger
- company registration (public) and dashboard summary
"""
import re

from django.db import transaction
from django.db.models import Sum
from rest_framework import viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from accounts.models import User
from billing.models import BudgetLedger, Invoice
from catalog.models import Company
from core.permissions import IsCompanyAdmin
from core.sms import send_sms

from .serializers import EmployeeBudgetSerializer, EmployeeListSerializer, LedgerEntrySerializer

PHONE_RE = re.compile(r"^09\d{9}$")
_FA_DIGITS = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")


def normalize_phone(raw: str | None) -> str:
    """Accept Persian digits / spaces / +98 and return 09xxxxxxxxx."""
    phone = re.sub(r"[^\d]", "", (raw or "").translate(_FA_DIGITS))
    if phone.startswith("98") and len(phone) == 12:
        phone = "0" + phone[2:]
    return phone


class EmployeeBudgetViewSet(viewsets.ModelViewSet):
    """Company admin / HR manages employees and their budgets."""

    serializer_class = EmployeeListSerializer
    permission_classes = [IsAuthenticated, IsCompanyAdmin]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return (
            User.objects.filter(company=self.request.user.company, role=User.Role.USER)
            .select_related("company")
            .order_by("name", "phone_number")
        )

    def create(self, request, *args, **kwargs):
        """POST /api/companies/employees/  {phone_number, name?, annual_budget?}"""
        company = request.user.company
        phone = normalize_phone(request.data.get("phone_number"))
        if not PHONE_RE.match(phone):
            return Response({"detail": "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود."}, status=400)
        name = (request.data.get("name") or "").strip() or None
        try:
            budget = int(request.data.get("annual_budget", company.default_annual_budget) or 0)
        except (TypeError, ValueError):
            return Response({"detail": "مبلغ بودجه نامعتبر است."}, status=400)
        if budget < 0:
            return Response({"detail": "مبلغ بودجه نمی‌تواند منفی باشد."}, status=400)

        with transaction.atomic():
            emp = User.objects.select_for_update().filter(phone_number=phone).first()
            if emp is not None:
                if emp.role != User.Role.USER:
                    return Response({"detail": "این شماره متعلق به حساب دیگری (غیر از کارمند) است."}, status=400)
                if emp.company_id and emp.company_id != company.id:
                    return Response({"detail": "این شماره عضو سازمان دیگری است."}, status=400)
                if emp.company_id == company.id:
                    return Response({"detail": "این کارمند قبلاً اضافه شده است."}, status=400)
            else:
                emp = User.objects.create_user(phone_number=phone, role=User.Role.USER, is_active=True)

            emp.company = company
            if name and not emp.name:
                emp.name = name
            emp.annual_budget = budget
            emp.remaining_budget = budget
            emp.save(update_fields=["company", "name", "annual_budget", "remaining_budget", "updated_at"])
            if budget:
                BudgetLedger.objects.create(
                    employee=emp,
                    amount=budget,
                    type=BudgetLedger.Type.RESET,
                    reference=f"admin:{request.user.phone_number}",
                    description=f"Added to {company.name} with {budget:,} Toman",
                )

        send_sms(phone, f"باجیمو: «{company.name}» برای شما بودجه رفاهی فعال کرد. با همین شماره وارد bagymo.ir شوید.")
        return Response(EmployeeListSerializer(emp).data, status=201)

    def destroy(self, request, *args, **kwargs):
        """DELETE /api/companies/employees/<id>/ — detach from the company (the account is kept)."""
        emp = self.get_object()
        with transaction.atomic():
            emp = User.objects.select_for_update().get(pk=emp.pk)
            if emp.remaining_budget:
                BudgetLedger.objects.create(
                    employee=emp,
                    amount=-emp.remaining_budget,
                    type=BudgetLedger.Type.ADJUST,
                    reference=f"admin:{request.user.phone_number}",
                    description="Removed from company",
                )
            emp.company = None
            emp.annual_budget = 0
            emp.remaining_budget = 0
            emp.save(update_fields=["company", "annual_budget", "remaining_budget", "updated_at"])
        return Response(status=204)

    def partial_update(self, request, *args, **kwargs):
        """PATCH /api/companies/employees/<id>/  {annual_budget, name?} — resets remaining to the new annual."""
        emp = self.get_object()
        ser = EmployeeBudgetSerializer(emp, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        new_annual = ser.validated_data.get("annual_budget", emp.annual_budget)
        with transaction.atomic():
            emp = User.objects.select_for_update().get(pk=emp.pk)
            if "name" in ser.validated_data:
                emp.name = ser.validated_data["name"]
            emp.annual_budget = new_annual
            emp.remaining_budget = new_annual
            emp.save(update_fields=["name", "annual_budget", "remaining_budget", "updated_at"])
            BudgetLedger.objects.create(
                employee=emp,
                amount=new_annual,
                type=BudgetLedger.Type.ADJUST,
                reference=f"admin:{request.user.phone_number}",
                description=f"HR reset annual budget to {new_annual:,} Toman",
            )
        return Response(EmployeeListSerializer(emp).data)

    @action(detail=True, methods=["get"], url_path="ledger")
    def ledger(self, request, pk=None):
        """GET /api/companies/employees/<id>/ledger/"""
        emp = self.get_object()
        entries = BudgetLedger.objects.filter(employee=emp).order_by("-created_at")[:50]
        return Response(LedgerEntrySerializer(entries, many=True).data)

    @action(detail=True, methods=["post"], url_path="adjust")
    def adjust_budget(self, request, pk=None):
        """POST /api/companies/employees/<id>/adjust/ {amount, type: "credit"|"debit", description}"""
        emp = self.get_object()
        try:
            amount = int(request.data.get("amount", 0))
        except (TypeError, ValueError):
            amount = 0
        adj_type = request.data.get("type", "debit")
        if adj_type not in ("credit", "debit"):
            return Response({"detail": "نوع تغییر باید credit یا debit باشد."}, status=400)
        if amount <= 0:
            return Response({"detail": "مبلغ باید بیشتر از صفر باشد."}, status=400)
        desc = request.data.get("description") or f"HR {adj_type}"
        with transaction.atomic():
            emp = User.objects.select_for_update().get(pk=emp.pk)
            if adj_type == "credit":
                emp.annual_budget += amount
                emp.remaining_budget += amount
            else:
                if emp.remaining_budget < amount:
                    return Response({"detail": "بودجه باقی‌مانده کمتر از مبلغ کاهش است."}, status=400)
                emp.remaining_budget -= amount
            emp.save(update_fields=["annual_budget", "remaining_budget", "updated_at"])
            BudgetLedger.objects.create(
                employee=emp,
                amount=amount if adj_type == "credit" else -amount,
                type=BudgetLedger.Type.ADJUST,
                reference=f"admin:{request.user.phone_number}",
                description=desc,
            )
        return Response(EmployeeListSerializer(emp).data)


@api_view(["POST"])
@permission_classes([AllowAny])
def register_company(request):
    """
    POST /api/companies/register/  {name, email, phone_number, password, default_annual_budget}
    The company starts as "pending"; its admin can log in only after platform approval.
    """
    name = (request.data.get("name") or "").strip()
    email = (request.data.get("email") or "").strip().lower()
    phone = normalize_phone(request.data.get("phone_number"))
    password = request.data.get("password") or ""
    try:
        default_budget = max(0, int(request.data.get("default_annual_budget") or 0))
    except (TypeError, ValueError):
        default_budget = 0

    if not name or not email or not phone or not password:
        return Response({"detail": "نام سازمان، ایمیل، موبایل و رمز عبور الزامی‌اند."}, status=400)
    if not PHONE_RE.match(phone):
        return Response({"detail": "شماره موبایل نامعتبر است."}, status=400)
    if len(password) < 8:
        return Response({"detail": "رمز عبور باید حداقل ۸ کاراکتر باشد."}, status=400)
    if User.objects.filter(phone_number=phone).exists():
        return Response({"detail": "این شماره موبایل قبلاً ثبت شده است."}, status=400)
    if User.objects.filter(email__iexact=email).exists():
        return Response({"detail": "این ایمیل قبلاً ثبت شده است."}, status=400)

    with transaction.atomic():
        company = Company.objects.create(
            name=name,
            domain=email.split("@")[-1],
            billing_email=email,
            default_annual_budget=default_budget,
            status=Company.Status.PENDING,
            is_active=False,
        )
        admin = User.objects.create_user(
            phone_number=phone,
            name=name,
            email=email,
            role=User.Role.COMPANY_ADMIN,
            company=company,
            is_verified=True,
            is_active=False,  # activated on approval
        )
        admin.set_password(password)
        admin.save()

    for a in User.objects.filter(role=User.Role.ADMIN):
        send_sms(a.phone_number, f"باجیمو: سازمان جدید «{company.name}» ثبت شد. بررسی کنید.")

    return Response(
        {
            "company_id": company.id,
            "company_name": company.name,
            "status": "pending",
            "detail": "سازمان ثبت شد و پس از تأیید قابل استفاده است.",
        },
        status=201,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def company_dashboard(request):
    """GET /api/companies/dashboard/"""
    from bookings.models import Booking

    company = request.user.company
    users = User.objects.filter(company=company, role=User.Role.USER)
    totals = users.aggregate(annual=Sum("annual_budget"), remaining=Sum("remaining_budget"))
    total_annual = totals["annual"] or 0
    total_remaining = totals["remaining"] or 0
    invoices = Invoice.objects.filter(company=company).order_by("-period_end")[:10]
    return Response(
        {
            "company_name": company.name,
            "company_status": company.status,
            "user_count": users.count(),
            "total_annual_budget": total_annual,
            "total_remaining": total_remaining,
            "total_used": total_annual - total_remaining,
            "total_bookings": Booking.objects.filter(company=company).count(),
            "invoices": [
                {
                    "period_start": str(i.period_start),
                    "period_end": str(i.period_end),
                    "total_toman": i.total_toman,
                    "status": i.status,
                }
                for i in invoices
            ],
        }
    )
