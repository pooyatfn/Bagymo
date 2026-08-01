"""
Custom permissions:
- IsCompanyAdmin / IsVerifiedEmployee / IsVenueStaff
Used to guard the HR & company-facing endpoints.
"""
from rest_framework import permissions


class IsCompanyAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.role == "company_admin"
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
