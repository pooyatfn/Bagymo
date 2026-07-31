"""Catalog serializers."""
from rest_framework import serializers
from .models import Category, Venue, Offer


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "slug", "name_en", "name_fa", "icon_class", "is_active")


class OfferSerializer(serializers.ModelSerializer):
    venue_name = serializers.CharField(source="venue.name", read_only=True)

    class Meta:
        model = Offer
        fields = ("id", "name", "description", "price", "venue_payout", "duration_minutes",
                  "capacity_per_slot", "gender_restriction", "is_active", "venue", "venue_name")
        read_only_fields = ("venue",)


class VenueSerializer(serializers.ModelSerializer):
    offers = OfferSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source="category.name_en", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)

    class Meta:
        model = Venue
        fields = ("id", "name", "category", "category_name", "category_slug", "address", "lat", "lng",
                  "district", "city", "gender_policy", "description", "phone", "owner_name",
                  "offers", "status", "is_verified", "created_at")
        read_only_fields = ("status", "is_verified", "created_at")


class VenueOnboardingSerializer(serializers.ModelSerializer):
    category_slug = serializers.SlugField(write_only=True)

    class Meta:
        model = Venue
        fields = ("id", "name", "category_slug", "address", "lat", "lng",
                  "district", "city", "gender_policy", "description", "phone", "owner_name")

    def validate_category_slug(self, value):
        try:
            return Category.objects.get(slug=value, is_active=True)
        except Category.DoesNotExist:
            raise serializers.ValidationError(f"Category '{value}' not found")


class OfferCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offer
        fields = ("id", "name", "description", "price", "venue_payout", "duration_minutes",
                  "capacity_per_slot", "gender_restriction")
