from web3 import Account
from django.conf import settings

from .web3 import w3


account = Account.from_key(
    settings.ADMIN_PRIVATE_KEY
)


def send_transaction(tx):

    signed_tx = account.sign_transaction(tx)

    tx_hash = w3.eth.send_raw_transaction(
        signed_tx.raw_transaction
    )

    return tx_hash