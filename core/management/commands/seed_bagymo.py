"""
Seed script for bagymo MVP demo.
Creates: 1 company, 3 employees, 10 offers across 3 gyms, 1 venue staff,
and runs a demo booking to verify the commission math.
Run:  python manage.py seed_bagymo
"""
from datetime import date, time, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import User
from billing.services import reserve_booking
from catalog.models import Category, Company, Offer, TimeSlot, Venue, VenueCompanyAccess, VenueGenderSlot, VenueRating

DEMO_COMPANY_NAME = "شرکت نمونه باجیمو"

SAMPLE_GYMS = [
    {"name": "آهنگ زندگی", "address": "ولیعصر، بالاتر از میرداماد", "lat": 35.7664, "lng": 51.4121, "phone": "021-22221111", "district": "میرداماد", "city": "Tehran", "gender_policy": "mixed", "category": "gym", "description": "باشگاه بدنسازی و فیتنس با تجهیزات مدرن"},
    {"name": "پولادین", "address": "خیابان ولیعصر، نبش کوچه بورس", "lat": 35.7210, "lng": 51.3950, "phone": "021-88887777", "district": "انقلاب", "city": "Tehran", "gender_policy": "mixed", "category": "gym", "description": "باشگاه بدنسازی حرفه‌ای با مربیان مجرب"},
    {"name": "آرسی", "address": "ونک، بلوار شهید حقانی", "lat": 35.7810, "lng": 51.4260, "phone": "021-22003300", "district": "ونک", "city": "Tehran", "gender_policy": "mixed", "category": "gym", "description": "باشگاه بدنسازی و فیتنس وانک"},
    {"name": "تکسان", "address": "سعادت آباد، بلوار پاکنژاد", "lat": 35.7850, "lng": 51.3620, "phone": "021-88445566", "district": "سعادت آباد", "city": "Tehran", "gender_policy": "mixed", "category": "gym", "description": "باشگاه بدنسازی سعادت آباد"},
    {"name": "بادی فیتنس", "address": "تهرانپارس، خیابان ۱۹۶ شرقی", "lat": 35.7440, "lng": 51.5020, "phone": "021-77665544", "district": "تهرانپارس", "city": "Tehran", "gender_policy": "mixed", "category": "gym", "description": "باشگاه بدنسازی تهرانپارس"},
    {"name": "استخر و سونا نگین", "address": "نیاوران، خیابان م المقدسی", "lat": 35.8050, "lng": 51.4580, "phone": "021-22881100", "district": "نیاوران", "city": "Tehran", "gender_policy": "mixed", "category": "pool", "description": "استخر سرپوشیده و سونا و جکوزی"},
    {"name": "استخر المپیک", "address": "باقرشهر، بلوار الغدیر", "lat": 35.6200, "lng": 51.4800, "phone": "021-55443322", "district": "باقرشهر", "city": "Tehran", "gender_policy": "mixed", "category": "pool", "description": "استخر المپیک با امکانات کامل"},
    {"name": "سینما آزادی", "address": "آزادی، میدان آزادی", "lat": 35.6990, "lng": 51.3370, "phone": "021-66445500", "district": "آزادی", "city": "Tehran", "gender_policy": "mixed", "category": "cinema", "description": "سینما چند سالنه با صندلی‌های راحت"},
    {"name": "سینما کوروش", "address": "تهرانسر، بلوار شهید لشکری", "lat": 35.6830, "lng": 51.2430, "phone": "021-44556677", "district": "تهرانسر", "city": "Tehran", "gender_policy": "mixed", "category": "cinema", "description": "سینما کوروش با سیستم صوتی دالبی"},
    {"name": "یوگا شیراز", "address": "خیابان شیراز، بالاتر از میدان فلسطین", "lat": 35.7180, "lng": 51.3960, "phone": "021-33221100", "district": "انقلاب", "city": "Tehran", "gender_policy": "female", "category": "yoga", "description": "مرکز یوگا و مدیتیشن بانوان"},
    {"name": "باشگاه اسکواش پارسیان", "address": "ولنجک، خیابان ۳۲", "lat": 35.7980, "lng": 51.3890, "phone": "021-22114455", "district": "ولنجک", "city": "Tehran", "gender_policy": "male", "category": "sport", "description": "باشگاه اسکواش حرفه‌ای"},
    # --- مجموعه‌های بیشتر برای تست ---
    {"name": "باشگاه فرمانیه فیت", "address": "فرمانیه، خیابان مقدس اردبیلی", "lat": 35.7990, "lng": 51.4640, "phone": "021-22990011", "district": "فرمانیه", "city": "Tehran", "gender_policy": "mixed", "category": "gym", "description": "باشگاه بدنسازی با سالن کراس‌فیت و تجهیزات هوازی"},
    {"name": "باشگاه ستارخان استار", "address": "ستارخان، خیابان باقرخان", "lat": 35.7100, "lng": 51.3600, "phone": "021-66001122", "district": "ستارخان", "city": "Tehran", "gender_policy": "male", "category": "gym", "description": "باشگاه آقایان با کلاس‌های وزنه و بدنسازی"},
    {"name": "باشگاه بانوان نیلوفر", "address": "جردن، خیابان گل‌آذین", "lat": 35.7670, "lng": 51.4120, "phone": "021-22330044", "district": "جردن", "city": "Tehran", "gender_policy": "female", "category": "gym", "description": "باشگاه بانوان با کلاس‌های گروهی و مربی خصوصی"},
    {"name": "باشگاه شهرک غرب فیت", "address": "شهرک غرب، بلوار فرحزادی", "lat": 35.7580, "lng": 51.3700, "phone": "021-88110022", "district": "شهرک غرب", "city": "Tehran", "gender_policy": "mixed", "category": "gym", "description": "باشگاه مجهز با سالن بدنسازی و استپ"},
    {"name": "باشگاه پاسداران پلاس", "address": "پاسداران، نرسیده به بوستان گیشا", "lat": 35.7930, "lng": 51.4560, "phone": "021-22770033", "district": "پاسداران", "city": "Tehran", "gender_policy": "mixed", "category": "gym", "description": "باشگاه بدنسازی با سونای خشک"},
    {"name": "باشگاه کرج پاور", "address": "کرج، گوهردشت، بلوار طالقانی", "lat": 35.8200, "lng": 50.9300, "phone": "026-34001122", "district": "گوهردشت", "city": "Karaj", "gender_policy": "mixed", "category": "gym", "description": "باشگاه بدنسازی گوهردشت"},
    {"name": "استخر آبی ونک", "address": "ونک، خیابان ملاصدرا", "lat": 35.7580, "lng": 51.4050, "phone": "021-88000011", "district": "ونک", "city": "Tehran", "gender_policy": "mixed", "category": "pool", "description": "استخر سرپوشیده با آب گرم و سانس‌بندی"},
    {"name": "استخر بانوان مروارید", "address": "پونک، بلوار اشرفی اصفهانی", "lat": 35.7700, "lng": 51.3300, "phone": "021-44220066", "district": "پونک", "city": "Tehran", "gender_policy": "female", "category": "pool", "description": "استخر ویژه بانوان با مربی شنا"},
    {"name": "مجموعه آبی شرق", "address": "نارمک، خیابان هفده شهریور", "lat": 35.7300, "lng": 51.5000, "phone": "021-77003344", "district": "نارمک", "city": "Tehran", "gender_policy": "mixed", "category": "pool", "description": "استخر و جکوزی در شرق تهران"},
    {"name": "سینما بهمن", "address": "میدان ونک، ابتدای ملاصدرا", "lat": 35.7570, "lng": 51.4100, "phone": "021-88220055", "district": "ونک", "city": "Tehran", "gender_policy": "mixed", "category": "cinema", "description": "سینما با چهار سالن و کافه"},
    {"name": "سینما شهر", "address": "خیابان کریمخان، نبش ایرانشهر", "lat": 35.7140, "lng": 51.4180, "phone": "021-88330066", "district": "کریمخان", "city": "Tehran", "gender_policy": "mixed", "category": "cinema", "description": "سینمای مرکز شهر با اکران روزانه"},
    {"name": "سینما شمال", "address": "تجریش، خیابان شریعتی", "lat": 35.8040, "lng": 51.4300, "phone": "021-22660077", "district": "تجریش", "city": "Tehran", "gender_policy": "mixed", "category": "cinema", "description": "سینمای خانوادگی در شمال تهران"},
    {"name": "استودیو یوگا آرامش", "address": "سعادت‌آباد، خیابان سرو غربی", "lat": 35.7870, "lng": 51.3680, "phone": "021-88550088", "district": "سعادت‌آباد", "city": "Tehran", "gender_policy": "mixed", "category": "yoga", "description": "کلاس‌های یوگا و پیلاتس"},
    {"name": "یوگا بانوان بهار", "address": "الهیه، خیابان شهید فلاحی", "lat": 35.7950, "lng": 51.4250, "phone": "021-22440099", "district": "الهیه", "city": "Tehran", "gender_policy": "female", "category": "yoga", "description": "کلاس صبحگاهی یوگا و مدیتیشن"},
    {"name": "مرکز مدیتیشن و پیلاتس سکوت", "address": "قیطریه، خیابان شهید شاه‌نظری", "lat": 35.7980, "lng": 51.4400, "phone": "021-22110033", "district": "قیطریه", "city": "Tehran", "gender_policy": "mixed", "category": "yoga", "description": "فضای آرام با کلاس‌های گروهی کوچک"},
    {"name": "زمین چمن مصنوعی شقایق", "address": "شهرک قدس، خیابان ایران‌زمین", "lat": 35.7600, "lng": 51.3500, "phone": "021-88660011", "district": "شهرک قدس", "city": "Tehran", "gender_policy": "male", "category": "sport", "description": "زمین مینی‌فوتبال با نورپردازی شبانه"},
    {"name": "مجموعه والیبال و بسکتبال ایثار", "address": "انقلاب، خیابان فخر رازی", "lat": 35.7010, "lng": 51.3930, "phone": "021-66770044", "district": "انقلاب", "city": "Tehran", "gender_policy": "mixed", "category": "sport", "description": "سالن چندمنظوره برای والیبال و بسکتبال"},
    {"name": "باشگاه تنیس ولیعصر", "address": "ولیعصر، بالاتر از پارک ملت", "lat": 35.7550, "lng": 51.4130, "phone": "021-22880055", "district": "ولیعصر", "city": "Tehran", "gender_policy": "mixed", "category": "sport", "description": "زمین‌های تنیس خاکی با امکان مربی"},
    {"name": "سالن بدمینتون صبا", "address": "تهران‌پارس، خیابان ۱۸۰ شرقی", "lat": 35.7420, "lng": 51.5100, "phone": "021-77889900", "district": "تهرانپارس", "city": "Tehran", "gender_policy": "mixed", "category": "sport", "description": "سالن بدمینتون با زمین‌های استاندارد"},
    {"name": "باشگاه اسکواش و اسنوکر کیان", "address": "میرداماد، خیابان مرزداران", "lat": 35.7580, "lng": 51.4240, "phone": "021-22990077", "district": "میرداماد", "city": "Tehran", "gender_policy": "mixed", "category": "sport", "description": "زمین اسکواش و میز اسنوکر"},
]

# مجموعه‌های بیشتر با پراکندگی در تهران و کرج: (نام، دسته، محله، شهر، عرض، طول، جنسیت)
_SPREAD = [
    # شمال تهران
    ("باشگاه تجریش فیت", "gym", "تجریش", "Tehran", 35.8040, 51.4290, "mixed"),
    ("باشگاه زعفرانیه کلاب", "gym", "زعفرانیه", "Tehran", 35.8100, 51.4040, "mixed"),
    ("باشگاه الهیه پاور", "gym", "الهیه", "Tehran", 35.7960, 51.4220, "male"),
    ("باشگاه بانوان یاس", "gym", "نیاوران", "Tehran", 35.8130, 51.4650, "female"),
    ("استخر لاله نیاوران", "pool", "نیاوران", "Tehran", 35.8080, 51.4600, "mixed"),
    ("یوگا و پیلاتس زعفرانیه", "yoga", "زعفرانیه", "Tehran", 35.8090, 51.4000, "female"),
    ("زمین تنیس لواسانی", "sport", "اندرزگو", "Tehran", 35.7900, 51.4700, "mixed"),
    ("سینما ایران‌مال", "cinema", "ایران‌مال", "Tehran", 35.7390, 51.2200, "mixed"),
    # شمال‌غرب و غرب
    ("باشگاه اکباتان استار", "gym", "اکباتان", "Tehran", 35.7000, 51.3100, "mixed"),
    ("باشگاه شهرک آپادانا", "gym", "شهرک غرب", "Tehran", 35.7620, 51.3680, "mixed"),
    ("استخر چیتگر", "pool", "چیتگر", "Tehran", 35.7330, 51.2650, "mixed"),
    ("استخر بانوان آبشار", "pool", "اشرفی اصفهانی", "Tehran", 35.7690, 51.3250, "female"),
    ("سالن والیبال ایران‌زمین", "sport", "شهرک قدس", "Tehran", 35.7640, 51.3520, "mixed"),
    ("یوگا بانوان سپیده", "yoga", "پونک", "Tehran", 35.7710, 51.3340, "female"),
    ("سینما ملت", "cinema", "ولیعصر", "Tehran", 35.7550, 51.4100, "mixed"),
    ("باشگاه سیتی‌فیت", "gym", "میرداماد", "Tehran", 35.7570, 51.4250, "mixed"),
    # مرکز و جنوب
    ("باشگاه آزادی پلاس", "gym", "آزادی", "Tehran", 35.7000, 51.3350, "male"),
    ("باشگاه یوسف‌آباد", "gym", "یوسف‌آباد", "Tehran", 35.7290, 51.4000, "mixed"),
    ("باشگاه انقلاب بدن", "gym", "انقلاب", "Tehran", 35.7010, 51.3900, "mixed"),
    ("استخر امام حسین", "pool", "میدان امام حسین", "Tehran", 35.6890, 51.4380, "male"),
    ("سالن بدمینتون حکیمیه", "sport", "حکیمیه", "Tehran", 35.7280, 51.5600, "mixed"),
    ("باشگاه شوش", "gym", "شوش", "Tehran", 35.6600, 51.4300, "mixed"),
    ("باشگاه خاوران", "gym", "خاوران", "Tehran", 35.6500, 51.5100, "mixed"),
    ("استخر ری", "pool", "شهر ری", "Tehran", 35.5900, 51.4400, "mixed"),
    ("زمین فوتسال کن", "sport", "کن", "Tehran", 35.7500, 51.2800, "male"),
    ("باشگاه شهرآرا", "gym", "شهرآرا", "Tehran", 35.7330, 51.3700, "mixed"),
    # شرق
    ("باشگاه نارمک ورزش", "gym", "نارمک", "Tehran", 35.7350, 51.4980, "mixed"),
    ("باشگاه رسالت", "gym", "رسالت", "Tehran", 35.7420, 51.4750, "mixed"),
    ("باشگاه نیلوفر شرق", "gym", "تهرانپارس", "Tehran", 35.7380, 51.5200, "female"),
    ("سینما فرهنگ", "cinema", "تهرانپارس", "Tehran", 35.7300, 51.5150, "mixed"),
    ("یوگای شرق", "yoga", "نارمک", "Tehran", 35.7330, 51.4950, "mixed"),
    ("استخر المپیک شرق", "pool", "هفت‌حوض", "Tehran", 35.7340, 51.5350, "mixed"),
    # کرج
    ("باشگاه مهرشهر فیت", "gym", "مهرشهر", "Karaj", 35.8250, 50.9760, "mixed"),
    ("باشگاه بانوان کرج", "gym", "عظیمیه", "Karaj", 35.8390, 50.9680, "female"),
    ("باشگاه فردیس پاور", "gym", "فردیس", "Karaj", 35.7330, 50.9830, "male"),
    ("استخر گوهردشت", "pool", "گوهردشت", "Karaj", 35.8300, 50.9240, "mixed"),
    ("استخر بانوان آبیاران", "pool", "کرج", "Karaj", 35.8350, 50.9900, "female"),
    ("سینما کرج", "cinema", "کرج", "Karaj", 35.8330, 50.9990, "mixed"),
    ("یوگا و مدیتیشن گلشهر", "yoga", "گلشهر", "Karaj", 35.8120, 50.9770, "mixed"),
    ("سالن بسکتبال کمال‌شهر", "sport", "کمال‌شهر", "Karaj", 35.8700, 50.8800, "mixed"),
    ("زمین چمن مصنوعی کرج", "sport", "مارلیک", "Karaj", 35.8500, 50.9500, "male"),
]
_CITY_FA = {"Tehran": "تهران", "Karaj": "کرج"}
_KIND = {"gym": "باشگاه بدنسازی", "pool": "استخر", "cinema": "سینما", "yoga": "مرکز یوگا و مدیتیشن", "sport": "مجموعه ورزشی"}
for _i, (_n, _c, _d, _city, _lat, _lng, _g) in enumerate(_SPREAD):
    SAMPLE_GYMS.append({
        "name": _n, "address": f"{_CITY_FA[_city]}، {_d}", "lat": _lat, "lng": _lng,
        "phone": f"{'021' if _city == 'Tehran' else '026'}-{4000000 + _i * 7919:07d}"[:12],
        "district": _d, "city": _city, "gender_policy": _g, "category": _c,
        "description": f"{_KIND[_c]} در {_d}، {_CITY_FA[_city]}",
    })

# Gender slots: time-based gender policies per venue
GENDER_SLOTS = {
    "پولادین": [
        {"day": "sat", "start": "06:00", "end": "14:00", "gender": "male"},
        {"day": "sat", "start": "14:00", "end": "22:00", "gender": "female"},
        {"day": "sun", "start": "06:00", "end": "14:00", "gender": "male"},
        {"day": "sun", "start": "14:00", "end": "22:00", "gender": "female"},
        {"day": "mon", "start": "06:00", "end": "14:00", "gender": "male"},
        {"day": "mon", "start": "14:00", "end": "22:00", "gender": "female"},
        {"day": "tue", "start": "06:00", "end": "14:00", "gender": "male"},
        {"day": "tue", "start": "14:00", "end": "22:00", "gender": "female"},
        {"day": "wed", "start": "06:00", "end": "14:00", "gender": "male"},
        {"day": "wed", "start": "14:00", "end": "22:00", "gender": "female"},
        {"day": "thu", "start": "06:00", "end": "14:00", "gender": "male"},
        {"day": "thu", "start": "14:00", "end": "22:00", "gender": "female"},
        {"day": "fri", "start": "08:00", "end": "22:00", "gender": "mixed"},
    ],
    "تکسان": [
        {"day": "sat", "start": "06:00", "end": "14:00", "gender": "female"},
        {"day": "sat", "start": "14:00", "end": "22:00", "gender": "mixed"},
        {"day": "sun", "start": "06:00", "end": "14:00", "gender": "female"},
        {"day": "sun", "start": "14:00", "end": "22:00", "gender": "mixed"},
        {"day": "mon", "start": "06:00", "end": "14:00", "gender": "female"},
        {"day": "mon", "start": "14:00", "end": "22:00", "gender": "mixed"},
        {"day": "tue", "start": "06:00", "end": "14:00", "gender": "female"},
        {"day": "tue", "start": "14:00", "end": "22:00", "gender": "mixed"},
        {"day": "wed", "start": "06:00", "end": "14:00", "gender": "female"},
        {"day": "wed", "start": "14:00", "end": "22:00", "gender": "mixed"},
        {"day": "thu", "start": "06:00", "end": "14:00", "gender": "female"},
        {"day": "thu", "start": "14:00", "end": "22:00", "gender": "mixed"},
        {"day": "fri", "start": "08:00", "end": "22:00", "gender": "mixed"},
    ],
}
OFFERS = [
    ("دسترسی ۱ ساعته", 500_000, 60),
    ("دسترسی ۳۰ دقیقه‌ای", 300_000, 30),
    ("کلاس گروهی", 350_000, 60),
    ("مربی خصوصی ۱ ساعته", 1_200_000, 60),
]

# Per-category offer templates
CATEGORY_OFFERS = {
    "gym": [
        ("دسترسی ۱ ساعته باشگاه", 500_000, 60),
        ("دسترسی ۳۰ دقیقه‌ای", 300_000, 30),
        ("کلاس گروهی بدنسازی", 350_000, 60),
        ("مربی خصوصی ۱ ساعته", 1_200_000, 60),
    ],
    "pool": [
        ("شنا ۱ ساعته", 600_000, 60),
        ("شنا + سونا", 800_000, 90),
        ("شنا + جکوزی", 700_000, 60),
        ("بلیط روزانه", 450_000, 120),
    ],
    "cinema": [
        ("بلیط سینما", 250_000, 120),
        ("بلیط سینما VIP", 500_000, 120),
    ],
    "yoga": [
        ("کلاس یوگا ۱ ساعته", 400_000, 60),
        ("کلاس مدیتیشن", 300_000, 45),
        ("پکیج ۴ جلسه‌ای", 1_400_000, 60),
    ],
    "sport": [
        ("رزرو زمین ۱ ساعته", 800_000, 60),
        ("رزرو زمین ۳۰ دقیقه‌ای", 450_000, 30),
    ],
}

# درخواست‌های ثبت‌نام در انتظار تأیید ادمین (برای تست پنل مدیریت)
PENDING_VENUES = [
    {"name": "باشگاه تازه‌تأسیس آفتاب", "owner": "حسین نوری", "phone": "09131110001", "category": "gym", "district": "پیروزی", "address": "خیابان پیروزی، کوچه سوم", "description": "باشگاه جدید با تجهیزات نو؛ در انتظار تأیید"},
    {"name": "استخر خانوادگی ساحل", "owner": "مینا صادقی", "phone": "09131110002", "category": "pool", "district": "شهران", "address": "شهران، بلوار ابراهیمی", "description": "استخر سرپوشیده؛ در انتظار تأیید"},
    {"name": "استودیو یوگای نسیم", "owner": "نگار فرهادی", "phone": "09131110003", "category": "yoga", "district": "دروس", "address": "دروس، خیابان فرشته", "description": "کلاس یوگای صبحگاهی؛ در انتظار تأیید"},
    {"name": "سالن فوتسال امید", "owner": "کاوه بهرامی", "phone": "09131110004", "category": "sport", "district": "ستارخان", "address": "ستارخان، خیابان توحید", "description": "سالن فوتسال؛ در انتظار تأیید"},
]
PENDING_COMPANIES = [
    {"name": "شرکت نمونه آرمان", "email": "hr@arman-demo.local", "phone": "09140000001", "budget": 5_000_000},
    {"name": "گروه صنعتی نمونه البرز", "email": "hr@alborz-demo.local", "phone": "09140000002", "budget": 12_000_000},
]
# سازمان‌های فعال دیگر، با کارمندان و بودجه متفاوت
EXTRA_COMPANIES = [
    {"name": "شرکت نمونه پارس‌نرم", "domain": "parsnarm-demo.local", "budget": 12_000_000, "admin": ("زهرا حسینی", "09130000010"),
     "staff": [("امیر نظری", "09130000001", "male"), ("نگین صالحی", "09130000002", "female"), ("بهنام رحیمی", "09130000003", "male"),
               ("مهسا کاظمی", "09130000004", "female"), ("دانیال فرجی", "09130000005", "male")]},
    {"name": "بیمه نمونه آسیا", "domain": "asia-demo.local", "budget": 6_000_000, "admin": ("پرویز مرادی", "09130000020"),
     "staff": [("لیلا اکبری", "09130000011", "female"), ("حامد تقوی", "09130000012", "male"), ("سمیرا عباسی", "09130000013", "female"),
               ("مجید شریفی", "09130000014", "male")]},
]
DEMO_COMPANY_EXTRA_STAFF = [
    ("فاطمه جعفری", "09120000004", "female"), ("نیما قاسمی", "09120000005", "male"),
    ("الهام یوسفی", "09120000006", "female"), ("کیان مهدوی", "09120000007", "male"),
    ("شیما رستمی", "09120000008", "female"), ("پدرام اسدی", "09120000009", "male"),
]
COMMENTS = [
    (5, "عالی بود، حتماً دوباره می‌روم."), (5, "تمیز و منظم، کادرش خوش‌برخورد بودند."), (4, "خوب بود، فقط کمی شلوغ."),
    (4, "فضای خوبی دارد."), (5, "ارزش پولش را داشت."), (3, "معمولی بود."), (4, "تجهیزات به‌روز و فضا مناسب."),
    (5, "پیشنهاد می‌کنم."), (4, "رزرو و ورود راحت بود."),
]


class Command(BaseCommand):
    help = "Seed demo company, employees, gyms & offers"

    def handle(self, *args, **opts):
        # Create all categories
        categories = {}
        for slug, name_en, name_fa in [
            ("gym", "Gym", "بدنسازی"),
            ("pool", "Pool", "استخر"),
            ("cinema", "Cinema", "سینما"),
            ("yoga", "Yoga", "یوگا"),
            ("sport", "Sport", "ورزشگاه"),
        ]:
            cat, _ = Category.objects.get_or_create(slug=slug, defaults={"name_en": name_en, "name_fa": name_fa})
            categories[slug] = cat

        # demo company (matched by domain so re-running never creates a second one)
        company = Company.objects.filter(domain="demo.local").first()
        if company is None:
            company = Company.objects.create(
                name=DEMO_COMPANY_NAME, domain="demo.local", default_annual_budget=8_000_000,
                fiscal_year_start=date.today(), is_active=True, status=Company.Status.ACTIVE,
            )
        elif company.name == "Bagymo Demo Co.":
            company.name = DEMO_COMPANY_NAME
            company.save(update_fields=["name"])

        # users
        specs = [
            ("علی رضایی", "Ali", "09120000001", "a1111111", "male"),
            ("سارا محمدی", "Sara", "09120000002", "s2222222", "female"),
            ("رضا کریمی", "Reza", "09120000003", "r3333333", "male"),
        ]
        for n, old_name, phone, pw, gender in specs:
            u = User.objects.filter(phone_number=phone).first()
            if not u:
                u = User.objects.create_user(phone_number=phone, name=n, role=User.Role.USER,
                                             company=company, annual_budget=8_000_000,
                                             remaining_budget=8_000_000, fiscal_year_start=company.fiscal_year_start or date.today(),
                                             is_verified=True, is_active=True, gender=gender)
                u.set_password(pw)
                u.save()
            else:
                u.company = company
                u.is_active = True
                u.gender = gender
                if u.name == old_name:  # rename the old English demo names
                    u.name = n
                u.save()

        # company_admin
        ca = User.objects.filter(phone_number="09120000010").first()
        if not ca:
            ca = User.objects.create_user(phone_number="09120000010", name="مریم احمدی", role=User.Role.COMPANY_ADMIN,
                                          company=company, is_verified=True, is_active=True)
            ca.set_password("Admin12345")
            ca.save()
        else:
            ca.company = company
            ca.role = User.Role.COMPANY_ADMIN
            ca.is_active = True
            if ca.name == "HR Admin":
                ca.name = "مریم احمدی"
            ca.save()

        # platform admin (is_superuser for django admin panel)
        pa = User.objects.filter(phone_number="09120000000").first()
        if not pa:
            pa = User.objects.create_superuser(phone_number="09120000000", name="مدیر باجیمو",
                                               role=User.Role.ADMIN, is_verified=True, is_active=True)
            pa.set_password("Admin12345")
            pa.save()
        else:
            pa.role = User.Role.ADMIN
            if pa.name == "Platform Admin":
                pa.name = "مدیر باجیمو"
            pa.is_active = True
            pa.is_staff = True
            pa.is_superuser = True
            pa.save()

        # venues + offers
        for gm in SAMPLE_GYMS:
            cat = categories[gm["category"]]
            venue = Venue.objects.filter(name=gm["name"]).first()
            if not venue:
                venue = Venue.objects.create(
                    name=gm["name"], category=cat, address=gm["address"],
                    lat=gm["lat"], lng=gm["lng"], phone=gm["phone"],
                    district=gm["district"], city=gm["city"],
                    status=Venue.Status.ACTIVE, is_verified=True,
                    gender_policy=gm["gender_policy"],
                    description=gm.get("description", ""),
                )
            # category-specific offers
            offers_for_cat = CATEGORY_OFFERS.get(gm["category"], OFFERS)
            for oname, price, dur in offers_for_cat:
                offer = Offer.objects.filter(venue=venue, name=oname).first()
                if not offer:
                    Offer.objects.create(
                        venue=venue, name=oname, price=price,
                        venue_payout=int(price * Decimal("0.94")), duration_minutes=dur, is_active=True
                    )
            VenueCompanyAccess.objects.get_or_create(venue=venue, company=company, defaults={})
            # create gender slots
            for slot in GENDER_SLOTS.get(gm["name"], []):
                VenueGenderSlot.objects.get_or_create(
                    venue=venue, day_of_week=slot["day"],
                    start_time=slot["start"], end_time=slot["end"],
                    defaults={"gender": slot["gender"]},
                )
            # create timeslots for next 7 days
            today = date.today()
            for d in range(7):
                slot_date = today + timedelta(days=d)
                for start_h in [8, 10, 14, 16, 18]:
                    end_h = start_h + 2
                    for offer in Offer.objects.filter(venue=venue, is_active=True):
                        TimeSlot.objects.get_or_create(
                            offer=offer, date=slot_date,
                            start_time=time(start_h, 0), end_time=time(min(end_h, 22), 0),
                            defaults={"capacity": 10, "is_active": True},
                        )

        # venue staff - one per venue
        for i, venue in enumerate(Venue.objects.filter(status=Venue.Status.ACTIVE).order_by("id"), start=1):
            phone = f"09120000{80 + i:03d}"
            user, created = User.objects.get_or_create(
                phone_number=phone,
                defaults={"name": f"{venue.name}", "role": User.Role.VENUE_STAFF, "venue": venue,
                          "is_verified": True, "is_active": True}
            )
            if not created:
                user.venue = venue
                user.role = User.Role.VENUE_STAFF
                user.save(update_fields=["venue", "role"])

        self.stdout.write(self.style.SUCCESS(
            f"Seeded: company={company}, users={User.objects.filter(company=company).count()}, "
            f"venues={Venue.objects.count()}, offers={Offer.objects.count()}"
        ))

        # one demo booking (only on the first run, so re-seeding doesn't keep spending Ali's budget)
        ali = User.objects.get(phone_number="09120000001")
        offer = Offer.objects.first()
        if offer and not ali.bookings.exists():
            bal_before = ali.remaining_budget
            with transaction.atomic():
                booking = reserve_booking(ali, offer)
            bal_after = User.objects.get(pk=ali.pk).remaining_budget
            self.stdout.write(self.style.WARNING(
                f"Demo booking: {offer.name} @ {offer.price:,} -> budget "
                f"{bal_before:,} - {offer.price:,} = {bal_after:,} "
                f"| emp_commission={booking.employee_commission:,} "
                f"venue_commission={booking.venue_commission:,} "
                f"gym_gets={booking.venue_net_payout:,}"
            ))

        # Sample ratings
        ali = User.objects.get(phone_number="09120000001")
        sara = User.objects.get(phone_number="09120000002")
        venues = list(Venue.objects.filter(status="active"))
        if len(venues) >= 2:
            VenueRating.objects.get_or_create(venue=venues[0], user=ali, defaults={"score": 5, "comment": "عالی بود، حتماً دوباره می‌رم!"})
            VenueRating.objects.get_or_create(venue=venues[1], user=sara, defaults={"score": 4, "comment": "خوب بود ولی شلوغ بود"})
            VenueRating.objects.get_or_create(venue=venues[0], user=sara, defaults={"score": 4, "comment": "فضای خوبی دارد"})
            self.stdout.write(self.style.SUCCESS("Seeded sample ratings."))

        self._seed_more(categories, company)

    # ------------------------------------------------------------------
    def _seed_more(self, categories, company):
        """More companies / employees / history / pending requests, so every panel has data."""
        import random

        rng = random.Random(7)  # deterministic

        def make_staff(comp, name, phone, gender, budget):
            u = User.objects.filter(phone_number=phone).first()
            if u is None:
                u = User.objects.create_user(
                    phone_number=phone, name=name, role=User.Role.USER, company=comp, annual_budget=budget,
                    remaining_budget=budget, fiscal_year_start=comp.fiscal_year_start or date.today(),
                    is_verified=True, is_active=True, gender=gender,
                )
                u.set_unusable_password()
                u.save()
            return u

        # more employees for the demo company
        for name, phone, gender in DEMO_COMPANY_EXTRA_STAFF:
            make_staff(company, name, phone, gender, 8_000_000)

        # other active companies
        all_venues = list(Venue.objects.filter(status=Venue.Status.ACTIVE))
        companies = [company]
        for spec in EXTRA_COMPANIES:
            comp = Company.objects.filter(domain=spec["domain"]).first()
            if comp is None:
                comp = Company.objects.create(
                    name=spec["name"], domain=spec["domain"], default_annual_budget=spec["budget"],
                    fiscal_year_start=date.today(), is_active=True, status=Company.Status.ACTIVE,
                    billing_email=f"billing@{spec['domain']}",
                )
            ca_name, ca_phone = spec["admin"]
            if not User.objects.filter(phone_number=ca_phone).exists():
                ca = User.objects.create_user(phone_number=ca_phone, name=ca_name, role=User.Role.COMPANY_ADMIN,
                                              company=comp, is_verified=True, is_active=True)
                ca.set_password("Admin12345")
                ca.save()
            for name, phone, gender in spec["staff"]:
                make_staff(comp, name, phone, gender, spec["budget"])
            for v in all_venues:
                VenueCompanyAccess.objects.get_or_create(venue=v, company=comp, defaults={})
            companies.append(comp)

        # booking history (a few per employee, spread over the last 30 days)
        from django.utils import timezone

        from bookings.models import Booking

        employees = list(User.objects.filter(role=User.Role.USER, company__in=companies).order_by("id"))
        if not Booking.objects.exclude(employee__phone_number="09120000001").exists():
            offers = list(Offer.objects.filter(venue__in=all_venues, is_active=True))
            made = 0
            for emp in employees:
                for _ in range(rng.randint(1, 4)):
                    choices = [o for o in offers if o.price <= (emp.remaining_budget or 0)]
                    if not choices:
                        break
                    offer = rng.choice(choices)
                    try:
                        with transaction.atomic():
                            b = reserve_booking(emp, offer)
                            emp.refresh_from_db()
                    except Exception:
                        continue
                    when = timezone.now() - timedelta(days=rng.randint(1, 29), hours=rng.randint(0, 8))
                    outcome = rng.random()
                    updates = {"reserved_at": when, "paid_at": when}
                    if outcome < 0.75:
                        updates.update(status=Booking.Status.COMPLETED, checked_in_at=when + timedelta(hours=1),
                                       completed_at=when + timedelta(hours=2))
                    Booking.objects.filter(pk=b.pk).update(**updates)
                    made += 1
            self.stdout.write(self.style.SUCCESS(f"Seeded {made} historical bookings."))

        # ratings from many employees
        rated = 0
        for emp in employees:
            if emp.venue_ratings.exists():
                continue
            for v in rng.sample(all_venues, k=min(3, len(all_venues))):
                score, comment = rng.choice(COMMENTS)
                _, created = VenueRating.objects.get_or_create(venue=v, user=emp, defaults={"score": score, "comment": comment})
                rated += created
        self.stdout.write(self.style.SUCCESS(f"Seeded {rated} more ratings."))

        # pending sign-up requests for the admin to review
        for spec in PENDING_VENUES:
            if User.objects.filter(phone_number=spec["phone"]).exists():
                continue
            v = Venue.objects.create(
                name=spec["name"], category=categories[spec["category"]], owner_name=spec["owner"], phone=spec["phone"],
                district=spec["district"], address=spec["address"], city="Tehran", description=spec["description"],
                status=Venue.Status.PENDING,
            )
            u = User.objects.create_user(phone_number=spec["phone"], name=spec["owner"], role=User.Role.VENUE_STAFF,
                                         venue=v, is_verified=True, is_active=True)
            u.set_unusable_password()
            u.save()
        for spec in PENDING_COMPANIES:
            if User.objects.filter(phone_number=spec["phone"]).exists():
                continue
            c = Company.objects.create(
                name=spec["name"], domain=spec["email"].split("@")[-1], billing_email=spec["email"],
                default_annual_budget=spec["budget"], status=Company.Status.PENDING, is_active=False,
            )
            u = User.objects.create_user(phone_number=spec["phone"], name=spec["name"], email=spec["email"],
                                         role=User.Role.COMPANY_ADMIN, company=c, is_verified=True, is_active=False)
            u.set_password("Admin12345")
            u.save()

        self.stdout.write(self.style.SUCCESS(
            f"Totals: companies={Company.objects.count()}, venues={Venue.objects.count()} "
            f"(pending {Venue.objects.filter(status='pending').count()}), "
            f"employees={User.objects.filter(role=User.Role.USER).count()}, bookings={Booking.objects.count()}"
        ))
