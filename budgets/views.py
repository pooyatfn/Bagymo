"""Budgets app: budget history view (Step 2)."""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from billing.models import BudgetLedger


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def budget_history(request):
    rows = BudgetLedger.objects.filter(employee=request.user).order_by("-created_at")[:50]
    return Response([
        {"type": r.type, "amount": r.amount, "reference": r.reference,
         "description": r.description, "ts": r.created_at} for r in rows
    ])
