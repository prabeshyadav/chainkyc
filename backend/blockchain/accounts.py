from functools import cached_property

from django.conf import settings
from web3 import Account


class LazyAccount:
    """Load the blockchain account only when it is needed."""

    @cached_property
    def _account(self):
        private_key = settings.ADMIN_PRIVATE_KEY

        if not private_key:
            raise RuntimeError(
                "ADMIN_PRIVATE_KEY must be configured "
                "to sign blockchain transactions."
            )

        return Account.from_key(private_key)

    @property
    def address(self):
        return self._account.address

    def sign_transaction(self, tx):
        return self._account.sign_transaction(tx)


# Creating this proxy does not require a private key.
# The real account is loaded only when address or signing is accessed.
account = LazyAccount()


def send_transaction(tx):
    """Sign and send a transaction using the configured admin account."""
    signed_tx = account.sign_transaction(tx)

    from .web3 import w3

    tx_hash = w3.eth.send_raw_transaction(
        signed_tx.raw_transaction
    )

    return tx_hash