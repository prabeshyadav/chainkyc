from blockchain.contracts import role_manager
from blockchain.web3 import w3
from blockchain.accounts import account, send_transaction


def execute_role_transaction(function):
    gas = function.estimate_gas(
        {
            "from": account.address
        }
    )

    tx = function.build_transaction(
        {
            "from": account.address,
            "nonce": w3.eth.get_transaction_count(
                account.address
            ),
            "gas": gas,
            "gasPrice": w3.eth.gas_price,
        }
    )

    tx_hash = send_transaction(tx)

    receipt = w3.eth.wait_for_transaction_receipt(
        tx_hash
    )

    return {
        "tx_hash": tx_hash.hex(),
        "status": receipt.status,
    }


# --------------------------------------------------
# Verifiers
# --------------------------------------------------

def add_verifier(wallet_address):
    return execute_role_transaction(
        role_manager.functions.setVerifier(
            wallet_address,
            True,
        )
    )


def remove_verifier(wallet_address):
    return execute_role_transaction(
        role_manager.functions.setVerifier(
            wallet_address,
            False,
        )
    )


def list_verifiers():
    return role_manager.functions.getAllVerifiers().call()


def verifier_count():
    return role_manager.functions.getVerifierCount().call()


def verifier_at(index):
    return role_manager.functions.getVerifierAt(index).call()


# --------------------------------------------------
# Banks
# --------------------------------------------------

def add_bank(wallet_address):
    return execute_role_transaction(
        role_manager.functions.setBank(
            wallet_address,
            True,
        )
    )


def remove_bank(wallet_address):
    return execute_role_transaction(
        role_manager.functions.setBank(
            wallet_address,
            False,
        )
    )


def list_banks():
    return role_manager.functions.getAllBanks().call()


def bank_count():
    return role_manager.functions.getBankCount().call()


def bank_at(index):
    return role_manager.functions.getBankAt(index).call()