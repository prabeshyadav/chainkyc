import uuid

from django.conf import settings
from django.db import models


class KYCStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"


class DocumentType(models.TextChoices):
    CITIZENSHIP = "CITIZENSHIP", "Citizenship"
    DRIVING_LICENSE = "DRIVING_LICENSE", "Driving Licence"
    NATIONAL_ID = "NATIONAL_ID", "National ID"
    SELFIE = "SELFIE", "Selfie"


class KYCSubmission(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="kyc_submissions",
    )

    full_name = models.CharField(max_length=255)
    date_of_birth = models.DateField()

    country = models.CharField(max_length=100)
    nationality = models.CharField(max_length=100)

    # Number of the uploaded identity document
    document_number = models.CharField(max_length=100)

    phone_number = models.CharField(max_length=20)
    email = models.EmailField()

    address = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=KYCStatus.choices,
        default=KYCStatus.PENDING,
    )
    version = models.PositiveIntegerField(default=1)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-version", "-created_at"]

        constraints = [
            models.UniqueConstraint(
                fields=["user", "version"],
                name="unique_user_version",
            )
        ]

    def __str__(self):
        return f"{self.full_name} ({self.status})"

    @property
    def identity_document(self):
        return self.documents.filter(
            document_type__in=[
                DocumentType.CITIZENSHIP,
                DocumentType.DRIVING_LICENSE,
                DocumentType.NATIONAL_ID,
            ]
        ).first()
        
    @property
    def selfie(self):
        return self.documents.filter(
            document_type=DocumentType.SELFIE
        ).first()

class KYCDocument(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    submission = models.ForeignKey(
        KYCSubmission,
        on_delete=models.CASCADE,
        related_name="documents",
    )

    document_type = models.CharField(
        max_length=30,
        choices=DocumentType.choices,
    )

    file = models.FileField(
        upload_to="kyc_documents/",
    )

    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["document_type"]
        verbose_name = "KYC Document"
        verbose_name_plural = "KYC Documents"
        constraints = [
            models.UniqueConstraint(
                fields=["submission", "document_type"],
                name="unique_document_per_submission",
            )
        ]

    def __str__(self):
        return f"{self.get_document_type_display()} - {self.submission.full_name}"
    
    
    
    