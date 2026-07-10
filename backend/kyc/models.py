import uuid
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class KYCStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    PENDING = "PENDING", "Pending"
    UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
    VERIFIED = "VERIFIED", "Verified"
    REJECTED = "REJECTED", "Rejected"


class DocumentType(models.TextChoices):
    CITIZENSHIP = "CITIZENSHIP", "Citizenship"
    PASSPORT = "PASSPORT", "Passport"
    NATIONAL_ID = "NATIONAL_ID", "National ID"
    DRIVING_LICENSE = "DRIVING_LICENSE", "Driving License"


class KYCSubmission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="kyc_submissions"
    )

    # Personal info
    full_name = models.CharField(max_length=255)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=20)
    nationality = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    country = models.CharField(max_length=100)
    province = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    street = models.CharField(max_length=255)
    postal_code = models.CharField(max_length=20)

    # Document
    document_type = models.CharField(max_length=30, choices=DocumentType.choices)
    document_number = models.CharField(max_length=100)

    document_front_encrypted = models.BinaryField()
    document_back_encrypted = models.BinaryField(null=True, blank=True)
    selfie_encrypted = models.BinaryField()
    encrypted_dek = models.TextField()

    document_front_hash = models.CharField(max_length=64, blank=True)
    document_back_hash = models.CharField(max_length=64, blank=True)
    selfie_hash = models.CharField(max_length=64, blank=True)

    # Review
    status = models.CharField(max_length=30, choices=KYCStatus.choices, default=KYCStatus.DRAFT)
    rejection_reason = models.TextField(blank=True)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="verified_kyc_submissions",
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    # On-chain anchor (populated only on approval)
    ipfs_cid = models.CharField(max_length=100, null=True, blank=True)
    data_hash = models.CharField(max_length=64, null=True, blank=True)
    salt = models.CharField(max_length=32, null=True, blank=True)
    tx_hash = models.CharField(max_length=66, null=True, blank=True)

    # Versioning
    version = models.PositiveIntegerField(default=1)
    is_current = models.BooleanField(default=True)
    previous_version = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="next_version"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_current"]),
            models.Index(fields=["status"]),
        ]

    def clean(self):
        if self.document_type != DocumentType.PASSPORT and not self.document_back_encrypted:
            raise ValidationError("Back image is required for this document type.")

    def __str__(self):
        return f"{self.full_name} ({self.status})"