from ninja import Router

from management.jwt_auth import admin_auth
from management.schemas import WalletSchema
from management.jwt_auth import JWTAuth

from .services import (
    add_verifier,
    remove_verifier,
    add_bank,
    remove_bank,
)

router = Router(tags=["Admin"])

router = Router(
    tags=["Admin"],
    auth=JWTAuth(),
)


@router.get(
    "/me",
    auth=admin_auth,
)
def me(request):
    return {
        "wallet_address": request.auth.wallet_address,
        "role": request.auth.role,
    }


@router.post(
    "/verifier/add",
    auth=admin_auth,
)
def create_verifier(
    request,
    payload: WalletSchema,
):
    tx = add_verifier(
        payload.wallet_address
    )

    return {
        "message": "Verifier added successfully.",
        "transaction": tx,
    }


@router.post(
    "/verifier/remove",
    auth=admin_auth,
)
def delete_verifier(
    request,
    payload: WalletSchema,
):
    tx = remove_verifier(
        payload.wallet_address
    )

    return {
        "message": "Verifier removed successfully.",
        "transaction": tx,
    }


@router.post(
    "/bank/add",
    auth=admin_auth,
)
def create_bank(
    request,
    payload: WalletSchema,
):
    tx = add_bank(
        payload.wallet_address
    )

    return {
        "message": "Bank added successfully.",
        "transaction": tx,
    }


@router.post(
    "/bank/remove",
    auth=admin_auth,
)
def delete_bank(
    request,
    payload: WalletSchema,
):
    tx = remove_bank(
        payload.wallet_address
    )

    return {
        "message": "Bank removed successfully.",
        "transaction": tx,
    }


@router.get(
    "/dashboard",
    auth=admin_auth,
)
def dashboard(request):
    from django.contrib.auth import get_user_model

    from kyc.models import (
        KYCSubmission,
        KYCStatus,
    )

    User = get_user_model()

    return {
        "users": User.objects.count(),
        "pending_kyc": KYCSubmission.objects.filter(
            status=KYCStatus.PENDING
        ).count(),
        "approved_kyc": KYCSubmission.objects.filter(
            status=KYCStatus.APPROVED
        ).count(),
        "rejected_kyc": KYCSubmission.objects.filter(
            status=KYCStatus.REJECTED
        ).count(),
    }