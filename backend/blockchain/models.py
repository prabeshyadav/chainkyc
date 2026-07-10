import uuid

from django.db import models

from kyc.models import KYCSubmission


class AnchorStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    CONFIRMED = "CONFIRMED", "Confirmed"
    FAILED = "FAILED", "Failed"


class BlockchainNetwork(models.TextChoices):
    ETHEREUM = "ETHEREUM", "Ethereum"
    POLYGON = "POLYGON", "Polygon"
    LOCAL = "LOCAL", "Local Testnet"


class BlockchainAnchor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    kyc_submission = models.OneToOneField(
        KYCSubmission,
        on_delete=models.CASCADE,
        related_name="blockchain_anchor",
    )
    network = models.CharField(
        max_length=20,
        choices=BlockchainNetwork.choices,
        default=BlockchainNetwork.LOCAL,
    )
    contract_address = models.CharField(max_length=42, blank=True)
    ipfs_cid = models.CharField(max_length=100)
    data_hash = models.CharField(max_length=64)
    salt = models.CharField(max_length=32)
    tx_hash = models.CharField(max_length=66, blank=True)
    block_number = models.PositiveBigIntegerField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=AnchorStatus.choices,
        default=AnchorStatus.PENDING,
    )
    anchored_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-anchored_at"]

    def __str__(self):
        return f"Anchor {self.kyc_submission_id} ({self.status})"
