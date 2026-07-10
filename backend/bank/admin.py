from django.contrib import admin

from .models import Bank


@admin.register(Bank)
class BankAdmin(admin.ModelAdmin):
    list_display = ("bank_code", "organization", "country", "is_verified")
    list_filter = ("is_verified", "country")
    search_fields = ("bank_code", "organization__name")
