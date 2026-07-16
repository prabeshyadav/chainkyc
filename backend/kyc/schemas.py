import uuid
from datetime import date, datetime
from enum import Enum
from typing import List, Optional

from ninja import Field, Schema

from .models import KYCDocument, KYCSubmission


# ============================================================================
# Enums
# ============================================================================

class DocumentTypeEnum(str, Enum):
    CITIZENSHIP = "CITIZENSHIP"
    DRIVING_LICENSE = "DRIVING_LICENSE"
    NATIONAL_ID = "NATIONAL_ID"
    SELFIE = "SELFIE"


class KYCStatusEnum(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


# ============================================================================
# Request Schemas
# ============================================================================

class KYCSubmissionCreateSchema(Schema):
    full_name: str
    date_of_birth: date
    country: str
    nationality: str
    document_number: str
    phone_number: str
    email: str
    address: str


class KYCDocumentCreateSchema(Schema):
    """
    The uploaded file itself is received separately via File(...).
    This schema only validates the selected document type.
    """
    document_type: DocumentTypeEnum


# ============================================================================
# Response Schemas
# ============================================================================

class KYCDocumentResponseSchema(Schema):
    id: uuid.UUID

    document_type: DocumentTypeEnum
    document_type_display: str = Field(
        ...,
        alias="get_document_type_display",
    )

    file: str

    uploaded_at: datetime

    @staticmethod
    def resolve_file(obj: KYCDocument):
        return obj.file.url if obj.file else None

    @staticmethod
    def resolve_document_type_display(obj: KYCDocument):
        return obj.get_document_type_display()


class KYCSubmissionResponseSchema(Schema):
    id: uuid.UUID

    full_name: str
    date_of_birth: date

    country: str
    nationality: str

    document_number: str

    phone_number: str
    email: str

    address: str

    version: int

    status: KYCStatusEnum
    status_display: str = Field(
        ...,
        alias="get_status_display",
    )

    created_at: datetime
    updated_at: datetime

    documents: List[KYCDocumentResponseSchema]

    identity_document: Optional[KYCDocumentResponseSchema] = None
    selfie: Optional[KYCDocumentResponseSchema] = None

    @staticmethod
    def resolve_status_display(obj: KYCSubmission):
        return obj.get_status_display()


class KYCSubmissionListSchema(Schema):
    id: uuid.UUID

    full_name: str

    version: int

    status: KYCStatusEnum

    created_at: datetime
    
    
class KYCSubmissionUpdateSchema(Schema):
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    country: Optional[str] = None
    nationality: Optional[str] = None
    document_number: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


# ============================================================================
# Generic Response Schemas
# ============================================================================

class MessageSchema(Schema):
    message: str


class ErrorSchema(Schema):
    detail: str