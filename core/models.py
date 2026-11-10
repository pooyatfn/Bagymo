from django.db import models


class ContactMessage(models.Model):
    """A message sent from the public «تماس با ما» page; staff read it in the Django admin."""

    class Topic:
        GENERAL = "general"
        COMPANY = "company"
        VENUE = "venue"
        SUPPORT = "support"
        CHOICES = [(GENERAL, "عمومی"), (COMPANY, "همکاری سازمان"), (VENUE, "همکاری مجموعه"), (SUPPORT, "پشتیبانی")]

    name = models.CharField(max_length=80)
    contact = models.CharField(max_length=120, help_text="Phone number or email to reply to")
    topic = models.CharField(max_length=16, choices=Topic.CHOICES, default=Topic.GENERAL)
    message = models.TextField(max_length=2000)
    is_handled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} — {self.get_topic_display()}"
