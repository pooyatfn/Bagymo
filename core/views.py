from django.core.cache import cache
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ContactMessage

CONTACT_LIMIT = 5  # messages per IP per hour
CONTACT_WINDOW_SECONDS = 3600


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["name", "contact", "topic", "message"]

    def validate_message(self, value):
        value = value.strip()
        if len(value) < 10:
            raise serializers.ValidationError("پیام خیلی کوتاه است.")
        return value

    def validate_contact(self, value):
        value = value.strip()
        if len(value) < 5:
            raise serializers.ValidationError("شماره موبایل یا ایمیل معتبر وارد کنید.")
        return value


class ContactView(APIView):
    """Public contact form. Messages are stored and read by staff in the Django admin."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        ip = (request.META.get("HTTP_X_FORWARDED_FOR") or request.META.get("REMOTE_ADDR") or "").split(",")[0].strip()
        key = f"contact-rate:{ip}"
        sent = cache.get(key, 0)
        if sent >= CONTACT_LIMIT:
            return Response(
                {"detail": "تعداد پیام‌های شما زیاد بوده است؛ لطفاً کمی بعد دوباره تلاش کنید."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        serializer = ContactMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        cache.set(key, sent + 1, timeout=CONTACT_WINDOW_SECONDS)
        return Response({"detail": "پیام شما ثبت شد."}, status=status.HTTP_201_CREATED)
