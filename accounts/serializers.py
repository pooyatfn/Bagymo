from rest_framework import serializers
from .models import User


class OTPRequestSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=16)


class OTPVerifySerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=16)
    code = serializers.CharField(max_length=10)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "phone_number",
            "name",
            "role",
            "is_verified",
            "remaining_budget",
            "annual_budget",
        ]
        read_only_fields = ["id", "role", "is_verified", "remaining_budget", "annual_budget"]
