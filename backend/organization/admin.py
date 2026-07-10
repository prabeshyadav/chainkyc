from django.contrib import admin

from .models import Organization


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("name", "org_type", "contact_email", "is_active")
    list_filter = ("org_type", "is_active")
    search_fields = ("name", "slug")
