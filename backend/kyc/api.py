from typing import List

from ninja import File, Router
from ninja.files import UploadedFile
from requests import request

from management.jwt_auth import JWTAuth


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


@router.post(
    "/",
    response={
        201: KYCSubmissionResponseSchema,
        400: MessageSchema,
    },
    auth=JWTAuth()
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
    
    print("=" * 50)
    print("request.user:", request.user)
    print("request.auth:", request.auth)
    print("type(request.auth):", type(request.auth))
    print("=" * 50)
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
        return 400, {"message": str(exc)}


@router.put(
    "/{submission_id}",
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

    submission = (
        KYCSubmission.objects.filter(
            id=submission_id,
            user=request.user,
        ).first()
    )

    if submission is None:
        return 404, {"message": "KYC submission not found."}

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
        return 400, {"message": str(exc)}


@router.get(
    "/me",
    response={
        200: KYCSubmissionResponseSchema,
        404: MessageSchema,
        
    },
)
def my_latest_kyc(request):
    """
    Return the latest KYC submission for the authenticated user.
    """

    submission = KYCService.get_latest_submission(request.user)

    if submission is None:
        return 404, {"message": "No KYC submission found."}

    return 200, submission


@router.get(
    "/history",
    response=List[KYCSubmissionListSchema],
)
def my_history(request):
    """
    Return the authenticated user's KYC submission history.
    """

    return KYCService.get_submission_history(request.user)