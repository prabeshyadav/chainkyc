from django.contrib import admin

from .models import KYCSubmission


@admin.register(KYCSubmission)
class KYCSubmissionAdmin(admin.ModelAdmin):
    list_display = ("full_name", "user", "status", "document_type", "submitted_at")
    list_filter = ("status", "document_type")
    search_fields = ("full_name", "document_number", "user__wallet_address")
    readonly_fields = ("created_at", "updated_at", "submitted_at", "verified_at")
