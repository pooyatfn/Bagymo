"""
Company HR views:
- list employees with budgets
- set per-employee annual_budget
- view budget ledger per employee
- adjust (credit/debit) a budget
- dashboard summary
"""
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from accounts.models import User
from billing.models import BudgetLedger, Invoice
from core.permissions import IsCompanyAdmin
from .serializers import (
    EmployeeBudgetSerializer,
    EmployeeListSerializer,
    BudgetAdjustSerializer,
    LedgerEntrySerializer,
    CompanyDashboardSerializer,
)


class EmployeeBudgetViewSet(viewsets.ModelViewSet):
    """Company admin manages employee budgets."""
    serializer_class = EmployeeListSerializer
    permission_classes = [IsAuthenticated, IsCompanyAdmin]

    def get_queryset(self):
        return User.objects.filter(
            company=self.request.user.company,
            role="employee",
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


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsCompanyAdmin])
def company_dashboard(request):
    """GET /api/companies/dashboard/"""
    company = request.user.company
    employees = User.objects.filter(company=company, role="employee")
    total_annual = sum(e.annual_budget for e in employees)
    total_remaining = sum(e.remaining_budget for e in employees)
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
        "employee_count": employees.count(),
        "total_annual_budget": total_annual,
        "total_remaining": total_remaining,
        "total_used": total_annual - total_remaining,
        "total_bookings": total_bookings,
        "invoices": invoice_list,
    })
