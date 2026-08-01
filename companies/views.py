"""
Company HR views:
- list users with budgets
- set per-user annual_budget
- view budget ledger per user
- adjust (credit/debit) a budget
- dashboard summary
"""
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from accounts.models import User
from billing.models import BudgetLedger, Invoice
from catalog.models import Company
from core.permissions import IsCompanyAdmin
from .serializers import (
    EmployeeBudgetSerializer,
    EmployeeListSerializer,
    BudgetAdjustSerializer,
    LedgerEntrySerializer,
    CompanyDashboardSerializer,
)


class EmployeeBudgetViewSet(viewsets.ModelViewSet):
    """Company admin manages user budgets."""
    serializer_class = EmployeeListSerializer
    permission_classes = [IsAuthenticated, IsCompanyAdmin]

    def get_queryset(self):
        return User.objects.filter(
            company=self.request.user.company,
            role="user",
        ).select_related("company")

    def get_serializer_class(self):
        if self.action in ("update", "partial_update"):
            return EmployeeBudgetSerializer
        return EmployeeListSerializer

    def partial_update(self, request, *args, **kwargs):
        """PATCH /api/companies/employees/<id>/  {annual_budget}"""
        emp = self.get_object()
        if emp.company_id != request.user.company_id:
            return Response({"detail": "Employee not in your company."}, status=403)
        ser = EmployeeBudgetSerializer(emp, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        new_annual = ser.validated_data.get("annual_budget", emp.annual_budget)
        with transaction.atomic():
            emp = User.objects.select_for_update().get(pk=emp.pk)
            # reset remaining to match new annual
            emp.annual_budget = new_annual
            emp.remaining_budget = new_annual
            emp.save(update_fields=["annual_budget", "remaining_budget", "updated_at"])
            BudgetLedger.objects.create(
                employee=emp, amount=new_annual, type=BudgetLedger.Type.ADJUST,
                reference=f"admin:{request.user.phone_number}",
                description=f"HR reset annual budget to {new_annual:,} Toman",
            )
        return Response(EmployeeListSerializer(User.objects.get(pk=emp.pk)).data)

    @action(detail=True, methods=["get"], url_path="ledger")
    def ledger(self, request, pk=None):
        """GET /api/companies/employees/<id>/ledger/"""
        emp = self.get_object()
        if emp.company_id != request.user.company_id:
            return Response({"detail": "Employee not in your company."}, status=403)
        entries = BudgetLedger.objects.filter(employee=emp).order_by("-created_at")[:50]
        return Response(LedgerEntrySerializer(entries, many=True).data)

    @action(detail=True, methods=["post"], url_path="adjust")
    def adjust_budget(self, request, pk=None):
        """POST /api/companies/employees/<id>/adjust/ {amount, type:"credit"|"debit", description}"""
        emp = self.get_object()
        if emp.company_id != request.user.company_id:
            return Response({"detail": "Employee not in your company."}, status=403)
        amount = int(request.data.get("amount", 0))
        adj_type = request.data.get("type", "debit")
        desc = request.data.get("description", f"HR {adj_type}")
        if amount <= 0:
            return Response({"detail": "Amount must be positive."}, status=400)
        with transaction.atomic():
            emp = User.objects.select_for_update().get(pk=emp.pk)
            if adj_type == "credit":
                emp.annual_budget += amount
                emp.remaining_budget += amount
            else:  # debit
                if emp.remaining_budget < amount:
                    return Response({"detail": "Insufficient remaining budget."}, status=400)
                emp.remaining_budget -= amount
            emp.save(update_fields=["annual_budget", "remaining_budget", "updated_at"])
            BudgetLedger.objects.create(
                employee=emp,
                amount=amount if adj_type == "credit" else -amount,
                type=BudgetLedger.Type.ADJUST,
                reference=f"admin:{request.user.phone_number}",
                description=desc,
            )
        return Response(EmployeeListSerializer(User.objects.get(pk=emp.pk)).data)


from rest_framework.permissions import IsAuthenticated, AllowAny


@api_view(["POST"])
@permission_classes([AllowAny])
def register_company(request):
    """
    POST /api/companies/register/
    Register a new company with a company_admin user.
    Company starts as "pending" and must be approved by an admin before
    the company_admin can login.
    """
    name = request.data.get("name")
    email = request.data.get("email")
    phone = request.data.get("phone_number")
    password = request.data.get("password")
    default_budget = request.data.get("default_annual_budget", 0)

    if not name or not email or not phone or not password:
        return Response({"detail": "name, email, phone_number و password الزامی‌اند."}, status=400)
    if User.objects.filter(phone_number=phone).exists():
        return Response({"detail": "شماره موبیل قبلاً ثبت شده است."}, status=400)
    if User.objects.filter(email=email).exists():
        return Response({"detail": "ایمیل قبلاً ثبت شده است."}, status=400)
    if not phone.startswith("09") or len(phone) != 11:
        return Response({"detail": "شماره موبیل نامعتبر است."}, status=400)

    with transaction.atomic():
        company = Company(
            name=name,
            domain=email.split("@")[-1],
            default_annual_budget=default_budget,
            status=Company.Status.PENDING,
            is_active=False,
        )
        company.save()
        admin = User.objects.create_user(
            phone_number=phone,
            name=name,
            email=email,
            role=User.Role.COMPANY_ADMIN,
            company=company,
            is_verified=True,
            is_active=False,  # must be approved before login
        )
        admin.set_password(password)
        admin.save()

    from core.sms import send_sms
    admins = User.objects.filter(role="admin")
    for a in admins:
        send_sms(a.phone_number, f"باجیمو: شرکت جدید «{company.name}» ثبت شد. بررسی کنید.")

    return Response({
        "company_id": company.id,
        "company_name": company.name,
        "status": "pending",
        "detail": "Company registered. Pending admin approval before login.",
    }, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def company_dashboard(request):
    """GET /api/companies/dashboard/"""
    company = request.user.company
    users = User.objects.filter(company=company, role="user")
    total_annual = sum(e.annual_budget for e in users)
    total_remaining = sum(e.remaining_budget for e in users)
    from bookings.models import Booking
    total_bookings = Booking.objects.filter(company=company).count()
    invoices = Invoice.objects.filter(company=company).order_by("-period_end")[:10]
    invoice_list = [
        {"period_start": str(i.period_start), "period_end": str(i.period_end),
         "total_toman": i.total_toman, "status": i.status}
        for i in invoices
    ]
    return Response({
        "company_name": company.name,
        "company_status": company.status,
        "user_count": users.count(),
        "total_annual_budget": total_annual,
        "total_remaining": total_remaining,
        "total_used": total_annual - total_remaining,
        "total_bookings": total_bookings,
        "invoices": invoice_list,
    })
