from ninja import Router

from management.role import get_wallet_role
from management.schemas import WalletSchema
from management.permission import is_admin
from management.jwt_auth import JWTAuth

from .services import (
    add_verifier,
    remove_verifier,
    add_bank,
    remove_bank,
)


router = Router(
    tags=["Admin"],
    auth=JWTAuth(),
)


def check_admin(request):

    wallet = request.auth.wallet_address

    return is_admin(wallet)


@router.post("/verifier/add")
def create_verifier(
    request,
    payload: WalletSchema
):

    if not check_admin(request):
        return 403, {
            "error": "Only admin allowed"
        }


    tx_hash = add_verifier(
        payload.wallet_address
    )


    return {
        "message": "Verifier added",
        "transaction": tx_hash
    }



@router.post("/verifier/remove")
def delete_verifier(
    request,
    payload: WalletSchema
):

    if not check_admin(request):
        return 403, {
            "error": "Only admin allowed"
        }


    tx_hash = remove_verifier(
        payload.wallet_address
    )


    return {
        "message": "Verifier removed",
        "transaction": tx_hash
    }



@router.post("/bank/add")
def create_bank(
    request,
    payload: WalletSchema
):

    if not check_admin(request):
        return 403, {
            "error": "Only admin allowed"
        }


    tx_hash = add_bank(
        payload.wallet_address
    )


    return {
        "message": "Bank added",
        "transaction": tx_hash
    }



@router.post("/bank/remove")
def delete_bank(
    request,
    payload: WalletSchema
):

    if not check_admin(request):
        return 403, {
            "error": "Only admin allowed"
        }


    tx_hash = remove_bank(
        payload.wallet_address
    )


    return {
        "message": "Bank removed",
        "transaction": tx_hash
    }
    
@router.get("/check-admin")
def check_admin_status(request):

    if not check_admin(request):
        return 403, {
            "error": "Only admin allowed"
        }


    return {
        "message": "Admin access granted"
    }
@router.get("/me")
def get_user_info(request):
        wallet = request.auth.wallet_address
        role = get_wallet_role(wallet)

        return {
            "wallet_address": wallet,
            "role": role
        }