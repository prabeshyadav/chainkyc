import uuid
from datetime import date, datetime
from typing import Optional

from ninja import Field, Schema

from .models import Verification


# ---------------------------------------------------------------------------
# KYC Detail (Verifier)
# ---------------------------------------------------------------------------

class VerifierKYCDetailSchema(Schema):
    id: uuid.UUID

    wallet_address: str = Field(
        ...,
        alias="user.wallet_address",
    )

    full_name: str
    date_of_birth: date

    country: str
    nationality: str

    phone_number: str
    email: str
    address: str

    document_number: str

    document_type: str = Field(
        ...,
        alias="identity_document.document_type",
    )

    selfie: str = Field(
        ...,
        alias="selfie.file.url",
    )

    identity_document: str = Field(
        ...,
        alias="identity_document.file.url",
    )

    status: str
    version: int

    created_at: datetime
    updated_at: datetime
    verification_id: Optional[uuid.UUID] = None

    @staticmethod
    def resolve_wallet_address(obj):
        return obj.user.wallet_address
    
    @staticmethod
    def resolve_verification_id(obj):
        if hasattr(obj, "verification"):
            return obj.verification.id
        return None


# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------

class VerificationApproveSchema(Schema):
    remarks: str = ""


class VerificationRejectSchema(Schema):
    remarks: str


# ---------------------------------------------------------------------------
# Blockchain
# ---------------------------------------------------------------------------

class BlockchainRecordResponseSchema(Schema):
    id: uuid.UUID
    ipfs_cid: str
    data_hash: str
    transaction_hash: str
    block_number: int
    kyc_version: int
    created_at: datetime


# ---------------------------------------------------------------------------
# Verification Response
# ---------------------------------------------------------------------------

class VerificationResponseSchema(Schema):
    id: uuid.UUID

    submission_id: uuid.UUID = Field(
        ...,
        alias="submission.id",
    )

    verifier_wallet: str = Field(
        ...,
        alias="verifier.wallet_address",
    )

    remarks: Optional[str] = None

    verified_at: datetime

    blockchain_record: Optional[BlockchainRecordResponseSchema] = None

    @staticmethod
    def resolve_submission_id(obj: Verification):
        return obj.submission.id

    @staticmethod
    def resolve_verifier_wallet(obj: Verification):
        return obj.verifier.wallet_address


# ---------------------------------------------------------------------------
# Pending List
# ---------------------------------------------------------------------------

class PendingKYCResponseSchema(Schema):
    submission_id: uuid.UUID
    verification_id: Optional[uuid.UUID] = None

    full_name: str
    version: int
    created_at: datetime

    @staticmethod
    def resolve_submission_id(obj):
        return obj.id

    @staticmethod
    def resolve_verification_id(obj):
        if hasattr(obj, "verification"):
            return obj.verification.id
        return None


# ---------------------------------------------------------------------------
# Generic Schemas
# ---------------------------------------------------------------------------

class MessageSchema(Schema):
    message: str


class ErrorSchema(Schema):
    detail: str


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

class VerifierDashboardSchema(Schema):
    pending: int
    approved: int
    rejected: int
    uploaded_to_blockchain: int
    
    

class PrepareBlockchainResponseSchema(Schema):
    verification_id: uuid.UUID
    user_wallet: str
    ipfs_cid: str
    data_hash: str
    kyc_version: int
    

class BlockchainCompleteSchema(Schema):
    transaction_hash: str
    block_number: int
    
class BlockchainCompleteResponseSchema(Schema):
    verification_id: uuid.UUID

    transaction_hash: str
    block_number: int

    ipfs_cid: str
    data_hash: str

    kyc_version: int