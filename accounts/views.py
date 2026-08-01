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

from .serializers import OTPRequestSerializer, OTPVerifySerializer, UserSerializer, ProfileUpdateSerializer, EmailLoginSerializer
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
        code = f"{random.randint(100000, 999999)}"
        cache.set(f"otp:{phone}", code, timeout=OTP_TTL_SECONDS)

        # In dev without gateway key, print code (flush for reliable capture)
        if not settings.KAVENEGAR_API_KEY:
            print(f"[OTP] dev code for {phone}: {code}", flush=True)
            return Response({"detail": "OTP sent (dev code printed)."}, status=status.HTTP_200_OK)

        try:
            from core.sms import send_otp_sms
            send_otp_sms(phone, code)
        except Exception as exc:  # noqa: BLE001
            print(f"[OTP] SMS failed: {exc}")
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

        # Block company_admin login if their company is not yet approved
        if not created and user.role == "company_admin" and user.company:
            if user.company.status != "active":
                return Response(
                    {"detail": "Your company is pending admin approval."},
                    status=status.HTTP_403_FORBIDDEN,
                )

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


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        ser = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(UserSerializer(request.user).data)


class AdminUserDetailView(APIView):
    """Admin-only: get a user's profile and their bookings."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        if request.user.role != "admin":
            return Response({"detail": "Not allowed"}, status=403)
        try:
            target = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=404)

        from bookings.models import Booking
        bookings = Booking.objects.select_related("offer", "venue").filter(employee=target).order_by("-reserved_at")[:50]

        return Response({
            "user": UserSerializer(target).data,
            "bookings": [
                {
                    "id": b.id,
                    "venue_name": b.venue.name,
                    "offer_name": b.offer.name,
                    "price": b.price,
                    "status": b.status,
                    "reserved_at": b.reserved_at,
                    "checked_in_at": b.checked_in_at,
                    "cancelled_at": b.cancelled_at,
                }
                for b in bookings
            ],
        })


class EmailLoginView(APIView):
    """Email/password login. POST /auth/login-email/ {email, password} -> JWT tokens."""

    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        ser = EmailLoginSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email = ser.validated_data["email"]
        password = ser.validated_data["password"]

        user = User.objects.filter(email=email).first()
        if user is None:
            return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)
        if not user.check_password(password):
            return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)
        if not user.is_active:
            return Response({"detail": "Account is not active."}, status=status.HTTP_403_FORBIDDEN)

        # Block company_admin login if their company is not yet approved
        if user.role == "company_admin" and user.company:
            if user.company.status != "active":
                return Response(
                    {"detail": "Your company is pending admin approval."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        tokens = issue_tokens(user)
        return Response({
            "user": UserSerializer(user).data,
            "access": tokens["access"],
            "refresh": tokens["refresh"],
        }, status=status.HTTP_200_OK)
