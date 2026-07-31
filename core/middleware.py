"""Helper middleware: enforce role-based access at the HTTP layer.
Real logic lives in the views/serializers; this is a thin guard for
admin/venue/staff surfaces that don't go through DRF."""
import threading

_local = threading.local()


def get_role(request):
    user = getattr(request, "user", None)
    if user and user.is_authenticated:
        return getattr(user, "role", "anonymous")
    return "anonymous"


class RoleMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _local.role = get_role(request)
        return self.get_response(request)
