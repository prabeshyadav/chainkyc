from eth_account import Account
from eth_account.messages import encode_defunct


def recover_wallet(signature: str, nonce: str) -> str:
    """
    Recover the Ethereum wallet address from a signed nonce.
    """

    message = encode_defunct(text=nonce)

    address = Account.recover_message(
        message,
        signature=signature,
    )

    return address.lower()