from django.db import transaction
from django.utils import timezone
from ninja.errors import HttpError

from kyc.models import KYCStatus, KYCSubmission
from management.models import User
from verification.models import VerificationRequest, VerificationStatus


class VerificationServiceError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


@transaction.atomic
def create_verification_request(bank, wallet_address: str, purpose: str) -> VerificationRequest:
    try:
        user = User.objects.get(wallet_address=wallet_address.lower())
    except User.DoesNotExist as exc:
        raise VerificationServiceError("Wallet user not found.", 404) from exc

    kyc_submission = (
        KYCSubmission.objects.filter(user=user, is_current=True)
        .order_by("-created_at")
        .first()
    )

    request_obj = VerificationRequest.objects.create(
        bank=bank,
        user=user,
        kyc_submission=kyc_submission,
        purpose=purpose.strip(),
        status=VerificationStatus.PENDING,
    )

    if kyc_submission and kyc_submission.status == KYCStatus.VERIFIED:
        request_obj.status = VerificationStatus.APPROVED
        request_obj.response_note = "User has a verified KYC submission."
        request_obj.responded_at = timezone.now()
        request_obj.save()

    return request_obj


def respond_to_request(request_obj: VerificationRequest, status: str, note: str = ""):
    if request_obj.status != VerificationStatus.PENDING:
        raise VerificationServiceError("This request has already been processed.", 400)

    request_obj.status = status
    request_obj.response_note = note.strip()
    request_obj.responded_at = timezone.now()
    request_obj.save()
    return request_obj


def handle_service_error(error: VerificationServiceError):
    raise HttpError(error.status_code, error.message)
