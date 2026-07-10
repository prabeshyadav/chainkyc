import uuid

from django.db import models

from organization.models import Organization


class Bank(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.OneToOneField(
        Organization,
        on_delete=models.CASCADE,
        related_name="bank",
    )
    bank_code = models.CharField(max_length=20, unique=True)
    swift_code = models.CharField(max_length=11, blank=True)
    license_number = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    wallet_address = models.CharField(
        max_length=42,
        unique=True,
        null=True,
        blank=True,
        db_index=True,
    )
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.wallet_address:
            self.wallet_address = self.wallet_address.lower()
        super().save(*args, **kwargs)


    class Meta:
        ordering = ["bank_code"]

    def __str__(self):
        return f"{self.organization.name} ({self.bank_code})"
