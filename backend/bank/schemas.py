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

