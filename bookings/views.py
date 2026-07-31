"""Bookings views."""
from django.utils import timezone
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
        if user.role == "venue_staff" and hasattr(user, "venue") and user.venue:
            return Booking.objects.filter(venue=user.venue)
        return Booking.objects.filter(employee=user)

    def create(self, request, *args, **kwargs):
        ser = BookingCreateSerializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        booking = ser.save()
        out = BookingSerializer(booking, context={"request": request})
        return Response(out.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel_booking(self, request, pk=None):
        booking = self.get_object()
        user = request.user
        if booking.employee != user and user.role not in ("admin", "company_admin"):
            return Response({"detail": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
        if booking.status not in (Booking.Status.RESERVED,):
            return Response(
                {"detail": f"Cannot cancel booking in '{booking.status}' status"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        booking.status = Booking.Status.CANCELLED
        booking.cancelled_at = timezone.now()
        booking.save(update_fields=["status", "cancelled_at"])
        # refund budget
        from billing.models import BudgetLedger
        from django.conf import settings
        employee = booking.employee
        employee.remaining_budget = employee.remaining_budget + booking.price
        employee.save(update_fields=["remaining_budget"])
        BudgetLedger.objects.create(
            employee=employee,
            booking=booking,
            company=employee.company,
            type="debit",
            amount=-booking.price,
            balance_after=employee.remaining_budget,
            description=f"Booking cancelled: {booking.offer.name}",
        )
        # send cancellation SMS
        from core.sms import send_booking_cancellation
        send_booking_cancellation(employee.phone_number, booking.venue.name, booking.price)

        return Response({"ok": True, "detail": "Booking cancelled, budget refunded"})

    @action(detail=True, methods=["post"], url_path="verify-checkin")
    def verify_checkin(self, request, pk=None):
        """
        Staff enters the numeric check_in_code (or scans QR) to verify the booking.
        In v1 the employee shows their code; staff inputs it here.
        """
        from billing.services import mark_checked_in
        booking = self.get_object()
        code = request.data.get("check_in_code")
        staff_code = request.data.get("staff_code")
        ok, msg = mark_checked_in(booking, code, staff_code, request)
        return Response({"ok": ok, "detail": msg, "status": booking.status})
