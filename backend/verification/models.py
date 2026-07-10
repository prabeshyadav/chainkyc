import uuid

from django.conf import settings
from django.db import models

from bank.models import Bank
from kyc.models import KYCSubmission


class VerificationStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"
    EXPIRED = "EXPIRED", "Expired"


class VerificationRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bank = models.ForeignKey(
        Bank,
        on_delete=models.CASCADE,
        related_name="verification_requests",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="verification_requests",
    )
    kyc_submission = models.ForeignKey(
        KYCSubmission,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verification_requests",
    )
    purpose = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING,
    )
    response_note = models.TextField(blank=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-requested_at"]
        indexes = [
            models.Index(fields=["bank", "status"]),
            models.Index(fields=["user", "status"]),
        ]

    def __str__(self):
        return f"{self.bank.bank_code} → {self.user.wallet_address} ({self.status})"
