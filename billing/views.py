"""Billing API URLs (monthly invoices + venue self-settlement view)."""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Invoice, SettlementBatch


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_invoices(request):
    user = request.user
    if user.role == "admin":
        qs = Invoice.objects.all()
    else:
        qs = Invoice.objects.filter(company=user.company)
    return Response([
        {"company": i.company.name, "period_start": i.period_start,
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
        {"period_start": b.period_start, "period_end": b.period_end,
         "total_net_payout": b.total_net_payout, "status": b.status} for b in batches
    ])
