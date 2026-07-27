import uuid
from datetime import datetime
from typing import Optional

from ninja import Schema

from organization.schemas import OrganizationOut


class BankRegisterIn(Schema):
    name: str
    slug: Optional[str] = None
    contact_email: str
    contact_phone: Optional[str] = ""
    address: Optional[str] = ""
    bank_code: str
    swift_code: Optional[str] = ""
    license_number: str
    country: str
    wallet_address: Optional[str] = None
    is_verified: Optional[bool] = False


class BankOut(Schema):
    id: uuid.UUID
    bank_code: str
    swift_code: str
    license_number: str
    country: str
    wallet_address: Optional[str] = None
    is_verified: bool
    organization: OrganizationOut
    created_at: datetime


class PublicKYCResponseSchema(Schema):
    verified: bool
    version: int
    ipfs_cid: str
    data_hash: str
    verified_at: int
    verified_by: str


class BankAccessSchema(Schema):
    bank_wallet: str


class AccessResponseSchema(Schema):
    transaction_hash: str
    status: int


class AccessStatusSchema(Schema):
    has_access: bool


class CheckKYCRequestSchema(Schema):
    user_wallet: str
    bank_wallet: str


class KYCSubmissionSchema(Schema):
    id: str
    status: str
    version: int
    created_at: str
    updated_at: str


class KYCUserSchema(Schema):
    wallet_address: str
    full_name: str
    date_of_birth: str
    country: str
    nationality: str
    phone_number: str
    email: str
    address: str
    document_number: str


class KYCDocumentsSchema(Schema):
    document_type: Optional[str] = None
    identity_document: Optional[str] = None
    selfie: Optional[str] = None


class KYCVerificationSchema(Schema):
    verifier_wallet: str
    remarks: str
    verified_at: str


class KYCDataSchema(Schema):
    submission: KYCSubmissionSchema
    user: KYCUserSchema
    documents: KYCDocumentsSchema
    verification: KYCVerificationSchema


class CheckKYCResponseSchema(Schema):
    user_wallet: str
    ipfs_cid: str
    data_hash: str
    verified_at: int
    kyc_data: KYCDataSchema


class BankDecryptedKYCResponseSchema(Schema):
    user_wallet: str
    kyc: KYCDataSchema
    
class MessageSchema(Schema):
    message: str