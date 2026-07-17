from web3 import Web3

from blockchain.contracts import role_manager


ROLE_MAP = {
    0: "USER",
    1: "ADMIN",
    2: "VERIFIER",
    3: "BANK",
}


def get_wallet_role(wallet_address: str) -> str:

    wallet = Web3.to_checksum_address(wallet_address)

    role = role_manager.functions.getRole(
        wallet
    ).call()

    return ROLE_MAP[role]


def is_admin(wallet_address: str) -> bool:

    wallet = Web3.to_checksum_address(wallet_address)

    return role_manager.functions.isAdmin(
        wallet
    ).call()


def is_verifier(wallet_address: str) -> bool:

    wallet = Web3.to_checksum_address(wallet_address)

    return role_manager.functions.isVerifier(
        wallet
    ).call()


def is_bank(wallet_address: str) -> bool:

    wallet = Web3.to_checksum_address(wallet_address)

    return role_manager.functions.isBank(
        wallet
    ).call()