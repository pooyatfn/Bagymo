"""Billing API URLs (monthly invoices + venue self-settlement view)."""
from datetime import timedelta

from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from bookings.models import Booking
from core.permissions import COMPANY_MANAGER_ROLES

from .models import Invoice, SettlementBatch


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_invoices(request):
    user = request.user
    if user.role == "admin":
        qs = Invoice.objects.select_related("company")
    elif user.company_id:
        qs = Invoice.objects.select_related("company").filter(company=user.company)
    else:
        qs = Invoice.objects.none()
    qs = qs.order_by("-period_end")
    return Response([
        {"id": i.id, "company": i.company.name, "period_start": i.period_start,
         "period_end": i.period_end, "total_toman": i.total_toman,
         "status": i.status} for i in qs
    ])


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def venue_settlements(request):
    user = request.user
    if user.role != "venue_staff" or not user.venue_id:
        return Response({"detail": "فقط برای مدیر مجموعه."}, status=403)
    batches = SettlementBatch.objects.filter(venue=user.venue).order_by("-period_end")
    return Response([
        {"id": b.id, "period_start": b.period_start, "period_end": b.period_end,
         "total_net_payout": b.total_net_payout, "total_count": b.total_count,
         "status": b.status, "paid_at": b.paid_at} for b in batches
    ])


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def company_bookings(request):
    """All bookings for the company, with details."""
    user = request.user
    qs = Booking.objects.select_related("offer", "venue", "employee").all()
    if user.role == "admin":
        pass
    elif user.role in COMPANY_MANAGER_ROLES:
        qs = qs.filter(company=user.company)
    else:
        return Response({"detail": "دسترسی مجاز نیست."}, status=403)
    return Response([
        {"id": b.id, "employee_id": b.employee_id, "employee_name": b.employee.name, "employee_phone": b.employee.phone_number,
         "venue_id": b.venue_id, "venue_name": b.venue.name, "offer_name": b.offer.name,
         "price": b.price, "status": b.status,
         "reserved_at": b.reserved_at, "checked_in_at": b.checked_in_at,
         "cancelled_at": b.cancelled_at}
        for b in qs.order_by("-reserved_at")[:100]
    ])


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def company_analytics(request):
    """Company analytics: totals, top employees, venue breakdown."""
    user = request.user
    if user.role != "admin" and user.role not in COMPANY_MANAGER_ROLES:
        return Response({"detail": "دسترسی مجاز نیست."}, status=403)

    qs = Booking.objects.select_related("offer", "venue", "employee").filter(status="checked_in")
    if user.role in COMPANY_MANAGER_ROLES:
        qs = qs.filter(company=user.company)

    total_bookings = qs.count()
    total_spend = qs.aggregate(total=Sum("price"))["total"] or 0
    total_commission = qs.aggregate(total=Sum("employee_commission"))["total"] or 0

    # top employees by booking count
    top_employees = list(
        qs.values("employee__name", "employee__phone_number")
        .annotate(bookings=Count("id"), total_spent=Sum("price"))
        .order_by("-bookings")[:10]
    )

    # venue breakdown
    venue_breakdown = list(
        qs.values("venue__name")
        .annotate(bookings=Count("id"), total_spent=Sum("price"))
        .order_by("-bookings")[:10]
    )

    # last 30 days trend
    thirty_days_ago = timezone.now() - timedelta(days=30)
    daily = list(
        qs.filter(reserved_at__gte=thirty_days_ago)
        .values("reserved_at__date")
        .annotate(bookings=Count("id"), total_spent=Sum("price"))
        .order_by("reserved_at__date")
    )

    return Response({
        "total_bookings": total_bookings,
        "total_spend": total_spend,
        "total_commission": total_commission,
        "top_employees": top_employees,
        "venue_breakdown": venue_breakdown,
        "daily_trend": daily,
    })
