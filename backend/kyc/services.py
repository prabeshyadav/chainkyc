import base64
import secrets
from typing import Optional

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from ninja.errors import HttpError

from blockchain.services import anchor_kyc_submission
from kyc.encryption import (
    decrypt_file,
    encrypt_file,
    generate_dek,
    hash_file,
    unwrap_key,
    wrap_key,
)
from kyc.models import DocumentType, KYCStatus, KYCSubmission


class KycServiceError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def get_current_submission(user) -> Optional[KYCSubmission]:
    return (
        KYCSubmission.objects.filter(user=user, is_current=True)
        .order_by("-created_at")
        .first()
    )


def get_submission_for_user(user, submission_id) -> KYCSubmission:
    try:
        return KYCSubmission.objects.get(id=submission_id, user=user)
    except KYCSubmission.DoesNotExist as exc:
        raise KycServiceError("KYC submission not found.", 404) from exc


def get_submission_for_review(submission_id) -> KYCSubmission:
    try:
        return KYCSubmission.objects.select_related("user").get(id=submission_id)
    except KYCSubmission.DoesNotExist as exc:
        raise KycServiceError("KYC submission not found.", 404) from exc


@transaction.atomic
def submit_kyc(
    user,
    data: dict,
    document_front_bytes: bytes,
    selfie_bytes: bytes,
    document_back_bytes: Optional[bytes] = None,
) -> KYCSubmission:
    if get_current_submission(user):
        raise KycServiceError("You already have an active KYC submission.")

    document_type = data["document_type"]
    if document_type != DocumentType.PASSPORT and not document_back_bytes:
        raise KycServiceError("Back image is required for this document type.")

    dek = generate_dek()
    submission = KYCSubmission(
        user=user,
        full_name=data["full_name"].strip(),
        date_of_birth=data["date_of_birth"],
        gender=data["gender"].strip(),
        nationality=data["nationality"].strip(),
        phone=data["phone"].strip(),
        email=data.get("email", "").strip(),
        country=data["country"].strip(),
        province=data["province"].strip(),
        district=data["district"].strip(),
        street=data["street"].strip(),
        postal_code=data["postal_code"].strip(),
        document_type=document_type,
        document_number=data["document_number"].strip(),
        document_front_encrypted=encrypt_file(document_front_bytes, dek),
        document_front_hash=hash_file(document_front_bytes),
        document_back_encrypted=(
            encrypt_file(document_back_bytes, dek) if document_back_bytes else None
        ),
        document_back_hash=hash_file(document_back_bytes) if document_back_bytes else "",
        selfie_encrypted=encrypt_file(selfie_bytes, dek),
        selfie_hash=hash_file(selfie_bytes),
        encrypted_dek=wrap_key(dek),
        status=KYCStatus.PENDING,
        submitted_at=timezone.now(),
    )

    try:
        submission.full_clean()
    except ValidationError as exc:
        raise KycServiceError("; ".join(exc.messages), 400) from exc

    submission.save()
    return submission


def build_review_payload(submission: KYCSubmission) -> dict:
    dek = unwrap_key(submission.encrypted_dek)

    front_bytes = decrypt_file(submission.document_front_encrypted, dek)
    selfie_bytes = decrypt_file(submission.selfie_encrypted, dek)
    back_bytes = (
        decrypt_file(submission.document_back_encrypted, dek)
        if submission.document_back_encrypted
        else None
    )

    return {
        "id": submission.id,
        "wallet_address": submission.user.wallet_address,
        "full_name": submission.full_name,
        "date_of_birth": submission.date_of_birth,
        "gender": submission.gender,
        "nationality": submission.nationality,
        "phone": submission.phone,
        "email": submission.email or None,
        "country": submission.country,
        "province": submission.province,
        "district": submission.district,
        "street": submission.street,
        "postal_code": submission.postal_code,
        "document_type": submission.document_type,
        "document_number": submission.document_number,
        "document_front_image": base64.b64encode(front_bytes).decode(),
        "document_back_image": (
            base64.b64encode(back_bytes).decode() if back_bytes else None
        ),
        "selfie_image": base64.b64encode(selfie_bytes).decode(),
        "front_integrity_ok": hash_file(front_bytes) == submission.document_front_hash,
        "back_integrity_ok": (
            hash_file(back_bytes) == submission.document_back_hash if back_bytes else None
        ),
        "selfie_integrity_ok": hash_file(selfie_bytes) == submission.selfie_hash,
        "status": submission.status,
        "submitted_at": submission.submitted_at,
    }


@transaction.atomic
def approve_kyc(submission: KYCSubmission, verifier, note: Optional[str] = None):
    if submission.status not in {KYCStatus.PENDING, KYCStatus.UNDER_REVIEW}:
        raise KycServiceError("Only pending submissions can be approved.", 400)

    submission.status = KYCStatus.UNDER_REVIEW
    submission.save(update_fields=["status", "updated_at"])

    salt = secrets.token_hex(16)
    anchor = anchor_kyc_submission(submission, salt=salt)

    submission.status = KYCStatus.VERIFIED
    submission.verified_by = verifier
    submission.verified_at = timezone.now()
    submission.salt = anchor.salt
    submission.data_hash = anchor.data_hash
    submission.ipfs_cid = anchor.ipfs_cid
    submission.tx_hash = anchor.tx_hash
    submission.save()

    return submission, anchor


@transaction.atomic
def reject_kyc(submission: KYCSubmission, verifier, rejection_reason: str):
    if submission.status not in {KYCStatus.PENDING, KYCStatus.UNDER_REVIEW}:
        raise KycServiceError("Only pending submissions can be rejected.", 400)

    submission.status = KYCStatus.REJECTED
    submission.rejection_reason = rejection_reason.strip()
    submission.verified_by = verifier
    submission.verified_at = timezone.now()
    submission.save()
    return submission


@transaction.atomic
def update_kyc(
    user,
    submission: KYCSubmission,
    data: dict,
    document_front_bytes: Optional[bytes] = None,
    selfie_bytes: Optional[bytes] = None,
    document_back_bytes: Optional[bytes] = None,
) -> KYCSubmission:
    if submission.status not in {KYCStatus.PENDING, KYCStatus.DRAFT, KYCStatus.REJECTED}:
        raise KycServiceError("Only pending, draft, or rejected submissions can be updated.", 400)

    # Update text fields
    for field, value in data.items():
        if value is not None and hasattr(submission, field):
            if isinstance(value, str):
                value = value.strip()
            setattr(submission, field, value)

    # Unwrap existing DEK to encrypt new files
    dek = unwrap_key(submission.encrypted_dek)

    if document_front_bytes:
        submission.document_front_encrypted = encrypt_file(document_front_bytes, dek)
        submission.document_front_hash = hash_file(document_front_bytes)

    if selfie_bytes:
        submission.selfie_encrypted = encrypt_file(selfie_bytes, dek)
        submission.selfie_hash = hash_file(selfie_bytes)

    if document_back_bytes:
        submission.document_back_encrypted = encrypt_file(document_back_bytes, dek)
        submission.document_back_hash = hash_file(document_back_bytes)
    elif submission.document_type == DocumentType.PASSPORT:
        # If document type is passport, back document is not needed, clear it
        submission.document_back_encrypted = None
        submission.document_back_hash = ""

    # Reset status and timestamps
    submission.status = KYCStatus.PENDING
    submission.rejection_reason = ""
    submission.submitted_at = timezone.now()

    try:
        submission.full_clean()
    except ValidationError as exc:
        raise KycServiceError("; ".join(exc.messages), 400) from exc

    submission.save()
    return submission


def handle_service_error(error: KycServiceError):
    raise HttpError(error.status_code, error.message)
