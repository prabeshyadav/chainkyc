from typing import List

from ninja import File, Router
from ninja.files import UploadedFile

from management.jwt_auth import UserAuth

from .models import KYCSubmission
from .schemas import (
    DocumentTypeEnum,
    KYCSubmissionCreateSchema,
    KYCSubmissionListSchema,
    KYCSubmissionResponseSchema,
    KYCSubmissionUpdateSchema,
    MessageSchema,
)
from .services import KYCService

router = Router(tags=["KYC"])


# ============================================================================
# Create KYC
# ============================================================================

@router.post(
    "/",
    auth=UserAuth(),
    response={
        201: KYCSubmissionResponseSchema,
        400: MessageSchema,
    },
)
def create_kyc(
    request,
    data: KYCSubmissionCreateSchema,
    selfie: UploadedFile = File(...),
    identity_document: UploadedFile = File(...),
    document_type: DocumentTypeEnum = DocumentTypeEnum.CITIZENSHIP,
):
    """
    Create a new KYC submission.
    """

    try:
        submission = KYCService.create_submission(
            user=request.auth,
            data=data,
            selfie=selfie,
            identity_document=identity_document,
            document_type=document_type.value,
        )

        return 201, submission

    except ValueError as exc:
        return 400, {
            "message": str(exc)
        }



# ============================================================================
# Latest KYC
# ============================================================================

@router.get(
    "/me",
    auth=UserAuth,
    response={
        200: KYCSubmissionResponseSchema,
        404: MessageSchema,
    },
)
def my_latest_kyc(request):
    """
    Return the authenticated user's latest KYC submission.
    """

    submission = KYCService.get_latest_submission(
        request.auth
    )

    if submission is None:
        return 404, {
            "message": "No KYC submission found."
        }

    return 200, submission


# ============================================================================
# KYC History
# ============================================================================

@router.get(
    "/history",
    auth=UserAuth(),
    response=List[KYCSubmissionListSchema],
)
def my_history(request):
    """
    Return the authenticated user's KYC history.
    """

    return KYCService.get_submission_history(
        request.auth
    )


# ============================================================================
# KYC Status
# ============================================================================

@router.get(
    "/status",
    auth=UserAuth(),
)
def submission_status(request):
    """
    Return the latest KYC status.
    """

    submission = KYCService.get_latest_submission(
        request.auth
    )

    if submission is None:
        return {
            "submitted": False,
            "status": "NOT_SUBMITTED",
        }

    return {
        "submitted": True,
        "submission_id": str(submission.id),
        "status": submission.status,
        "version": submission.version,
    }
    
    
# ============================================================================
# Update KYC
# ============================================================================

@router.put(
    "/{submission_id}",
    auth=UserAuth(),
    response={
        200: KYCSubmissionResponseSchema,
        400: MessageSchema,
        404: MessageSchema,
    },
)
def update_kyc(
    request,
    submission_id: str,
    data: KYCSubmissionUpdateSchema,
    selfie: UploadedFile | None = File(None),
    identity_document: UploadedFile | None = File(None),
    document_type: DocumentTypeEnum | None = None,
):
    """
    Update a pending KYC submission.
    """

    submission = KYCSubmission.objects.filter(
        id=submission_id,
        user=request.auth,
    ).first()

    if submission is None:
        return 404, {
            "message": "KYC submission not found."
        }

    try:
        submission = KYCService.update_submission(
            submission=submission,
            data=data,
            selfie=selfie,
            identity_document=identity_document,
            document_type=document_type.value if document_type else None,
        )

        return 200, submission

    except ValueError as exc:
        return 400, {
            "message": str(exc)
        }
    