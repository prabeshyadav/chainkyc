from ninja import Router

from management.jwt_auth import bank_auth, user_auth

from .service import BankService
from .schemas import (
    BankDecryptedKYCResponseSchema,
    BankKYCResponseSchema,
    BankAccessSchema,
    AccessResponseSchema,
    AccessStatusSchema,
)

router = Router(tags=["Bank"])


# --------------------------------------------------------
# Bank Info
# --------------------------------------------------------

@router.get(
    "/me",
    auth=bank_auth,
)
def me(request):
    return {
        "wallet_address": request.auth.wallet_address,
        "role": request.auth.role,
    }


# --------------------------------------------------------
# View User KYC Metadata
# --------------------------------------------------------

@router.get(
    "/kyc/{wallet_address}",
    auth=bank_auth,
    response=BankKYCResponseSchema,
)
def get_user_kyc(
    request,
    wallet_address: str,
):
    return BankService.check_kyc(
        wallet_address,
        request.auth.wallet_address,
    )


# --------------------------------------------------------
# Access Management
# --------------------------------------------------------

@router.post(
    "/grant-access",
    auth=user_auth,
    response=AccessResponseSchema,
)
def grant_access(
    request,
    payload: BankAccessSchema,
):
    """
    Grant a bank permission to access the user's KYC.
    """
    return BankService.grant_access(
        payload.bank_wallet,
    )


@router.post(
    "/revoke-access",
    auth=user_auth,
    response=AccessResponseSchema,
)
def revoke_access(
    request,
    payload: BankAccessSchema,
):
    """
    Revoke a bank's permission to access the user's KYC.
    """
    return BankService.revoke_access(
        payload.bank_wallet,
    )


@router.get(
    "/access/{bank_wallet}",
    auth=user_auth,
    response=AccessStatusSchema,
)
def access_status(
    request,
    bank_wallet: str,
):
    """
    Check whether the specified bank currently has permission
    to access the user's KYC.
    """
    return BankService.has_access(
        request.auth.wallet_address,
        bank_wallet,
    )


# --------------------------------------------------------
# Decrypt User KYC
# --------------------------------------------------------

@router.get(
    "/kyc/{user_wallet}/decrypt",
    auth=bank_auth,
    response=BankDecryptedKYCResponseSchema,
)
def decrypt_kyc(
    request,
    user_wallet: str,
):
    return BankService.get_decrypted_kyc(
        user_wallet=user_wallet,
        bank_wallet=request.auth.wallet_address,
    )