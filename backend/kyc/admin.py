from django.contrib import admin

from .models import KYCSubmission, KYCDocument


class KYCDocumentInline(admin.TabularInline):
    model = KYCDocument
    extra = 0


@admin.register(KYCSubmission)
class KYCSubmissionAdmin(admin.ModelAdmin):
    list_display = (
        "full_name",
        "status",
        "version",
        "created_at",
    )

    list_filter = (
        "status",
    )

    search_fields = (
        "full_name",
        "document_number",
        "email",
    )

    readonly_fields = (
        "version",
        "created_at",
        "updated_at",
    )

    inlines = [KYCDocumentInline]


@admin.register(KYCDocument)
class KYCDocumentAdmin(admin.ModelAdmin):
    list_display = (
        "submission",
        "document_type",
        "uploaded_at",
    )

    list_filter = (
        "document_type",
    )