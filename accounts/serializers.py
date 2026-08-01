from rest_framework import serializers
from .models import User


class OTPRequestSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=16)


class OTPVerifySerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=16)
    code = serializers.CharField(max_length=10)


class EmailLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class UserSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source="company.name", read_only=True, default="")

    class Meta:
        model = User
        fields = [
            "id",
            "phone_number",
            "email",
            "name",
            "role",
            "gender",
            "is_verified",
            "remaining_budget",
            "annual_budget",
            "wallet_balance",
            "sheba",
            "company",
            "company_name",
            "created_at",
        ]
        read_only_fields = ["id", "phone_number", "role", "is_verified", "remaining_budget",
                            "annual_budget", "wallet_balance", "company", "company_name", "created_at"]


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["name", "sheba", "gender"]
