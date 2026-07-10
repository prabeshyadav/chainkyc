from .models import WalletNonce

from django.utils import timezone

from .models import User, WalletNonce
from .wallet import recover_wallet
from .auth import (
    create_access_token,
    create_refresh_token,
)

def create_nonce(wallet_address: str) -> WalletNonce:
    WalletNonce.objects.filter(
        wallet_address=wallet_address.lower()
    ).delete()

    return WalletNonce.objects.create(
        wallet_address=wallet_address.lower(),
        nonce=WalletNonce.generate_nonce(),
        expires_at=WalletNonce.expiry_time(),
    )
    
    
    
    


def verify_wallet(wallet_address: str, signature: str):

    nonce = WalletNonce.objects.filter(
        wallet_address=wallet_address.lower(),
        used=False,
    ).first()

    if nonce is None:
        raise Exception("Nonce not found")

    if nonce.expires_at < timezone.now():
        raise Exception("Nonce expired")

    recovered = recover_wallet(
        signature=signature,
        nonce=nonce.nonce,
    )

    if recovered != wallet_address.lower():
        raise Exception("Invalid signature")

    nonce.used = True
    nonce.save()

    user, _ = User.objects.get_or_create(
        wallet_address=wallet_address.lower()
    )

    from blockchain.services import sync_user_role
    sync_user_role(user)

    return {
        "access_token": create_access_token(user),
        "refresh_token": create_refresh_token(user),
    }