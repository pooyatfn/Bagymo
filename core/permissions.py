"""
Custom DRF permissions used to guard role-specific endpoints.
"""
from rest_framework import permissions

#: Roles that manage a company's employees and budgets.
COMPANY_MANAGER_ROLES = ("company_admin", "company_hr")


class IsCompanyAdmin(permissions.BasePermission):
    """Company admin or HR user that belongs to a company."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated and user.role in COMPANY_MANAGER_ROLES and user.company_id
        )

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsEmployee(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "user")


class IsVenueStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.role == "venue_staff"
        )


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.role == "admin"
        ) or bool(request.user and request.user.is_superuser)
