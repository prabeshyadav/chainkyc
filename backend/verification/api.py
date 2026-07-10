from ninja import Router
from ninja.errors import HttpError

from bank.models import Bank
from management.jwt_auth import JWTAuth
from verification.models import VerificationRequest
from verification.schemas import VerificationRequestIn, VerificationRequestOut, VerificationRespondIn
from verification.services import (
    VerificationServiceError,
    create_verification_request,
    handle_service_error,
    respond_to_request,
)

router = Router(tags=["verification"])


def serialize_request(request_obj: VerificationRequest) -> dict:
    kyc = request_obj.kyc_submission
    return {
        "id": request_obj.id,
        "bank_id": request_obj.bank_id,
        "bank_code": request_obj.bank.bank_code,
        "user_wallet": request_obj.user.wallet_address,
        "kyc_submission_id": kyc.id if kyc else None,
        "kyc_status": kyc.status if kyc else None,
        "purpose": request_obj.purpose,
        "status": request_obj.status,
        "response_note": request_obj.response_note,
        "requested_at": request_obj.requested_at,
        "responded_at": request_obj.responded_at,
    }


@router.post("/request/{bank_id}", response=VerificationRequestOut)
def request_verification(request, bank_id: str, payload: VerificationRequestIn):
    bank = Bank.objects.filter(id=bank_id, is_verified=True).first()
    if bank is None:
        raise HttpError(404, "Verified bank not found.")

    try:
        request_obj = create_verification_request(
            bank=bank,
            wallet_address=payload.wallet_address,
            purpose=payload.purpose,
        )
        request_obj = VerificationRequest.objects.select_related(
            "bank", "user", "kyc_submission"
        ).get(id=request_obj.id)
        return serialize_request(request_obj)
    except VerificationServiceError as exc:
        handle_service_error(exc)


@router.get("/my-requests", response=list[VerificationRequestOut], auth=JWTAuth())
def my_verification_requests(request):
    requests = VerificationRequest.objects.select_related(
        "bank", "user", "kyc_submission"
    ).filter(user=request.auth)
    return [serialize_request(item) for item in requests]


@router.get("/requests/{request_id}", response=VerificationRequestOut)
def get_verification_request(request, request_id: str):
    request_obj = VerificationRequest.objects.select_related(
        "bank", "user", "kyc_submission"
    ).filter(id=request_id).first()
    if request_obj is None:
        raise HttpError(404, "Verification request not found.")
    return serialize_request(request_obj)


@router.post("/requests/{request_id}/respond", response=VerificationRequestOut)
def respond_verification_request(request, request_id: str, payload: VerificationRespondIn):
    request_obj = VerificationRequest.objects.select_related(
        "bank", "user", "kyc_submission"
    ).filter(id=request_id).first()
    if request_obj is None:
        raise HttpError(404, "Verification request not found.")

    try:
        request_obj = respond_to_request(
            request_obj,
            status=payload.status,
            note=payload.response_note or "",
        )
        return serialize_request(request_obj)
    except VerificationServiceError as exc:
        handle_service_error(exc)
