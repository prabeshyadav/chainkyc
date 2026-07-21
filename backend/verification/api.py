from typing import List
from uuid import UUID

from ninja import Router

from management.jwt_auth import verifier_auth

from .schemas import (
    PendingKYCResponseSchema,
    VerifierKYCDetailSchema,
    VerificationApproveSchema,
    VerificationRejectSchema,
    VerificationResponseSchema,
    MessageSchema,
    VerifierDashboardSchema,
    PrepareBlockchainResponseSchema,
    BlockchainCompleteSchema,
    BlockchainCompleteResponseSchema,
)
from .services import VerificationService


router = Router(tags=["Verifier"])


@router.get(
    "/dashboard",
    auth=verifier_auth,
    response=VerifierDashboardSchema,
)
def dashboard(request):
    """
    Return verifier dashboard statistics.
    """
    return VerificationService.dashboard()


@router.get(
    "/pending",
    auth=verifier_auth,
    response=List[PendingKYCResponseSchema],
)
def pending_submissions(request):
    """
    Return all pending KYC submissions.
    """
    return VerificationService.list_pending_submissions()


@router.get(
    "/approved",
    auth=verifier_auth,
    response=List[PendingKYCResponseSchema],
)
def approved_submissions(request):
    """
    Return all approved KYC submissions.
    """
    return VerificationService.list_approved_submissions()


@router.get(
    "/rejected",
    auth=verifier_auth,
    response=List[PendingKYCResponseSchema],
)
def rejected_submissions(request):
    """
    Return all rejected KYC submissions.
    """
    return VerificationService.list_rejected_submissions()


@router.get(
    "/{submission_id}",
    auth=verifier_auth,
    response=VerifierKYCDetailSchema,
)
def submission_detail(
    request,
    submission_id: UUID,
):
    """
    Return complete KYC details for verifier review.
    """
    return VerificationService.get_submission(submission_id)


@router.post(
    "/{submission_id}/approve",
    auth=verifier_auth,
    response={
        200: VerificationResponseSchema,
        400: MessageSchema,
        404: MessageSchema,
    },
)
def approve_submission(
    request,
    submission_id: UUID,
    payload: VerificationApproveSchema,
):
    """
    Approve a pending KYC submission.
    """
    try:
        submission = VerificationService.get_submission(submission_id)

        verification = VerificationService.approve_submission(
            submission=submission,
            verifier=request.auth,
            remarks=payload.remarks,
        )

        return verification

    except ValueError as exc:
        return 400, {
            "message": str(exc),
        }


@router.post(
    "/{submission_id}/reject",
    auth=verifier_auth,
    response={
        200: VerificationResponseSchema,
        400: MessageSchema,
        404: MessageSchema,
    },
)
def reject_submission(
    request,
    submission_id: UUID,
    payload: VerificationRejectSchema,
):
    """
    Reject a pending KYC submission.
    """
    try:
        submission = VerificationService.get_submission(submission_id)

        verification = VerificationService.reject_submission(
            submission=submission,
            verifier=request.auth,
            remarks=payload.remarks,
        )

        return verification

    except ValueError as exc:
        return 400, {
            "message": str(exc),
        }
        
        
        
@router.post(
    "/{verification_id}/prepare",
    auth=verifier_auth,
    response={
        200: PrepareBlockchainResponseSchema,
        400: MessageSchema,
        404: MessageSchema,
    },
)
def prepare_blockchain(
    request,
    verification_id: UUID,
):
    """
    Prepare an approved KYC for blockchain anchoring.

    Builds the package, encrypts it, uploads it to IPFS,
    and returns the CID and SHA-256 hash.
    """

    try:
        verification = VerificationService.get_verification(
            verification_id=verification_id,
        )

        return VerificationService.prepare_for_blockchain(
            verification,
        )

    except ValueError as exc:
        return 400, {
            "message": str(exc),
        }
        
        
        
@router.post(
    "/{verification_id}/complete",
    auth=verifier_auth,
    response={
        200: BlockchainCompleteResponseSchema,
        400: MessageSchema,
        404: MessageSchema,
    },
)
def complete_blockchain(
    request,
    verification_id: UUID,
    payload: BlockchainCompleteSchema,
):
    """
    Save blockchain transaction details after the verifier
    successfully anchors the KYC on-chain.
    """

    try:
        verification = VerificationService.get_verification(
            verification_id=verification_id,
        )

        return VerificationService.complete_blockchain(
            verification=verification,
            transaction_hash=payload.transaction_hash,
            block_number=payload.block_number,
        )

    except ValueError as exc:
        return 400, {
            "message": str(exc),
        }