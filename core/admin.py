from django.contrib import admin

from .models import ContactMessage


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("name", "contact", "topic", "is_handled", "created_at")
    list_filter = ("is_handled", "topic")
    list_editable = ("is_handled",)
    search_fields = ("name", "contact", "message")
    readonly_fields = ("name", "contact", "topic", "message", "created_at")
