"""Billing API URLs (monthly invoices + venue self-settlement view)."""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Invoice, SettlementBatch, BudgetLedger
from bookings.models import Booking


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_invoices(request):
    user = request.user
    if user.role == "admin":
        qs = Invoice.objects.all()
    else:
        qs = Invoice.objects.filter(company=user.company)
    return Response([
        {"id": i.id, "company": i.company.name, "period_start": i.period_start,
         "period_end": i.period_end, "total_toman": i.total_toman,
         "status": i.status} for i in qs
    ])


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def venue_settlements(request):
    user = request.user
    if user.role != "venue_staff":
        return Response({"detail": "venue staff only"}, status=403)
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
    elif user.role == "company_admin":
        qs = qs.filter(company=user.company)
    else:
        return Response({"detail": "Not allowed"}, status=403)
    return Response([
        {"id": b.id, "employee_name": b.employee.name, "employee_phone": b.employee.phone_number,
         "venue_name": b.venue.name, "offer_name": b.offer.name,
         "price": b.price, "status": b.status,
         "reserved_at": b.reserved_at, "checked_in_at": b.checked_in_at,
         "cancelled_at": b.cancelled_at}
        for b in qs.order_by("-reserved_at")[:100]
    ])
