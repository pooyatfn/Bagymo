"""Bookings views."""
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Booking
from .serializers import BookingSerializer, BookingCreateSerializer


class BookingViewSet(viewsets.GenericViewSet, mixins.ListModelMixin, mixins.RetrieveModelMixin):
    queryset = Booking.objects.select_related("offer", "venue").all()
    serializer_class = BookingSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "admin":
            return Booking.objects.all()
        return Booking.objects.filter(employee=user)

    def create(self, request, *args, **kwargs):
        ser = BookingCreateSerializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        booking = ser.save()
        out = BookingSerializer(booking, context={"request": request})
        return Response(out.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="verify-checkin")
    def verify_checkin(self, request, pk=None):
        """
        Staff enters the numeric check_in_code (or scans QR) to verify the booking.
        In v1 the employee shows their code; staff inputs it here.
        """
        from django.utils import timezone
        from billing.services import mark_checked_in
        booking = self.get_object()
        code = request.data.get("check_in_code")
        staff_code = request.data.get("staff_code")
        ok, msg = mark_checked_in(booking, code, staff_code, request)
        return Response({"ok": ok, "detail": msg, "status": booking.status})
