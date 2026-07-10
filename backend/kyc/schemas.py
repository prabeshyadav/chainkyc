import uuid
from datetime import date, datetime
from typing import Optional

from ninja import ModelSchema, Schema

from .models import DocumentType, KYCStatus, KYCSubmission


class KYCSubmitSchema(Schema):
    full_name: str
    date_of_birth: date
    gender: str
    nationality: str
    phone: str
    email: Optional[str] = None
    country: str
    province: str
    district: str
    street: str
    postal_code: str
    document_type: DocumentType
    document_number: str


class KYCUpdateSchema(Schema):
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    nationality: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    country: Optional[str] = None
    province: Optional[str] = None
    district: Optional[str] = None
    street: Optional[str] = None
    postal_code: Optional[str] = None
    document_type: Optional[DocumentType] = None
    document_number: Optional[str] = None
    change_reason: Optional[str] = None


class KYCStatusOut(Schema):
    id: uuid.UUID
    status: KYCStatus
    document_type: DocumentType
    rejection_reason: Optional[str] = None
    submitted_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    version: int
    is_current: bool


class KYCDetailOut(ModelSchema):
    class Meta:
        model = KYCSubmission
        fields = [
            "id",
            "full_name",
            "date_of_birth",
            "gender",
            "nationality",
            "phone",
            "email",
            "country",
            "province",
            "district",
            "street",
            "postal_code",
            "document_type",
            "document_number",
            "status",
            "rejection_reason",
            "submitted_at",
            "verified_at",
            "version",
            "is_current",
            "ipfs_cid",
            "data_hash",
            "tx_hash",
        ]


class KYCReviewOut(Schema):
    id: uuid.UUID
    wallet_address: str
    full_name: str
    date_of_birth: date
    gender: str
    nationality: str
    phone: str
    email: Optional[str] = None
    country: str
    province: str
    district: str
    street: str
    postal_code: str
    document_type: DocumentType
    document_number: str
    document_front_image: str
    document_back_image: Optional[str] = None
    selfie_image: str
    front_integrity_ok: bool
    back_integrity_ok: Optional[bool] = None
    selfie_integrity_ok: bool
    status: KYCStatus
    submitted_at: Optional[datetime] = None


class KYCApproveSchema(Schema):
    note: Optional[str] = None


class KYCRejectSchema(Schema):
    rejection_reason: str


class KYCApprovalResultOut(Schema):
    id: uuid.UUID
    status: KYCStatus
    ipfs_cid: str
    data_hash: str
    tx_hash: str
    verified_at: datetime


class KYCRejectionResultOut(Schema):
    id: uuid.UUID
    status: KYCStatus
    rejection_reason: str


class KYCPublicVerificationOut(Schema):
    wallet_address: str
    status: KYCStatus
    data_hash: Optional[str] = None
    tx_hash: Optional[str] = None
    verified_at: Optional[datetime] = None
