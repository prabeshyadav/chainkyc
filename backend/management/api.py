from ninja import Router
from uuid import UUID

from management.jwt_auth import admin_auth

from .schemas import (
    WalletSchema,
    MessageSchema,
)
from .services import (
    add_verifier,
    remove_verifier,
    list_verifiers,
    add_bank,
    remove_bank,
    list_banks,
)


router = Router(
    tags=["Admin"],
    auth=admin_auth,
)


# ------------------------------------------------------------------
# Verifiers
# ------------------------------------------------------------------

@router.post(
    "/verifiers",
    response=MessageSchema,
)
def create_verifier(request, payload: WalletSchema):

    result = add_verifier(payload.wallet_address)

    return {
        "message": "Verifier added successfully.",
        "tx_hash": result["tx_hash"],
        "status": result["status"],
    }


@router.get(
    "/verifiers",
    response=list[str],
)
def get_verifiers(request):

    return list_verifiers()


@router.delete(
    "/verifiers/{wallet_address}",
    response=MessageSchema,
)
def delete_verifier(
    request,
    wallet_address: str,
):

    result = remove_verifier(wallet_address)

    return {
        "message": "Verifier removed successfully.",
        "tx_hash": result["tx_hash"],
        "status": result["status"],
    }


# ------------------------------------------------------------------
# Banks
# ------------------------------------------------------------------

@router.post(
    "/banks",
    response=MessageSchema,
)
def create_bank(request, payload: WalletSchema):

    result = add_bank(payload.wallet_address)

    return {
        "message": "Bank added successfully.",
        "tx_hash": result["tx_hash"],
        "status": result["status"],
    }


@router.get(
    "/banks",
    response=list[str],
)
def get_banks(request):

    return list_banks()


@router.delete(
    "/banks/{wallet_address}",
    response=MessageSchema,
)
def delete_bank(
    request,
    wallet_address: str,
):

    result = remove_bank(wallet_address)

    return {
        "message": "Bank removed successfully.",
        "tx_hash": result["tx_hash"],
        "status": result["status"],
    }