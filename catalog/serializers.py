"""Catalog serializers."""
from rest_framework import serializers
from .models import Category, Venue, Offer


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "slug", "name_en", "name_fa", "icon_class", "is_active")


class OfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offer
        fields = ("id", "name", "description", "price", "venue_payout", "duration_minutes",
                  "capacity_per_slot", "gender_restriction", "is_active")


class VenueSerializer(serializers.ModelSerializer):
    offers = OfferSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)
    distance_m = serializers.SerializerMethodField()

    class Meta:
        model = Venue
        fields = ("id", "name", "category", "address", "lat", "lng", "gender_policy",
                  "offers", "status", "distance_m")
        read_only_fields = ("lat", "lng")

    def get_distance_m(self, obj):
        return None  # computed client-side; set from request ctx if needed
