from ninja import File, Form, Router
from ninja.errors import HttpError
from ninja.files import UploadedFile

from management.jwt_auth import JWTAuth, VerifierAuth
from .schemas import (
    KYCApprovalResultOut,
    KYCApproveSchema,
    KYCDetailOut,
    KYCRejectSchema,
    KYCRejectionResultOut,
    KYCReviewOut,
    KYCStatusOut,
    KYCSubmitSchema,
    KYCUpdateSchema,
)
from .services import (
    KycServiceError,
    approve_kyc,
    build_review_payload,
    get_current_submission,
    get_submission_for_review,
    get_submission_for_user,
    handle_service_error,
    reject_kyc,
    submit_kyc,
    update_kyc,
)

router = Router(tags=["kyc"])


@router.post("/submit", response=KYCDetailOut, auth=JWTAuth())
def submit_kyc_endpoint(
    request,
    data: Form[KYCSubmitSchema],
    document_front: File[UploadedFile],
    selfie: File[UploadedFile],
    document_back: File[UploadedFile] = None,
):
    try:
        return submit_kyc(
            user=request.auth,
            data=data.dict(),
            document_front_bytes=document_front.read(),
            selfie_bytes=selfie.read(),
            document_back_bytes=document_back.read() if document_back else None,
        )
    except KycServiceError as exc:
        handle_service_error(exc)


@router.get("/me", response=KYCDetailOut, auth=JWTAuth())
def get_my_kyc(request):
    submission = get_current_submission(request.auth)
    if submission is None:
        raise HttpError(404, "No KYC submission found.")
    return submission


@router.get("/status/{submission_id}", response=KYCStatusOut, auth=JWTAuth())
def get_status(request, submission_id: str):
    try:
        return get_submission_for_user(request.auth, submission_id)
    except KycServiceError as exc:
        handle_service_error(exc)


@router.get("/review/{submission_id}", response=KYCReviewOut, auth=VerifierAuth())
def review_submission(request, submission_id: str):
    try:
        submission = get_submission_for_review(submission_id)
        return build_review_payload(submission)
    except KycServiceError as exc:
        handle_service_error(exc)


@router.post("/approve/{submission_id}", response=KYCApprovalResultOut, auth=VerifierAuth())
def approve_kyc_endpoint(request, submission_id: str, payload: KYCApproveSchema):
    try:
        submission = get_submission_for_review(submission_id)
        submission, _anchor = approve_kyc(submission, request.auth, payload.note)
        return {
            "id": submission.id,
            "status": submission.status,
            "ipfs_cid": submission.ipfs_cid,
            "data_hash": submission.data_hash,
            "tx_hash": submission.tx_hash,
            "verified_at": submission.verified_at,
        }
    except KycServiceError as exc:
        handle_service_error(exc)


@router.post("/reject/{submission_id}", response=KYCRejectionResultOut, auth=VerifierAuth())
def reject_kyc_endpoint(request, submission_id: str, payload: KYCRejectSchema):
    try:
        submission = get_submission_for_review(submission_id)
        submission = reject_kyc(submission, request.auth, payload.rejection_reason)
        return {
            "id": submission.id,
            "status": submission.status,
            "rejection_reason": submission.rejection_reason,
        }
    except KycServiceError as exc:
        handle_service_error(exc)


@router.post("/update", response=KYCDetailOut, auth=JWTAuth())
def update_kyc_endpoint(
    request,
    data: Form[KYCUpdateSchema],
    document_front: File[UploadedFile] = None,
    selfie: File[UploadedFile] = None,
    document_back: File[UploadedFile] = None,
):
    try:
        submission = get_current_submission(request.auth)
        if submission is None:
            raise HttpError(404, "No KYC submission found to update.")
        return update_kyc(
            user=request.auth,
            submission=submission,
            data=data.dict(exclude_unset=True),
            document_front_bytes=document_front.read() if document_front else None,
            selfie_bytes=selfie.read() if selfie else None,
            document_back_bytes=document_back.read() if document_back else None,
        )
    except KycServiceError as exc:
        handle_service_error(exc)

