"""
Auth endpoints:
- POST /auth/otp-request/  {phone_number}
- POST /auth/otp-verify/    {phone_number, code}  -> {access, refresh}
- POST /auth/token/refresh/ {refresh}
- GET/PATCH /auth/profile/  {name, sheba}
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import OTPRequestView, OTPVerifyView, ProfileView

urlpatterns = [
    path("otp-request/", OTPRequestView.as_view(), name="otp-request"),
    path("otp-verify/", OTPVerifyView.as_view(), name="otp-verify"),
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("profile/", ProfileView.as_view(), name="profile"),
]
