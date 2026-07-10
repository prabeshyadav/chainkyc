import uuid
from datetime import datetime
from typing import Optional

from ninja import Schema

from organization.models import OrganizationType


class OrganizationIn(Schema):
    name: str
    slug: Optional[str] = None
    org_type: OrganizationType
    contact_email: str
    contact_phone: Optional[str] = ""
    address: Optional[str] = ""


class OrganizationOut(Schema):
    id: uuid.UUID
    name: str
    slug: str
    org_type: OrganizationType
    contact_email: str
    contact_phone: str
    address: str
    is_active: bool
    created_at: datetime
