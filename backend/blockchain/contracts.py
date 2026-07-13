from web3 import Web3
from django.conf import settings
import json
from pathlib import Path

w3 = Web3(Web3.HTTPProvider(settings.BLOCKCHAIN_RPC_URL))

BASE_DIR = Path(__file__).resolve().parent

with open(BASE_DIR / "abi" / "RoleManager.json") as f:
    role_manager_abi = json.load(f)

with open(BASE_DIR / "abi" / "KYCRegistry.json") as f:
    kyc_registry_abi = json.load(f)

role_manager = w3.eth.contract(
    address=Web3.to_checksum_address(settings.ROLE_MANAGER_ADDRESS),
    abi=role_manager_abi,
)

kyc_registry = w3.eth.contract(
    address=Web3.to_checksum_address(settings.KYC_REGISTRY_ADDRESS),
    abi=kyc_registry_abi,
)