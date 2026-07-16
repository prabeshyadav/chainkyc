from django.db import transaction

from kyc.models import KYCStatus, KYCSubmission, KYCDocument, DocumentType
from .models import Verification
from django.shortcuts import get_object_or_404


class VerificationService:
    @staticmethod
    @transaction.atomic
    def approve_submission(
        *,
        submission,
        verifier,
        remarks="",
    ):
        if submission.status != KYCStatus.PENDING:
            raise ValueError(
                "Only pending KYC submissions can be approved."
            )

        verification = Verification.objects.create(
            submission=submission,
            verifier=verifier,
            remarks=remarks,
        )

        submission.status = KYCStatus.APPROVED
        submission.save(update_fields=["status"])

        return verification

    @staticmethod
    @transaction.atomic
    def reject_submission(
        *,
        submission,
        verifier,
        remarks="",
    ):
        """
        Reject a pending KYC submission.
        """

        if submission.status != KYCStatus.PENDING:
            raise ValueError(
                "Only pending KYC submissions can be rejected."
            )

        verification = Verification.objects.create(
            submission=submission,
            verifier=verifier,
            remarks=remarks,
        )

        submission.status = KYCStatus.REJECTED
        submission.save(update_fields=["status"])

        return verification
    
    @staticmethod
    def get_verification_by_submission(submission):
        """
        Retrieve the verification record associated with a KYC submission.
        """
        return Verification.objects.filter(submission=submission).first()  
    
    @staticmethod
    def list_pending_submissions():
        """
        Return all pending KYC submissions awaiting verification.
        """

        return (
        KYCSubmission.objects
            .filter(status=KYCStatus.PENDING)
            .select_related("user")
            .prefetch_related("documents")
            .order_by("-created_at")
        )
        
    @staticmethod
    def get_verification(*, verification_id=None, submission=None):
        """
        Get verification details.

        Can retrieve by:
        - verification id
        - submission instance
        """

        queryset = (
            Verification.objects
            .select_related(
                "submission",
                "verifier",
            )
        )

        if verification_id:
            return get_object_or_404(
                queryset,
                id=verification_id
            )

        if submission:
            return get_object_or_404(
                queryset,
                submission=submission
            )

        raise ValueError(
            "Either verification_id or submission is required."
        )