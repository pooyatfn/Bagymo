"""Catalog views."""
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Venue, Offer, Category, TimeSlot
from .serializers import (
    VenueSerializer, OfferSerializer, CategorySerializer,
    VenueOnboardingSerializer, OfferCreateSerializer,
)
from core.permissions import IsVenueStaff, IsAdmin
from core.sms import send_sms


class VenueViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Venue.objects.filter(status=Venue.Status.ACTIVE).select_related("category").prefetch_related("offers")
    serializer_class = VenueSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        lat = self.request.query_params.get("lat")
        lng = self.request.query_params.get("lng")
        radius = int(self.request.query_params.get("radius", 10000))
        if lat and lng:
            try:
                la, ln = float(lat), float(lng)
                delta = radius / 111000.0
                qs = qs.filter(
                    lat__range=(la - delta, la + delta),
                    lng__range=(ln - delta, ln + delta),
                )
            except Exception:
                pass
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category__slug=category)
        return qs

    @action(detail=True, methods=["get"], url_path="offers")
    def offers(self, request, pk=None):
        venue = self.get_object()
        ser = OfferSerializer(venue.offers.filter(is_active=True), many=True)
        return Response(ser.data)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    lookup_field = "slug"


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def register_venue(request):
    """Venue partner registers their venue."""
    user = request.user
    ser = VenueOnboardingSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    category = ser.validated_data.pop("category_slug")
    venue = Venue.objects.create(category=category, status="pending", **ser.validated_data)
    user.role = "venue_staff"
    user.venue = venue
    user.save(update_fields=["role", "venue"])
    # notify admin
    from accounts.models import User
    admins = User.objects.filter(role="admin")
    for admin in admins:
        send_sms(admin.phone_number, f"باجم: باشگاه جدید «{venue.name}» ثبت نام کرد. بررسی کنید.")
    return Response(VenueSerializer(venue).data, status=status.HTTP_201_CREATED)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def venue_offers(request):
    """List or create offers for the logged-in venue staff's venue."""
    user = request.user
    if user.role != "venue_staff" or not user.venue:
        return Response({"detail": "venue staff only"}, status=403)

    if request.method == "GET":
        offers = Offer.objects.filter(venue=user.venue)
        return Response(OfferSerializer(offers, many=True).data)

    ser = OfferCreateSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    offer = ser.save(venue=user.venue)
    return Response(OfferSerializer(offer).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def venue_profile(request):
    """Get the venue profile for the logged-in venue staff."""
    user = request.user
    if user.role != "venue_staff" or not user.venue:
        return Response({"detail": "venue staff only"}, status=403)
    return Response(VenueSerializer(user.venue).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def venue_profile_update(request):
    """Update the venue profile for the logged-in venue staff."""
    user = request.user
    if user.role != "venue_staff" or not user.venue:
        return Response({"detail": "venue staff only"}, status=403)
    ser = VenueOnboardingSerializer(user.venue, data=request.data, partial=True)
    ser.is_valid(raise_exception=True)
    category_slug = ser.validated_data.pop("category_slug", None)
    if category_slug:
        user.venue.category = category_slug
    for k, v in ser.validated_data.items():
        setattr(user.venue, k, v)
    user.venue.save()
    return Response(VenueSerializer(user.venue).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def pending_venues(request):
    """Admin: list pending venues."""
    if request.user.role != "admin":
        return Response({"detail": "admin only"}, status=403)
    venues = Venue.objects.filter(status="pending").select_related("category")
    return Response(VenueSerializer(venues, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def approve_venue(request, venue_id):
    """Admin: approve a pending venue."""
    if request.user.role != "admin":
        return Response({"detail": "admin only"}, status=403)
    try:
        venue = Venue.objects.get(pk=venue_id)
    except Venue.DoesNotExist:
        return Response({"detail": "venue not found"}, status=404)
    venue.status = Venue.Status.ACTIVE
    venue.is_verified = True
    venue.save(update_fields=["status", "is_verified"])
    # notify venue staff
    staff = venue.staff.first()
    if staff:
        send_sms(staff.phone_number, f"باجم: باشگاه «{venue.name}» تایید شد! اکنون می‌توانید آفر ایجاد کنید.")
    return Response({"ok": True, "detail": "Venue approved"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reject_venue(request, venue_id):
    """Admin: reject a pending venue."""
    if request.user.role != "admin":
        return Response({"detail": "admin only"}, status=403)
    try:
        venue = Venue.objects.get(pk=venue_id)
    except Venue.DoesNotExist:
        return Response({"detail": "venue not found"}, status=404)
    reason = request.data.get("reason", "")
    venue.status = Venue.Status.SUSPENDED
    venue.save(update_fields=["status"])
    staff = venue.staff.first()
    if staff:
        send_sms(staff.phone_number, f"باجم: باشگاه «{venue.name}» رد شد. دلیل: {reason}")
    return Response({"ok": True, "detail": "Venue rejected"})


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def offer_timeslots(request, offer_id):
    """List or create timeslots for an offer."""
    try:
        offer = Offer.objects.get(pk=offer_id)
    except Offer.DoesNotExist:
        return Response({"detail": "offer not found"}, status=404)

    if request.method == "GET":
        date_from = request.query_params.get("date")
        qs = TimeSlot.objects.filter(offer=offer, is_active=True)
        if date_from:
            qs = qs.filter(date__gte=date_from)
        return Response([{
            "id": s.id, "date": s.date, "start_time": s.start_time, "end_time": s.end_time,
            "capacity": s.capacity, "booked_count": s.booked_count,
            "remaining": s.remaining_capacity, "is_available": s.is_available,
        } for s in qs.order_by("date", "start_time")])

    # POST: create timeslot
    user = request.user
    if user.role != "venue_staff" or not user.venue:
        return Response({"detail": "venue staff only"}, status=403)
    if offer.venue != user.venue:
        return Response({"detail": "not your offer"}, status=403)

    from rest_framework import serializers as drf_serializers
    class SlotSerializer(drf_serializers.Serializer):
        date = drf_serializers.DateField()
        start_time = drf_serializers.TimeField()
        end_time = drf_serializers.TimeField()
        capacity = drf_serializers.IntegerField(default=0, min_value=0)

    ser = SlotSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    slot, created = TimeSlot.objects.get_or_create(
        offer=offer, date=ser.validated_data["date"], start_time=ser.validated_data["start_time"],
        defaults={"end_time": ser.validated_data["end_time"], "capacity": ser.validated_data["capacity"]},
    )
    if not created:
        return Response({"detail": "timeslot already exists"}, status=400)
    return Response({"id": slot.id, "date": slot.date, "start_time": slot.start_time,
                     "end_time": slot.end_time, "capacity": slot.capacity}, status=201)
