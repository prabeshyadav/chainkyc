import uuid

from django.conf import settings
from django.db import models

from kyc.models import KYCSubmission


class Verification(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    submission = models.OneToOneField(
        KYCSubmission,
        on_delete=models.CASCADE,
        related_name="verification",
    )

    verifier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="completed_verifications",
    )

    remarks = models.TextField(
        blank=True,
        null=True,
    )

    verified_at = models.DateTimeField(
        auto_now_add=True,
    )
    class Meta:
        ordering = ["-verified_at"]

    def __str__(self):
        return f"{self.submission.full_name} verified by {self.verifier}"


class BlockchainRecord(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    verification = models.OneToOneField(
        Verification,
        on_delete=models.CASCADE,
        related_name="blockchain_record",
    )

    ipfs_cid = models.CharField(
        max_length=255,
    )

    data_hash = models.CharField(
        max_length=66,
    )

    transaction_hash = models.CharField(
        max_length=66,
        unique=True,
    )

    block_number = models.BigIntegerField()

    kyc_version = models.PositiveIntegerField()

    created_at = models.DateTimeField(
        auto_now_add=True,
    )
    
    class Meta:
        ordering = [ "-created_at", "-kyc_version"]
        indexes = [
            models.Index(fields=["kyc_version"]),
    ]

    def __str__(self):
        return f"Blockchain Record V{self.kyc_version}"