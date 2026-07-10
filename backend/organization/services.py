from django.db import transaction
from django.utils.text import slugify
from ninja.errors import HttpError

from bank.models import Bank
from organization.models import Organization, OrganizationType


class OrganizationServiceError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


@transaction.atomic
def create_organization(data: dict) -> Organization:
    slug = data.get("slug") or slugify(data["name"])
    if Organization.objects.filter(slug=slug).exists():
        raise OrganizationServiceError("Organization slug already exists.", 400)

    return Organization.objects.create(
        name=data["name"].strip(),
        slug=slug,
        org_type=data["org_type"],
        contact_email=data["contact_email"].strip(),
        contact_phone=data.get("contact_phone", "").strip(),
        address=data.get("address", "").strip(),
    )


@transaction.atomic
def register_bank(data: dict) -> Bank:
    organization = create_organization(
        {
            "name": data["name"],
            "slug": data.get("slug"),
            "org_type": OrganizationType.BANK,
            "contact_email": data["contact_email"],
            "contact_phone": data.get("contact_phone", ""),
            "address": data.get("address", ""),
        }
    )

    if Bank.objects.filter(bank_code=data["bank_code"]).exists():
        raise OrganizationServiceError("Bank code already exists.", 400)

    return Bank.objects.create(
        organization=organization,
        bank_code=data["bank_code"].strip().upper(),
        swift_code=data.get("swift_code", "").strip().upper(),
        license_number=data["license_number"].strip(),
        country=data["country"].strip(),
        wallet_address=data.get("wallet_address"),
        is_verified=data.get("is_verified", False),
    )


def handle_service_error(error: OrganizationServiceError):
    raise HttpError(error.status_code, error.message)
