"""API root."""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.reverse import reverse as drf_reverse


@api_view(["GET"])
@permission_classes([AllowAny])
def api_root(request):
    return Response(
        {
            "auth": drf_reverse("otp-request", request=request),
            "catalog": "/api/catalog/venues/",
            "bookings": "/api/bookings/",
        }
    )
