from ninja import Router
from ninja.errors import HttpError

from bank.models import Bank
from bank.schemas import BankOut, BankRegisterIn
from organization.services import OrganizationServiceError, handle_service_error, register_bank

router = Router(tags=["banks"])


def serialize_bank(bank: Bank) -> dict:
    org = bank.organization
    return {
        "id": bank.id,
        "bank_code": bank.bank_code,
        "swift_code": bank.swift_code,
        "license_number": bank.license_number,
        "country": bank.country,
        "wallet_address": bank.wallet_address,
        "is_verified": bank.is_verified,
        "organization": {
            "id": org.id,
            "name": org.name,
            "slug": org.slug,
            "org_type": org.org_type,
            "contact_email": org.contact_email,
            "contact_phone": org.contact_phone,
            "address": org.address,
            "is_active": org.is_active,
            "created_at": org.created_at,
        },
        "created_at": bank.created_at,
    }


@router.get("/", response=list[BankOut])
def list_banks(request):
    banks = Bank.objects.select_related("organization").filter(is_verified=True)
    return [serialize_bank(bank) for bank in banks]


@router.post("/register", response=BankOut)
def register_bank_endpoint(request, payload: BankRegisterIn):
    try:
        bank = register_bank(payload.dict())
        bank = Bank.objects.select_related("organization").get(id=bank.id)
        return serialize_bank(bank)
    except OrganizationServiceError as exc:
        handle_service_error(exc)


@router.get("/{bank_id}", response=BankOut)
def get_bank(request, bank_id: str):
    bank = Bank.objects.select_related("organization").filter(id=bank_id).first()
    if bank is None:
        raise HttpError(404, "Bank not found.")
    return serialize_bank(bank)
