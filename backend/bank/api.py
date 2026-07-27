from ninja import Router

from management.jwt_auth import bank_auth, user_auth

from .schemas import (
    AccessResponseSchema,
    AccessStatusSchema,
    BankAccessSchema,
    CheckKYCResponseSchema,
    MessageSchema,
    PublicKYCResponseSchema,
)
from .service import BankService

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
# Public Verification
# --------------------------------------------------------

@router.get(
    "/verify/{user_wallet}",
    auth=bank_auth,
    response=PublicKYCResponseSchema,
)
def verify_user(request, user_wallet: str):
    """
    Public blockchain verification.
    No KYC data is returned.
    """
    return BankService.verify_user(user_wallet)


# --------------------------------------------------------
# Full KYC
# --------------------------------------------------------

@router.get(
    "/kyc/{user_wallet}",
    auth=bank_auth,
    response={
        200: CheckKYCResponseSchema,
        403: MessageSchema,
    },
)
def get_user_kyc(request, user_wallet: str):
    """
    Return the user's decrypted KYC.
    Bank wallet always comes from JWT.
    """
    try:
        result = BankService.check_kyc(
            user_wallet=user_wallet,
            bank_wallet=request.auth.wallet_address,
        )
        return 200, result

    except ValueError as exc:
        return 403, {
            "message": str(exc),
        }


# --------------------------------------------------------
# Preview
# --------------------------------------------------------

@router.get(
    "/kyc/{user_wallet}/preview",
    auth=bank_auth,
    response={
        200: dict,
        403: MessageSchema,
    },
)
def get_kyc_preview(request, user_wallet: str):
    """
    Same as /kyc/{user_wallet}
    but Base64 images are truncated.
    """
    try:
        result = BankService.check_kyc_preview(
            user_wallet=user_wallet,
            bank_wallet=request.auth.wallet_address,
        )
        return 200, result

    except ValueError as exc:
        return 403, {
            "message": str(exc),
        }


# --------------------------------------------------------
# Access Management
# --------------------------------------------------------

@router.post(
    "/grant-access",
    auth=user_auth,
    response={
        200: AccessResponseSchema,
        400: MessageSchema,
    },
)
def grant_access(request, payload: BankAccessSchema):
    """
    User grants a bank permission
    to read their KYC.
    """
    try:
        result = BankService.grant_access(
            user_wallet=request.auth.wallet_address,
            bank_wallet=payload.bank_wallet,
        )
        return 200, result

    except ValueError as exc:
        return 400, {
            "message": str(exc),
        }


@router.post(
    "/revoke-access",
    auth=user_auth,
    response={
        200: AccessResponseSchema,
        400: MessageSchema,
    },
)
def revoke_access(request, payload: BankAccessSchema):
    """
    User revokes a bank's permission.
    """
    try:
        result = BankService.revoke_access(
            user_wallet=request.auth.wallet_address,
            bank_wallet=payload.bank_wallet,
        )
        return 200, result

    except ValueError as exc:
        return 400, {
            "message": str(exc),
        }


@router.get(
    "/access/{bank_wallet}",
    auth=user_auth,
    response=AccessStatusSchema,
)
def access_status(request, bank_wallet: str):
    """
    Check whether the bank currently
    has access to the user's KYC.
    """
    return BankService.has_access(
        request.auth.wallet_address,
        bank_wallet,
    )