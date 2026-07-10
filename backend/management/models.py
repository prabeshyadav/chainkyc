from datetime import timedelta
import secrets
import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

from .managers import UserManager


class UserRole(models.TextChoices):
    ADMIN = "ADMIN", "Admin"
    VERIFIER = "VERIFIER", "Verifier"
    BANK = "BANK", "Bank"
    USER = "USER", "User"


class User(AbstractUser):
    username = None
    first_name = None
    last_name = None
    email = None

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    wallet_address = models.CharField(
        max_length=42,
        unique=True,
        db_index=True,
    )

    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.USER,
    )

    USERNAME_FIELD = "wallet_address"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def save(self, *args, **kwargs):
        self.wallet_address = self.wallet_address.lower()
        super().save(*args, **kwargs)


    def __str__(self):
        return self.wallet_address
    
class WalletNonce(models.Model):
    wallet_address = models.CharField(
        max_length=42,
        db_index=True,
    )

    nonce = models.CharField(
        max_length=64,
        unique=True,
    )

    expires_at = models.DateTimeField()

    used = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    @classmethod
    def generate_nonce(cls):
        return secrets.token_hex(32)

    @classmethod
    def expiry_time(cls):
        return timezone.now() + timedelta(minutes=5)