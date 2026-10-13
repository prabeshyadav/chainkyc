import json
from functools import cached_property
from pathlib import Path

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from web3 import Web3

from blockchain.web3 import w3


BASE_DIR = Path(__file__).resolve().parent


with open(BASE_DIR / "abi" / "RoleManager.json", encoding="utf-8") as f:
    role_manager_artifact = json.load(f)

with open(BASE_DIR / "abi" / "KYCRegistry.json", encoding="utf-8") as f:
    kyc_registry_artifact = json.load(f)


class LazyContract:
    """Initialize a blockchain contract only when it is accessed."""

    def __init__(self, address_setting, abi):
        self.address_setting = address_setting
        self.abi = abi

    @cached_property
    def _contract(self):
        address = getattr(settings, self.address_setting, None)

        if not address:
            raise ImproperlyConfigured(
                f"{self.address_setting} must be configured "
                "before using this blockchain contract."
            )

        try:
            checksum_address = Web3.to_checksum_address(address)
        except (TypeError, ValueError) as exc:
            raise ImproperlyConfigured(
                f"{self.address_setting} must contain a valid "
                "Ethereum contract address."
            ) from exc

        return w3.eth.contract(
            address=checksum_address,
            abi=self.abi,
        )

    def __getattr__(self, name):
        return getattr(self._contract, name)


role_manager = LazyContract(
    "ROLE_MANAGER_ADDRESS",
    role_manager_artifact["abi"],
)

kyc_registry = LazyContract(
    "KYC_REGISTRY_ADDRESS",
    kyc_registry_artifact["abi"],
)