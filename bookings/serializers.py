"""Bookings serializers."""
from rest_framework import serializers
from bookings.models import Booking


class BookingCreateSerializer(serializers.Serializer):
    offer_id = serializers.IntegerField()

    def validate(self, attrs):
        from django.db import transaction
        from django.utils import timezone
        from catalog.models import Offer, VenueCompanyAccess
        from billing.services import reserve_booking
        offer = Offer.objects.select_related("venue").get(id=attrs["offer_id"])
        user = self.context["request"].user
        # enforce company × venue access
        if not VenueCompanyAccess.objects.filter(venue=offer.venue, company=user.company, is_active=True).exists():
            raise serializers.ValidationError("This venue is not contracted for your company.")
        # reserve_booking atomically debits budget + creates booking
        booking = reserve_booking(user, offer)
        attrs["booking"] = booking
        return attrs

    def create(self, validated_data):
        return validated_data["booking"]


class BookingSerializer(serializers.ModelSerializer):
    offer_name = serializers.CharField(source="offer.name", read_only=True)
    venue_name = serializers.CharField(source="venue.name", read_only=True)

    class Meta:
        model = Booking
        fields = ("id", "venue_name", "offer_name", "price", "employee_commission",
                  "venue_net_payout", "status", "check_in_code", "reserved_at", "expires_at")
        read_only_fields = fields
