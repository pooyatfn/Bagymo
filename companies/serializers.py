"""Company HR serializers."""
from rest_framework import serializers
from accounts.models import User
from billing.models import BudgetLedger, Invoice


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


class BudgetAdjustSerializer(serializers.Serializer):
    amount = serializers.IntegerField(min_value=1, help_text="Amount in Toman (positive only)")
    description = serializers.CharField(max_length=300, required=False, default="HR adjustment")

    def validate(self, attrs):
        user = self.context["view"].employee
        if attrs["amount"] > user.remaining_budget:
            raise serializers.ValidationError("Cannot debit more than remaining budget.")
        return attrs


class LedgerEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetLedger
        fields = ["id", "type", "amount", "reference", "description", "created_at"]
        read_only_fields = fields


class CompanyDashboardSerializer(serializers.Serializer):
    company_name = serializers.CharField()
    user_count = serializers.IntegerField()
    total_annual_budget = serializers.IntegerField()
    total_remaining = serializers.IntegerField()
    total_used = serializers.IntegerField()
    total_bookings = serializers.IntegerField()
    invoices = serializers.ListField(child=serializers.DictField())
