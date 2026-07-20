from django.db import transaction
from django.shortcuts import get_object_or_404
from verification.models import BlockchainRecord


from kyc.models import KYCStatus, KYCSubmission
from .models import Verification


class VerificationService:
    @staticmethod
    def get_submission(submission_id):
        """
        Return a KYC submission by id.
        """
        return get_object_or_404(
            KYCSubmission.objects.select_related("user"),
            id=submission_id,
        )

    @staticmethod
    def ensure_pending(submission):
        """
        Ensure the submission is still pending.
        """
        if submission.status != KYCStatus.PENDING:
            raise ValueError(
                "Only pending KYC submissions can be verified."
            )

    @staticmethod
    @transaction.atomic
    def approve_submission(
        *,
        submission,
        verifier,
        remarks="",
    ):
        """
        Approve a pending KYC submission.
        """

        VerificationService.ensure_pending(submission)

        if Verification.objects.filter(submission=submission).exists():
            raise ValueError(
                "This submission has already been verified."
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

        VerificationService.ensure_pending(submission)

        if Verification.objects.filter(submission=submission).exists():
            raise ValueError(
                "This submission has already been verified."
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
    def list_pending_submissions():
        """
        Return all pending KYC submissions.
        """

        return (
            KYCSubmission.objects
            .filter(status=KYCStatus.PENDING)
            .select_related("user")
            .prefetch_related("documents")
            .order_by("-created_at")
        )

    @staticmethod
    def get_verification(
        *,
        verification_id=None,
        submission=None,
    ):
        """
        Return verification details.

        Can retrieve by:
        - verification_id
        - submission
        """

        queryset = (
            Verification.objects
            .select_related(
                "submission",
                "verifier",
            )
        )

        if verification_id is not None:
            return get_object_or_404(
                queryset,
                id=verification_id,
            )

        if submission is not None:
            return get_object_or_404(
                queryset,
                submission=submission,
            )

        raise ValueError(
            "Either verification_id or submission must be provided."
        )
        
    @staticmethod
    def list_verifications():
        return (
            Verification.objects
            .select_related("submission", "verifier")
            .order_by("-verified_at")
        )
        
    
    @staticmethod
    def dashboard():

        return {
            "pending": KYCSubmission.objects.filter(
                status=KYCStatus.PENDING
            ).count(),

            "approved": KYCSubmission.objects.filter(
                status=KYCStatus.APPROVED
            ).count(),

            "rejected": KYCSubmission.objects.filter(
                status=KYCStatus.REJECTED
            ).count(),

            "uploaded_to_blockchain": BlockchainRecord.objects.count(),
        }
        
    @staticmethod
    def list_approved_submissions():
        return (
            KYCSubmission.objects
            .filter(status=KYCStatus.APPROVED)
            .select_related("user")
            .order_by("-updated_at")
        )
    
    @staticmethod
    def list_rejected_submissions():
        return (
            KYCSubmission.objects
            .filter(status=KYCStatus.REJECTED)
            .select_related("user")
            .order_by("-updated_at")
        )
        
    @staticmethod
    def list_verifications():
        return (
            Verification.objects
            .select_related(
                "submission",
                "verifier",
                "blockchain_record",
            )
            .order_by("-verified_at")
        )