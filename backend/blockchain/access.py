from blockchain.accounts import account, send_transaction
from blockchain.contracts import kyc_registry
from blockchain.web3 import w3


def execute(function):
    gas = function.estimate_gas(
        {
            "from": account.address,
        }
    )

    tx = function.build_transaction(
        {
            "from": account.address,
            "nonce": w3.eth.get_transaction_count(account.address),
            "gas": gas,
            "gasPrice": w3.eth.gas_price,
        }
    )

    tx_hash = send_transaction(tx)

    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    return {
        "transaction_hash": tx_hash.hex(),
        "status": receipt.status,
    }


def grant_access(bank_wallet):
    return execute(
        kyc_registry.functions.grantAccess(
            bank_wallet
        )
    )


def revoke_access(bank_wallet):
    return execute(
        kyc_registry.functions.revokeAccess(
            bank_wallet
        )
    )


def has_access(user_wallet, bank_wallet):
    return kyc_registry.functions.hasAccess(
        user_wallet,
        bank_wallet,
    ).call()