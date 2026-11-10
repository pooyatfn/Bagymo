"""
Auth views: OTP request/verify (Kavenegar SMS), email+password login, profile.
In dev (no KAVENEGAR_API_KEY) OTP codes are printed to the server console.
"""
import secrets

from django.conf import settings
from django.core.cache import cache
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from companies.views import PHONE_RE, normalize_phone

from .models import User
from .serializers import (
    EmailLoginSerializer,
    OTPRequestSerializer,
    OTPVerifySerializer,
    ProfileUpdateSerializer,
    UserSerializer,
)
from .tokens import issue_tokens

OTP_TTL_SECONDS = 300
OTP_RESEND_SECONDS = 60
OTP_MAX_ATTEMPTS = 5
PENDING_COMPANY_MSG = "سازمان شما هنوز توسط باجیمو تأیید نشده است."


class OTPRequestView(generics.GenericAPIView):
    serializer_class = OTPRequestSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        phone = normalize_phone(ser.validated_data["phone_number"])
        if not PHONE_RE.match(phone):
            return Response({"detail": "شماره موبایل نامعتبر است."}, status=status.HTTP_400_BAD_REQUEST)
        # one code per minute per number
        if not cache.add(f"otp-cooldown:{phone}", 1, timeout=OTP_RESEND_SECONDS):
            return Response({"detail": "کد قبلاً ارسال شده؛ کمی بعد دوباره تلاش کنید."}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        code = f"{secrets.randbelow(900000) + 100000}"
        cache.set(f"otp:{phone}", code, timeout=OTP_TTL_SECONDS)
        cache.delete(f"otp-attempts:{phone}")

        if not settings.KAVENEGAR_API_KEY:
            print(f"[OTP] dev code for {phone}: {code}", flush=True)
            return Response({"detail": "کد تایید ارسال شد (حالت توسعه: در کنسول سرور)."})

        from core.sms import send_otp_sms

        if not send_otp_sms(phone, code):
            cache.delete(f"otp-cooldown:{phone}")
            return Response({"detail": "ارسال پیامک ناموفق بود."}, status=status.HTTP_502_BAD_GATEWAY)
        return Response({"detail": "کد تایید ارسال شد."})


class OTPVerifyView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        ser = OTPVerifySerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        phone = normalize_phone(ser.validated_data["phone_number"])
        code = ser.validated_data["code"].strip()
        attempts_key = f"otp-attempts:{phone}"
        attempts = cache.get(attempts_key, 0)
        expected = cache.get(f"otp:{phone}")
        if not expected or attempts >= OTP_MAX_ATTEMPTS or not secrets.compare_digest(expected, code):
            cache.set(attempts_key, attempts + 1, timeout=OTP_TTL_SECONDS)
            return Response({"detail": "کد نادرست یا منقضی است."}, status=status.HTTP_400_BAD_REQUEST)
        cache.delete_many([f"otp:{phone}", attempts_key])

        user = User.objects.filter(phone_number=phone).first()
        created = user is None
        if user is None:
            user = User.objects.create_user(phone_number=phone, is_active=True, is_verified=True)

        # Block company_admin login if their company is not yet approved
        if not created and user.role == "company_admin" and user.company:
            if user.company.status != "active":
                return Response({"detail": PENDING_COMPANY_MSG}, status=status.HTTP_403_FORBIDDEN)
        if not user.is_active:
            return Response({"detail": "حساب کاربری شما غیرفعال است."}, status=status.HTTP_403_FORBIDDEN)

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
        if request.user.role == User.Role.USER:
            # refund expired reservations first so the budget shown is current
            from bookings.views import _expire_past_bookings

            _expire_past_bookings()
            request.user.refresh_from_db()
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
            return Response({"detail": "دسترسی مجاز نیست."}, status=403)
        target = User.objects.select_related("company").filter(id=user_id).first()
        if target is None:
            return Response({"detail": "کاربر پیدا نشد."}, status=404)

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

        user = User.objects.filter(email__iexact=email).first()
        if user is None or not user.check_password(password):
            return Response({"detail": "ایمیل یا رمز عبور نادرست است."}, status=status.HTTP_401_UNAUTHORIZED)
        # company admins can sign in only after their company is approved
        if user.role == "company_admin" and user.company and user.company.status != "active":
            return Response({"detail": PENDING_COMPANY_MSG}, status=status.HTTP_403_FORBIDDEN)
        if not user.is_active:
            return Response({"detail": "حساب کاربری شما غیرفعال است."}, status=status.HTTP_403_FORBIDDEN)

        tokens = issue_tokens(user)
        return Response({
            "user": UserSerializer(user).data,
            "access": tokens["access"],
            "refresh": tokens["refresh"],
        }, status=status.HTTP_200_OK)
