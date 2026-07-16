import uuid
from datetime import datetime
from typing import Optional

from ninja import Field, Schema

from .models import BlockchainRecord, Verification


# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------

class VerificationApproveSchema(Schema):
    """
    Payload used when a verifier approves a KYC submission.
    """
    remarks: str = ""


class VerificationRejectSchema(Schema):
    """
    Payload used when a verifier rejects a KYC submission.
    Rejection reason should always be provided.
    """
    remarks: str


# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------

class BlockchainRecordResponseSchema(Schema):
    id: uuid.UUID
    ipfs_cid: str
    data_hash: str
    transaction_hash: str
    block_number: int
    kyc_version: int
    created_at: datetime


class VerificationResponseSchema(Schema):
    id: uuid.UUID

    submission_id: uuid.UUID

    verifier_wallet: str = Field(
        ...,
        alias="verifier.wallet_address",
    )

    remarks: str
    verified_at: datetime

    blockchain_record: Optional[BlockchainRecordResponseSchema] = None

    @staticmethod
    def resolve_verifier_wallet(obj: Verification):
        return obj.verifier.wallet_address


class PendingKYCResponseSchema(Schema):
    id: uuid.UUID
    full_name: str
    version: int
    created_at: datetime


class MessageSchema(Schema):
    message: str


class ErrorSchema(Schema):
    detail: str