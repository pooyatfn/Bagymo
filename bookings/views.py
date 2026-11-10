"""Bookings views."""
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Booking
from .serializers import BookingCreateSerializer, BookingSerializer


def _expire_past_bookings():
    """Expire any bookings past their expires_at window (lightweight inline check)."""
    now = timezone.now()
    expired_ids = list(
        Booking.objects.filter(
            expires_at__lt=now,
            status__in=[Booking.Status.RESERVED, Booking.Status.PAID],
        ).values_list("id", flat=True)
    )
    if not expired_ids:
        return
    with transaction.atomic():
        for bid in expired_ids:
            booking = Booking.objects.select_for_update().get(pk=bid)
            if booking.status not in (Booking.Status.RESERVED, Booking.Status.PAID):
                continue
            booking.status = Booking.Status.EXPIRED
            booking.save(update_fields=["status"])
            employee = booking.employee
            employee.remaining_budget = min(
                employee.remaining_budget + booking.price,
                employee.annual_budget,
            )
            employee.save(update_fields=["remaining_budget"])
            from billing.models import BudgetLedger
            BudgetLedger.objects.create(
                employee=employee,
                amount=booking.price,
                type=BudgetLedger.Type.REFUND,
                reference=f"bookings:{booking.id}",
                description=f"Booking expired: {booking.offer.name}",
            )
            # restore timeslot capacity
            if booking.timeslot:
                from catalog.models import TimeSlot
                TimeSlot.objects.filter(pk=booking.timeslot_id).update(
                    booked_count=F("booked_count") - 1
                )


class BookingViewSet(viewsets.GenericViewSet, mixins.ListModelMixin, mixins.RetrieveModelMixin):
    queryset = Booking.objects.select_related("offer", "venue").all()
    serializer_class = BookingSerializer

    def get_queryset(self):
        _expire_past_bookings()
        user = self.request.user
        qs = Booking.objects.select_related("offer", "venue", "timeslot").order_by("-reserved_at")
        if user.role == "admin":
            return qs
        if user.role == "venue_staff" and user.venue_id:
            return qs.filter(venue_id=user.venue_id)
        return qs.filter(employee=user)

    def create(self, request, *args, **kwargs):
        ser = BookingCreateSerializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        booking = ser.save()
        out = BookingSerializer(booking, context={"request": request})
        return Response(out.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel_booking(self, request, pk=None):
        from billing.models import BudgetLedger
        from catalog.models import TimeSlot
        from core.sms import send_booking_cancellation

        booking = self.get_object()
        user = request.user
        if booking.employee_id != user.id and user.role != "admin":
            return Response({"detail": "اجازه لغو این رزرو را ندارید."}, status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            booking = Booking.objects.select_for_update().select_related("offer", "venue").get(pk=booking.pk)
            if booking.status not in (Booking.Status.RESERVED, Booking.Status.PAID):
                return Response({"detail": "این رزرو قابل لغو نیست."}, status=status.HTTP_400_BAD_REQUEST)
            if booking.expires_at and booking.expires_at < timezone.now():
                return Response({"detail": "مهلت این رزرو تمام شده و قابل لغو نیست."}, status=status.HTTP_400_BAD_REQUEST)

            booking.status = Booking.Status.CANCELLED
            booking.cancelled_at = timezone.now()
            booking.save(update_fields=["status", "cancelled_at"])

            # refund budget (capped at annual_budget)
            employee = type(booking.employee).objects.select_for_update().get(pk=booking.employee_id)
            employee.remaining_budget = min(employee.remaining_budget + booking.price, employee.annual_budget)
            employee.save(update_fields=["remaining_budget"])
            BudgetLedger.objects.create(
                employee=employee,
                amount=booking.price,
                type=BudgetLedger.Type.REFUND,
                reference=f"bookings:{booking.id}",
                description=f"Booking cancelled: {booking.offer.name}",
            )
            if booking.timeslot_id:
                TimeSlot.objects.filter(pk=booking.timeslot_id).update(booked_count=F("booked_count") - 1)

        send_booking_cancellation(employee.phone_number, booking.venue.name, booking.price)
        return Response({"ok": True, "detail": "رزرو لغو شد و مبلغ به بودجه بازگشت."})

    @action(detail=False, methods=["post"], url_path="verify-checkin")
    def verify_checkin(self, request):
        """
        Venue staff enters the guest's check-in code. Always answers 200 with
        {ok, detail, status}; `ok` tells whether the check-in was recorded.
        """
        from billing.services import mark_checked_in

        user = request.user
        if user.role not in ("venue_staff", "admin"):
            return Response({"ok": False, "detail": "فقط پذیرش مجموعه می‌تواند ورود ثبت کند."}, status=403)

        code = (request.data.get("check_in_code") or "").strip().upper()
        qs = Booking.objects.select_related("venue", "offer", "employee").filter(check_in_code=code)
        if user.role == "venue_staff":
            qs = qs.filter(venue_id=user.venue_id)  # staff can only check in to their own venue
        booking = qs.first() if code else None
        if not booking:
            return Response({"ok": False, "detail": "کد نامعتبر است یا متعلق به این مجموعه نیست."})
        ok, msg = mark_checked_in(booking, code, request.data.get("staff_code"), request)
        return Response({"ok": ok, "detail": msg, "status": booking.status})
