"""Bookings serializers."""
from rest_framework import serializers
from bookings.models import Booking


class BookingCreateSerializer(serializers.Serializer):
    offer_id = serializers.IntegerField()
    timeslot_id = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, attrs):
        from django.db import transaction
        from django.utils import timezone
        from catalog.models import Offer, VenueCompanyAccess, TimeSlot
        from billing.services import reserve_booking
        offer = Offer.objects.select_related("venue").get(id=attrs["offer_id"])
        user = self.context["request"].user
        # enforce company × venue access
        if not VenueCompanyAccess.objects.filter(venue=offer.venue, company=user.company, is_active=True).exists():
            raise serializers.ValidationError("This venue is not contracted for your company.")
        # enforce gender policy
        if user.gender:
            current_gender = offer.venue.gender_for_now()
            if current_gender != "mixed" and current_gender != user.gender:
                gender_label = "مردانه" if current_gender == "male" else "زنانه"
                raise serializers.ValidationError(f"این باشگاه در حال حاضر {gender_label} است.")
        # validate timeslot if provided
        timeslot = None
        timeslot_id = attrs.get("timeslot_id")
        if timeslot_id:
            try:
                timeslot = TimeSlot.objects.get(pk=timeslot_id, offer=offer, is_active=True)
            except TimeSlot.DoesNotExist:
                raise serializers.ValidationError({"timeslot_id": "زمان رزرو معتبر نیست."})
            if not timeslot.is_available:
                raise serializers.ValidationError({"timeslot_id": "ظرفیت این زمان تکمیل شده."})
        # reserve_booking atomically debits budget + creates booking
        booking = reserve_booking(user, offer, timeslot=timeslot)
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
