"""Catalog views."""
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Venue, Offer, Category
from .serializers import (
    VenueSerializer, OfferSerializer, CategorySerializer,
    VenueOnboardingSerializer, OfferCreateSerializer,
)
from core.permissions import IsVenueStaff


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
