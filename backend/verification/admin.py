from django.contrib import admin

from .models import VerificationRequest


@admin.register(VerificationRequest)
class VerificationRequestAdmin(admin.ModelAdmin):
    list_display = ("bank", "user", "status", "requested_at")
    list_filter = ("status",)
    search_fields = ("bank__bank_code", "user__wallet_address")
