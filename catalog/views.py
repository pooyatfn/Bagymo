"""Catalog views."""
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .models import Venue, Offer, Category, TimeSlot, VenueRating
from .serializers import (
    VenueSerializer, OfferSerializer, CategorySerializer,
    VenueOnboardingSerializer, OfferCreateSerializer, VenueRatingSerializer,
)
from core.permissions import IsVenueStaff, IsAdmin
from core.sms import send_sms
from accounts.models import User


class VenueViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Venue.objects.filter(status=Venue.Status.ACTIVE).select_related("category").prefetch_related("offers", "gender_slots")
    serializer_class = VenueSerializer
    permission_classes = [AllowAny]

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
@permission_classes([AllowAny])
def register_venue_public(request):
    """Public venue registration: creates venue + venue_staff user."""
    ser = VenueOnboardingSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    category = ser.validated_data.pop("category_slug")
    venue = Venue.objects.create(category=category, status="pending", **ser.validated_data)

    phone = request.data.get("phone")
    name = request.data.get("name", "")
    password = request.data.get("password")
    if not phone or not password:
        return Response({"detail": "phone and password required"}, status=400)

    if User.objects.filter(phone_number=phone).exists():
        return Response({"detail": "phone already registered"}, status=400)
    user = User.objects.create_user(
        phone_number=phone,
        name=name,
        role="venue_staff",
        venue=venue,
        is_active=True,
        is_verified=True,
    )
    user.set_password(password)
    user.save()

    admins = User.objects.filter(role="admin")
    for admin in admins:
        send_sms(admin.phone_number, f"باجیمو: مجتمع جدید «{venue.name}» ثبت نام کرد. بررسی کنید.")

    return Response(VenueSerializer(venue).data, status=status.HTTP_201_CREATED)


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
        send_sms(admin.phone_number, f"باجیمو: باشگاه جدید «{venue.name}» ثبت نام کرد. بررسی کنید.")
    return Response(VenueSerializer(venue).data, status=status.HTTP_201_CREATED)


@api_view(["GET", "POST", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def venue_offers(request, offer_id=None):
    """List, create, update, or delete offers for the logged-in venue staff's venue."""
    user = request.user
    if user.role != "venue_staff" or not user.venue:
        return Response({"detail": "venue staff only"}, status=403)

    # Single offer operations (PATCH / DELETE)
    if offer_id is not None:
        try:
            offer = Offer.objects.get(pk=offer_id, venue=user.venue)
        except Offer.DoesNotExist:
            return Response({"detail": "offer not found"}, status=404)

        if request.method == "PATCH":
            ser = OfferCreateSerializer(offer, data=request.data, partial=True)
            ser.is_valid(raise_exception=True)
            ser.save()
            return Response(OfferSerializer(ser.instance).data)

        if request.method == "DELETE":
            if offer.bookings.filter(status__in=["reserved", "paid", "checked_in"]).exists():
                return Response({"detail": "cannot delete offer with active bookings"}, status=400)
            offer.delete()
            return Response(status=204)

    # List / Create
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
        send_sms(staff.phone_number, f"باجیمو: باشگاه «{venue.name}» تایید شد! اکنون می‌توانید آفر ایجاد کنید.")
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
        send_sms(staff.phone_number, f"باجیمو: باشگاه «{venue.name}» رد شد. دلیل: {reason}")
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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def venue_ratings(request, venue_id):
    """List all ratings for a venue."""
    ratings = VenueRating.objects.filter(venue_id=venue_id).select_related("user")
    return Response(VenueRatingSerializer(ratings, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_venue_rating(request, venue_id):
    """Employee: rate a venue (must have a completed/checked-in booking there)."""
    user = request.user
    if user.role != "user":
        return Response({"detail": "users only"}, status=403)

    try:
        venue = Venue.objects.get(pk=venue_id)
    except Venue.DoesNotExist:
        return Response({"detail": "venue not found"}, status=404)

    from bookings.models import Booking
    has_booking = Booking.objects.filter(
        employee=user, venue=venue, status__in=["checked_in", "completed"]
    ).exists()
    if not has_booking:
        return Response({"detail": "you must have a completed reservation at this venue"}, status=400)

    score = request.data.get("score")
    comment = request.data.get("comment", "")
    if not score or not (1 <= int(score) <= 5):
        return Response({"detail": "score must be between 1 and 5"}, status=400)

    rating, created = VenueRating.objects.update_or_create(
        venue=venue, user=user,
        defaults={"score": int(score), "comment": comment},
    )
    return Response(VenueRatingSerializer(rating).data, status=201 if created else 200)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def company_info(request):
    """Employee/company_admin: get their company info."""
    user = request.user
    if not user.company:
        return Response({"detail": "no company assigned"}, status=404)
    company = user.company
    employee_count = company.users.filter(role="user").count()
    return Response({
        "id": company.id,
        "name": company.name,
        "default_annual_budget": company.default_annual_budget,
        "employee_count": employee_count,
        "is_active": company.is_active,
        "status": company.status,
        "created_at": company.created_at,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_companies(request):
    """Admin: list all companies with employee and booking stats."""
    if request.user.role != "admin":
        return Response({"detail": "forbidden"}, status=403)
    from .models import Company
    companies = Company.objects.all().order_by("-created_at")
    data = []
    for c in companies:
        employees = c.users.filter(role="user")
        emp_count = employees.count()
        from bookings.models import Booking
        bookings = Booking.objects.filter(company=c)
        total_bookings = bookings.count()
        total_spent = sum(b.price for b in bookings.exclude(status="cancelled"))
        data.append({
            "id": c.id,
            "name": c.name,
            "domain": c.domain,
            "default_annual_budget": c.default_annual_budget,
            "employee_count": emp_count,
            "total_bookings": total_bookings,
            "total_spent": total_spent,
            "is_active": c.is_active,
            "status": c.status,
            "created_at": c.created_at,
        })
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def pending_companies(request):
    """Admin: list pending companies awaiting approval."""
    if request.user.role != "admin":
        return Response({"detail": "admin only"}, status=403)
    from .models import Company
    companies = Company.objects.filter(status=Company.Status.PENDING).order_by("-created_at")
    data = []
    for c in companies:
        admin = c.users.filter(role="company_admin").first()
        data.append({
            "id": c.id,
            "name": c.name,
            "domain": c.domain,
            "default_annual_budget": c.default_annual_budget,
            "admin_name": admin.name if admin else None,
            "admin_phone": admin.phone_number if admin else None,
            "created_at": c.created_at,
        })
    return Response(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def approve_company(request, company_id):
    """Admin: approve a pending company. Activates the company_admin user."""
    if request.user.role != "admin":
        return Response({"detail": "admin only"}, status=403)
    from .models import Company
    from accounts.models import User
    try:
        company = Company.objects.get(pk=company_id)
    except Company.DoesNotExist:
        return Response({"detail": "company not found"}, status=404)
    if company.status != Company.Status.PENDING:
        return Response({"detail": "company is not pending."}, status=400)
    company.status = Company.Status.ACTIVE
    company.is_active = True
    company.save(update_fields=["status", "is_active"])
    admin = company.users.filter(role="company_admin").first()
    if admin:
        admin.is_active = True
        admin.save(update_fields=["is_active"])
        send_sms(admin.phone_number, f"باجیمو: شرکت «{company.name}» تأیید شد! اکنون می‌توانید وارد شوید.")
    return Response({"ok": True, "detail": "Company approved"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reject_company(request, company_id):
    """Admin: reject (suspend) a pending company."""
    if request.user.role != "admin":
        return Response({"detail": "admin only"}, status=403)
    from .models import Company
    from accounts.models import User
    try:
        company = Company.objects.get(pk=company_id)
    except Company.DoesNotExist:
        return Response({"detail": "company not found"}, status=404)
    if company.status != Company.Status.PENDING:
        return Response({"detail": "company is not pending."}, status=400)
    reason = request.data.get("reason", "")
    company.status = Company.Status.SUSPENDED
    company.is_active = False
    company.save(update_fields=["status", "is_active"])
    admin = company.users.filter(role="company_admin").first()
    if admin:
        admin.is_active = False
        admin.save(update_fields=["is_active"])
        msg = f"باجیمو: ثبت شرکت «{company.name}» رد شد."
        if reason:
            msg += f" دلیل: {reason}"
        send_sms(admin.phone_number, msg)
    return Response({"ok": True, "detail": "Company rejected"})
