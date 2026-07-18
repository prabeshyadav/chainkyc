from typing import List
from uuid import UUID

from ninja import Router

from management.jwt_auth import verifier_auth

from .schemas import (
    PendingKYCResponseSchema,
    VerificationApproveSchema,
    VerificationRejectSchema,
    VerificationResponseSchema,
    MessageSchema,
)
from .services import VerificationService


router = Router(tags=["Verifier"])


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
    "/{submission_id}",
    auth=verifier_auth,
    response={
        200: PendingKYCResponseSchema,
        404: MessageSchema,
    },
)
def submission_detail(
    request,
    submission_id: UUID,
):
    """
    Return a pending KYC submission.
    """

    submission = VerificationService.get_submission(
        submission_id
    )

    if submission is None:
        return 404, {
            "message": "Submission not found."
        }

    return submission


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
    Approve a KYC submission.
    """

    try:
        verification = VerificationService.approve_submission(
            submission_id=submission_id,
            verifier=request.auth,
            remarks=payload.remarks,
        )

        return verification

    except ValueError as exc:
        return 400, {
            "message": str(exc)
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
    Reject a KYC submission.
    """

    try:
        verification = VerificationService.reject_submission(
            submission_id=submission_id,
            verifier=request.auth,
            remarks=payload.remarks,
        )

        return verification

    except ValueError as exc:
        return 400, {
            "message": str(exc)
        }
        

from .schemas import VerifierDashboardSchema


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