from blockchain.contracts import role_manager


def is_admin(wallet_address: str) -> bool:
    return role_manager.functions.isAdmin(
        wallet_address
    ).call()