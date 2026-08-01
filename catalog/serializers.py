"""Catalog serializers."""
from rest_framework import serializers
from django.db.models import Avg
from .models import Category, Venue, Offer, VenueGenderSlot, VenueRating


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


class VenueGenderSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = VenueGenderSlot
        fields = ("id", "day_of_week", "start_time", "end_time", "gender", "is_active")


class VenueRatingSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.name", read_only=True, default="")
    user_phone = serializers.CharField(source="user.phone_number", read_only=True)

    class Meta:
        model = VenueRating
        fields = ("id", "venue", "user", "user_name", "user_phone", "score", "comment", "created_at", "updated_at")
        read_only_fields = ("user", "created_at", "updated_at")


class VenueSerializer(serializers.ModelSerializer):
    offers = OfferSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source="category.name_en", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    gender_slots = VenueGenderSlotSerializer(many=True, read_only=True)
    gender_for_now = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    rating_count = serializers.SerializerMethodField()

    class Meta:
        model = Venue
        fields = ("id", "name", "category", "category_name", "category_slug", "address", "lat", "lng",
                  "district", "city", "gender_policy", "gender_for_now", "gender_slots",
                  "description", "phone", "owner_name",
                  "offers", "status", "is_verified", "created_at",
                  "avg_rating", "rating_count")
        read_only_fields = ("status", "is_verified", "created_at")

    def get_gender_for_now(self, obj):
        return obj.gender_for_now()

    def get_avg_rating(self, obj):
        avg = obj.ratings.aggregate(avg=Avg("score"))["avg"]
        return round(avg, 1) if avg else None

    def get_rating_count(self, obj):
        return obj.ratings.count()


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
