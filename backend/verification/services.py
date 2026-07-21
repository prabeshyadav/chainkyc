import uuid 
from io import BytesIO
from django.db import transaction
from django.shortcuts import get_object_or_404
from verification.models import BlockchainRecord
from verification.package import KYCPackageBuilder
from verification.encryption import KYCEncryption
from verification.hashing import KYCHasher
from storage.ipfs import IPFSStorage


from kyc.models import KYCStatus, KYCSubmission
from .models import Verification


class VerificationService:
    @staticmethod
    def get_submission(submission_id):
        """
        Return a KYC submission by id.
        """
        return get_object_or_404(
            KYCSubmission.objects.select_related(
                "user",
                "verification",
            ),
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
        
    # @staticmethod
    # def list_verifications():
    #     return (
    #         Verification.objects
    #         .select_related("submission", "verifier")
    #         .order_by("-verified_at")
    #     )
        
    
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
            .select_related(
                "user",
                "verification",
            )
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
        
            
    @staticmethod
    def prepare_for_blockchain(verification):
        """
        Build, encrypt and upload the approved KYC package.

        Stores the prepared blockchain data so it can later be
        anchored on-chain.
        """

        submission = verification.submission

        if submission.status != KYCStatus.APPROVED:
            raise ValueError(
                "Only approved KYC can be uploaded."
            )

        # Already anchored?
        if (
            hasattr(verification, "blockchain_record")
            and verification.blockchain_record.transaction_hash
        ):
            raise ValueError(
                "This verification has already been anchored."
            )

        # Build package
        package = KYCPackageBuilder.build(
            submission=submission,
            verification=verification,
        )

        # Encrypt package
        encrypted = KYCEncryption().encrypt(package)

        # Upload encrypted package to IPFS
        file = BytesIO(encrypted)
        file.name = f"kyc_v{submission.version}.enc"

        response = IPFSStorage().upload(file)

        ipfs_cid = response["IpfsHash"]

        # Generate SHA-256 hash of encrypted package
        data_hash = KYCHasher.sha256(encrypted)

        # Save prepared blockchain data
        record, created = BlockchainRecord.objects.get_or_create(
            verification=verification,
            defaults={
                "ipfs_cid": ipfs_cid,
                "data_hash": data_hash,
                "kyc_version": submission.version,
            },
        )

        # If already prepared but not yet anchored,
        # update the prepared data.
        if (
            not created
            and not record.transaction_hash
        ):
            record.ipfs_cid = ipfs_cid
            record.data_hash = data_hash
            record.kyc_version = submission.version

            record.save(
                update_fields=[
                    "ipfs_cid",
                    "data_hash",
                    "kyc_version",
                ]
            )

        return {
            "verification_id": verification.id,
            "user_wallet": submission.user.wallet_address,
            "ipfs_cid": record.ipfs_cid,
            "data_hash": record.data_hash,
            "kyc_version": record.kyc_version,
        }
        
        
        
    @staticmethod
    @transaction.atomic
    def complete_blockchain(
        *,
        verification,
        transaction_hash,
        block_number,
    ):
        """
        Save blockchain transaction details after
        MetaMask successfully anchors the KYC.
        """

        try:
            record = verification.blockchain_record
        except BlockchainRecord.DoesNotExist:
            raise ValueError(
                "Prepare blockchain before completing."
            )

        if record.transaction_hash:
            raise ValueError(
                "This verification is already anchored."
            )

        record.transaction_hash = transaction_hash
        record.block_number = block_number

        record.save(
            update_fields=[
                "transaction_hash",
                "block_number",
            ]
        )

        return {
            "verification_id": verification.id,
            "transaction_hash": record.transaction_hash,
            "block_number": record.block_number,
            "ipfs_cid": record.ipfs_cid,
            "data_hash": record.data_hash,
            "kyc_version": record.kyc_version,
        }