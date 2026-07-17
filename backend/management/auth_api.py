from web3 import Web3
from ninja import Router

from django.contrib.auth import get_user_model

from management.schemas import WalletLoginSchema
from management.auth import create_access_token
from management.role import get_wallet_role


router = Router(tags=["Authentication"])

User = get_user_model()


@router.post("/login")
def wallet_login(request, payload: WalletLoginSchema):

    try:
        wallet = Web3.to_checksum_address(
            payload.wallet_address
        )
    except ValueError:
        return 400, {
            "message": "Invalid wallet address"
        }

    role = get_wallet_role(wallet)

    user, created = User.objects.get_or_create(
        wallet_address=wallet.lower(),   # or wallet if you decide to store checksum
        defaults={
            "role": role
        }
    )

    if not created:
        user.role = role
        user.save(update_fields=["role"])

    token = create_access_token(user)

    return {
        "access_token": token,
        "role": role,
        "wallet_address": wallet,
    }