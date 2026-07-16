from django.db import transaction
from django.db.models import Max

from .models import (
    DocumentType,
    KYCDocument,
    KYCStatus,
    KYCSubmission,
)


class KYCService:
    @staticmethod
    @transaction.atomic
    def create_submission(
        *,
        user,
        data,
        selfie,
        identity_document,
        document_type,
    ):
        """
        Create a new KYC submission.

        Rules:
        - A user can have only one pending submission.
        - Version numbers are immutable.
        - SELFIE is always required.
        - Exactly one identity document is required.
        """

        if KYCSubmission.objects.filter(
            user=user,
            status=KYCStatus.PENDING,
        ).exists():
            raise ValueError(
                "You already have a pending KYC submission."
            )

        latest_version = (
            KYCSubmission.objects.filter(user=user)
            .aggregate(Max("version"))
            .get("version__max")
        )

        version = 1 if latest_version is None else latest_version + 1

        submission = KYCSubmission.objects.create(
            user=user,
            full_name=data.full_name,
            date_of_birth=data.date_of_birth,
            country=data.country,
            nationality=data.nationality,
            document_number=data.document_number,
            phone_number=data.phone_number,
            email=data.email,
            address=data.address,
            version=version,
            status=KYCStatus.PENDING,
        )

        KYCDocument.objects.create(
            submission=submission,
            document_type=DocumentType.SELFIE,
            file=selfie,
        )

        KYCDocument.objects.create(
            submission=submission,
            document_type=document_type,
            file=identity_document,
        )

        return submission

    @staticmethod
    @transaction.atomic
    def update_submission(
        *,
        submission,
        data,
        selfie=None,
        identity_document=None,
        document_type=None,
    ):
        """
        Update an existing pending KYC submission.
        """

        if submission.status != KYCStatus.PENDING:
            raise ValueError(
                "Only pending KYC submissions can be updated."
            )

        submission.full_name = data.full_name
        submission.date_of_birth = data.date_of_birth
        submission.country = data.country
        submission.nationality = data.nationality
        submission.document_number = data.document_number
        submission.phone_number = data.phone_number
        submission.email = data.email
        submission.address = data.address

        submission.save()

        if selfie:
            document = submission.documents.get(
                document_type=DocumentType.SELFIE
            )

            document.file = selfie
            document.save()

        if identity_document:
            document = submission.documents.exclude(
                document_type=DocumentType.SELFIE
            ).first()

            if document_type:
                document.document_type = document_type

            document.file = identity_document
            document.save()

        return submission

    @staticmethod
    def get_latest_submission(user):
        """
        Return the newest submission for a user.
        """

        return (
            KYCSubmission.objects.filter(user=user)
            .order_by("-version")
            .first()
        )