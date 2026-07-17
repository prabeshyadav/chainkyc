from typing import List
from uuid import UUID

from ninja import Router

from kyc.models import KYCSubmission, KYCStatus
from .models import Verification
from .schemas import (
    VerificationApproveSchema,
    VerificationRejectSchema,
    VerificationResponseSchema,
    BlockchainRecordResponseSchema,
    MessageSchema,
)
from .services import VerificationService

router = Router(tags=["Verification"])


@router.get(
    "/pending",
    response=List[VerificationResponseSchema],
)
def pending_submissions(request):
    """
    List all pending KYC submissions.
    """

    return KYCSubmission.objects.filter(
        status=KYCStatus.PENDING,
    ).order_by("created_at")


@router.post(
    "/{submission_id}/approve",
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
    submission = KYCSubmission.objects.filter(
        id=submission_id,
    ).first()

    if submission is None:
        return 404, {"message": "Submission not found."}

    try:
        verification = VerificationService.approve_submission(
            submission=submission,
            verifier=request.user,
            remarks=payload.remarks,
        )

        return 200, verification

    except ValueError as exc:
        return 400, {"message": str(exc)}


@router.post(
    "/{submission_id}/reject",
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
    submission = KYCSubmission.objects.filter(
        id=submission_id,
    ).first()

    if submission is None:
        return 404, {"message": "Submission not found."}

    try:
        verification = VerificationService.reject_submission(
            submission=submission,
            verifier=request.user,
            remarks=payload.remarks,
        )

        return 200, verification

    except ValueError as exc:
        return 400, {"message": str(exc)}


@router.get(
    "/{submission_id}",
    response={
        200: VerificationResponseSchema,
        404: MessageSchema,
    },
)
def verification_detail(
    request,
    submission_id: UUID,
):
    verification = Verification.objects.filter(
        submission_id=submission_id,
    ).first()

    if verification is None:
        return 404, {"message": "Verification not found."}

    return 200, verification


@router.get(
    "/",
    response={
        200: List[VerificationResponseSchema],
        403: MessageSchema,
    },
)
def list_verifications(request):
    """
    Return all completed verification records.
    """

    if not request.user.is_staff:
        return 403, {"message": "Permission denied."}

    return 200, VerificationService.list_verifications()