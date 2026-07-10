import uuid

from django.db import models


class OrganizationType(models.TextChoices):
    BANK = "BANK", "Bank"
    FINTECH = "FINTECH", "Fintech"
    GOVERNMENT = "GOVERNMENT", "Government"
    OTHER = "OTHER", "Other"


class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=100, unique=True)
    org_type = models.CharField(max_length=20, choices=OrganizationType.choices)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
