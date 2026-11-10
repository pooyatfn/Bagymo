"""Company HR serializers."""
from rest_framework import serializers

from accounts.models import User
from billing.models import BudgetLedger


class EmployeeBudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "name", "phone_number", "annual_budget", "remaining_budget", "fiscal_year_start"]
        read_only_fields = ["id", "phone_number", "remaining_budget", "fiscal_year_start"]


class EmployeeListSerializer(serializers.ModelSerializer):
    usage_pct = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "name", "phone_number", "annual_budget", "remaining_budget", "usage_pct"]
        read_only_fields = fields

    def get_usage_pct(self, obj):
        if obj.annual_budget == 0:
            return 0
        used = obj.annual_budget - obj.remaining_budget
        return round(used / obj.annual_budget * 100, 1)


class LedgerEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetLedger
        fields = ["id", "type", "amount", "reference", "description", "created_at"]
        read_only_fields = fields
