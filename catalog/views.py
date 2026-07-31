"""Catalog views."""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Venue, Offer, Category
from .serializers import VenueSerializer, OfferSerializer, CategorySerializer


class VenueViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Venue.objects.filter(status=Venue.Status.ACTIVE).select_related("category").prefetch_related("offers")
    serializer_class = VenueSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        lat = self.request.query_params.get("lat")
        lng = self.request.query_params.get("lng")
        radius = int(self.request.query_params.get("radius", 10000))  # meters
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
