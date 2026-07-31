"""
OTP request & verify. Uses Redis-backed cache + Kavenegar (Iran).
Fallback: if KAVENEGAR_API_KEY empty (dev), codes are printed to stdout.
"""
import random

from django.core.cache import cache
from django.conf import settings

from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import OTPRequestSerializer, OTPVerifySerializer, UserSerializer
from .models import User
from .tokens import issue_tokens


OTP_TTL_SECONDS = 300


class OTPRequestView(generics.GenericAPIView):
    serializer_class = OTPRequestSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        phone = ser.validated_data["phone_number"]
        code = f"{random.randint(10000, 99999)}"
        cache.set(f"otp:{phone}", code, timeout=OTP_TTL_SECONDS)

        # In dev without gateway key, print code (flush for reliable capture)
        if not settings.KAVENEGAR_API_KEY:
            print(f"[OTP] dev code for {phone}: {code}", flush=True)
            return Response({"detail": "OTP sent (dev code printed)."}, status=status.HTTP_200_OK)

        try:
            from kavenegar import KavenegarAPI, APIException, HTTPException
            api = KavenegarAPI(settings.KAVENEGAR_API_KEY)
            params = {
                "receptor": phone,
                "token": code,
                "sender": settings.KAVENEGAR_SENDER or "",
                "template": "verify",
            }
            api.call("message.send", params)
        except Exception as exc:  # noqa: BLE001
            print(f"[OTP] Kavenegar failed: {exc}")
            # still proceed in dev-like fallback for local
        return Response({"detail": "OTP sent."}, status=status.HTTP_200_OK)


class OTPVerifyView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        ser = OTPVerifySerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        phone = ser.validated_data["phone_number"]
        code = ser.validated_data["code"]
        expected = cache.get(f"otp:{phone}")
        if not expected or expected != code:
            return Response({"detail": "Invalid or expired code."}, status=status.HTTP_400_BAD_REQUEST)
        cache.delete(f"otp:{phone}")

        user = User.objects.filter(phone_number=phone).first()
        created = user is None
        if user is None:
            user = User.objects.create_user(phone_number=phone, is_active=True, is_verified=True)

        tokens = issue_tokens(user)
        return Response(
            {
                "created": created,
                "user": UserSerializer(user).data,
                "access": tokens["access"],
                "refresh": tokens["refresh"],
            },
            status=status.HTTP_200_OK,
        )
