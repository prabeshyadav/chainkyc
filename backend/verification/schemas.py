import uuid
from datetime import datetime
from typing import Optional

from ninja import Schema

from kyc.models import KYCStatus
from verification.models import VerificationStatus


class VerificationRequestIn(Schema):
    wallet_address: str
    purpose: str


class VerificationRequestOut(Schema):
    id: uuid.UUID
    bank_id: uuid.UUID
    bank_code: str
    user_wallet: str
    kyc_submission_id: Optional[uuid.UUID] = None
    kyc_status: Optional[KYCStatus] = None
    purpose: str
    status: VerificationStatus
    response_note: str
    requested_at: datetime
    responded_at: Optional[datetime] = None


class VerificationRespondIn(Schema):
    status: VerificationStatus
    response_note: Optional[str] = ""
