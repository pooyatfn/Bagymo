"""Bookings serializers."""
from rest_framework import serializers

from bookings.models import Booking


class BookingCreateSerializer(serializers.Serializer):
    offer_id = serializers.IntegerField()
    timeslot_id = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, attrs):
        from django.utils import timezone

        from billing.services import InsufficientBudget, reserve_booking
        from catalog.models import Offer, TimeSlot, VenueCompanyAccess
        offer = (
            Offer.objects.select_related("venue")
            .filter(id=attrs["offer_id"], is_active=True, venue__status="active")
            .first()
        )
        if offer is None:
            raise serializers.ValidationError("این خدمت در دسترس نیست.")
        user = self.context["request"].user
        if user.role != "user":
            raise serializers.ValidationError("رزرو فقط برای حساب کارمندان امکان‌پذیر است.")
        # enforce company × venue access
        if not user.company_id or not VenueCompanyAccess.objects.filter(venue=offer.venue, company=user.company, is_active=True).exists():
            raise serializers.ValidationError("این مجموعه با سازمان شما قرارداد ندارد.")
        # enforce gender policy
        if user.gender:
            current_gender = offer.venue.gender_for_now()
            if current_gender != "mixed" and current_gender != user.gender:
                gender_label = "آقایان" if current_gender == "male" else "بانوان"
                raise serializers.ValidationError(f"این باشگاه در حال حاضر {gender_label} است.")
        # validate timeslot if provided
        timeslot = None
        timeslot_id = attrs.get("timeslot_id")
        if timeslot_id:
            try:
                timeslot = TimeSlot.objects.get(pk=timeslot_id, offer=offer, is_active=True)
            except TimeSlot.DoesNotExist:
                raise serializers.ValidationError({"timeslot_id": "زمان رزرو معتبر نیست."}) from None
            if not timeslot.is_available:
                raise serializers.ValidationError({"timeslot_id": "ظرفیت این زمان تکمیل شده."})
            import datetime as _dt
            slot_end = timezone.make_aware(_dt.datetime.combine(timeslot.date, timeslot.end_time))
            if slot_end < timezone.now():
                raise serializers.ValidationError({"timeslot_id": "این سانس به پایان رسیده است."})
        # reserve_booking atomically debits budget + creates booking
        try:
            booking = reserve_booking(user, offer, timeslot=timeslot)
        except InsufficientBudget as exc:
            raise serializers.ValidationError(str(exc)) from exc
        attrs["booking"] = booking
        return attrs

    def create(self, validated_data):
        return validated_data["booking"]


class BookingSerializer(serializers.ModelSerializer):
    offer_name = serializers.CharField(source="offer.name", read_only=True)
    venue_name = serializers.CharField(source="venue.name", read_only=True)
    duration_minutes = serializers.IntegerField(source="offer.duration_minutes", read_only=True)
    timeslot_date = serializers.DateField(source="timeslot.date", read_only=True, default=None)
    timeslot_start = serializers.TimeField(source="timeslot.start_time", read_only=True, default=None)
    timeslot_end = serializers.TimeField(source="timeslot.end_time", read_only=True, default=None)

    class Meta:
        model = Booking
        fields = ("id", "venue_name", "offer_name", "price", "employee_commission",
                  "venue_net_payout", "status", "check_in_code", "reserved_at", "expires_at",
                  "checked_in_at", "cancelled_at", "duration_minutes",
                  "timeslot_date", "timeslot_start", "timeslot_end")
        read_only_fields = fields
