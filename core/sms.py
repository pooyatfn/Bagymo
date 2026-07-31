"""
SMS notification service via Kavenegar (Iran).
Fallback: print to stdout in dev mode.
"""
from django.conf import settings


def send_sms(phone: str, message: str) -> bool:
    """Send an SMS via Kavenegar. Returns True on success."""
    if not settings.KAVENEGAR_API_KEY:
        print(f"[SMS] dev → {phone}: {message}", flush=True)
        return True

    try:
        from kavenegar import KavenegarAPI
        api = KavenegarAPI(settings.KAVENEGAR_API_KEY)
        api.call("message.send", {
            "receptor": phone,
            "message": message,
            "sender": settings.KAVENEGAR_SENDER or "",
        })
        return True
    except Exception as exc:
        print(f"[SMS] Kavenegar failed: {exc}")
        return False


def send_otp_sms(phone: str, code: str) -> bool:
    """Send OTP verification code."""
    return send_sms(phone, f"باجیمو: کد تایید شما {code} است. این کد تا ۵ دقیقه معتبر است.")


def send_booking_confirmation(phone: str, venue_name: str, offer_name: str, check_in_code: str) -> bool:
    """Send booking confirmation with check-in code."""
    return send_sms(
        phone,
        f"باجیمو: رزرو شما در {venue_name} ({offer_name}) تایید شد.\n"
        f"کد ورود: {check_in_code}\nاین کد را به کارمند باشگاه نشان دهید."
    )


def send_checkin_confirmation(phone: str, venue_name: str) -> bool:
    """Send check-in confirmation."""
    return send_sms(phone, f"باجیمو: ورود شما در {venue_name} تایید شد. لطفاً از تمرین لذت ببرید!")


def send_booking_cancellation(phone: str, venue_name: str, amount: int) -> bool:
    """Send booking cancellation + refund notice."""
    return send_sms(
        phone,
        f"باجیمو: رزرو شما در {venue_name} لغو شد.\n"
        f"مبلغ {amount:,} تومان به بودجه شما بازگردانده شد."
    )
