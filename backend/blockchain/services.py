import hashlib
import json
import os
import secrets
from pathlib import Path

from django.conf import settings
from django.db import transaction
from dotenv import dotenv_values
from eth_account import Account
from web3 import Web3

from blockchain.models import AnchorStatus, BlockchainAnchor, BlockchainNetwork
from kyc.models import KYCSubmission

CONTRACT_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "_user", "type": "address"},
            {"internalType": "string", "name": "_ipfsCid", "type": "string"},
            {"internalType": "bytes32", "name": "_dataHash", "type": "bytes32"},
        ],
        "name": "anchorKYC",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    }
]

DEFAULT_CONTRACT_ADDRESS = "0xd0d054fc320aa3ab92ce1a0e99cdf0afdbb36d8b"
DEFAULT_RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com"


def _build_proof_payload(submission: KYCSubmission, salt: str) -> dict:
    return {
        "submission_id": str(submission.id),
        "wallet_address": submission.user.wallet_address,
        "full_name": submission.full_name,
        "document_type": submission.document_type,
        "document_number": submission.document_number,
        "nationality": submission.nationality,
        "salt": salt,
    }


def _compute_data_hash(payload: dict) -> str:
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode()).hexdigest()


def _mock_ipfs_upload(payload: dict) -> str:
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
    return f"Qm{digest[:44]}"


def _mock_tx_hash(data_hash: str) -> str:
    return f"0x{hashlib.sha256(data_hash.encode()).hexdigest()}"


def _load_private_key() -> str | None:
    configured_key = os.environ.get("VERIFIER_PRIVATE_KEY") or getattr(
        settings,
        "VERIFIER_PRIVATE_KEY",
        None,
    )
    if configured_key:
        return configured_key

    project_root = Path(__file__).resolve().parents[2]
    for env_path in [project_root / ".env", project_root / "contracts" / ".env"]:
        if env_path.exists():
            values = dotenv_values(env_path)
            for key_name in ("VERIFIER_PRIVATE_KEY", "PRIVATE_KEY"):
                value = values.get(key_name)
                if value:
                    return value
    return None


def _get_onchain_config() -> dict:
    rpc_url = os.environ.get("BLOCKCHAIN_RPC_URL") or getattr(
        settings,
        "BLOCKCHAIN_RPC_URL",
        DEFAULT_RPC_URL,
    )
    contract_address = os.environ.get("KYC_CONTRACT_ADDRESS") or getattr(
        settings,
        "KYC_CONTRACT_ADDRESS",
        DEFAULT_CONTRACT_ADDRESS,
    )
    private_key = _load_private_key()
    return {
        "rpc_url": rpc_url,
        "contract_address": contract_address,
        "private_key": private_key,
    }


def _submit_onchain_anchor(submission: KYCSubmission, data_hash: str, ipfs_cid: str) -> dict:
    config = _get_onchain_config()
    if not config["rpc_url"] or not config["contract_address"] or not config["private_key"]:
        raise RuntimeError("Blockchain integration is not configured")

    web3 = Web3(Web3.HTTPProvider(config["rpc_url"]))
    if not web3.is_connected():
        raise RuntimeError("Unable to connect to the configured blockchain RPC")

    account = Account.from_key(config["private_key"])
    contract = web3.eth.contract(
        address=Web3.to_checksum_address(config["contract_address"]),
        abi=CONTRACT_ABI,
    )
    user_address = Web3.to_checksum_address(submission.user.wallet_address)
    data_hash_bytes = bytes.fromhex(data_hash)

    tx = contract.functions.anchorKYC(user_address, ipfs_cid, data_hash_bytes).build_transaction(
        {
            "from": account.address,
            "nonce": web3.eth.get_transaction_count(account.address),
            "gas": 300_000,
            "gasPrice": web3.eth.gas_price,
        }
    )
    signed_tx = web3.eth.account.sign_transaction(tx, private_key=config["private_key"])
    tx_hash = web3.eth.send_raw_transaction(signed_tx.raw_transaction)
    receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=300)

    return {
        "tx_hash": tx_hash.hex(),
        "contract_address": config["contract_address"],
        "block_number": receipt.blockNumber,
        "network": BlockchainNetwork.ETHEREUM,
    }


@transaction.atomic
def anchor_kyc_submission(submission: KYCSubmission, salt: str | None = None) -> BlockchainAnchor:
    if hasattr(submission, "blockchain_anchor"):
        return submission.blockchain_anchor

    salt = salt or secrets.token_hex(16)
    payload = _build_proof_payload(submission, salt)
    data_hash = _compute_data_hash(payload)
    ipfs_cid = _mock_ipfs_upload(payload)

    config = _get_onchain_config()
    try:
        onchain_result = _submit_onchain_anchor(submission, data_hash, ipfs_cid)
        tx_hash = onchain_result["tx_hash"]
        contract_address = onchain_result["contract_address"]
        block_number = onchain_result["block_number"]
        network = onchain_result["network"]
    except Exception:
        if config["rpc_url"] and config["contract_address"] and config["private_key"]:
            raise
        tx_hash = _mock_tx_hash(data_hash)
        contract_address = config["contract_address"] or ""
        block_number = None
        network = BlockchainNetwork.LOCAL

    anchor = BlockchainAnchor.objects.create(
        kyc_submission=submission,
        network=network,
        contract_address=contract_address,
        ipfs_cid=ipfs_cid,
        data_hash=data_hash,
        salt=salt,
        tx_hash=tx_hash,
        block_number=block_number,
        status=AnchorStatus.CONFIRMED,
    )
    return anchor


def get_anchor_for_submission(submission_id):
    return BlockchainAnchor.objects.select_related(
        "kyc_submission",
        "kyc_submission__user",
    ).get(kyc_submission_id=submission_id)


def get_public_verification(wallet_address: str):
    submission = (
        KYCSubmission.objects.select_related("user", "blockchain_anchor")
        .filter(
            user__wallet_address=wallet_address.lower(),
            is_current=True,
            status="VERIFIED",
        )
        .first()
    )
    return submission


def sync_user_role(user) -> str:
    from management.models import UserRole

    config = _get_onchain_config()
    if not config["rpc_url"] or not config["contract_address"]:
        return user.role

    try:
        web3 = Web3(Web3.HTTPProvider(config["rpc_url"]))
        if not web3.is_connected():
            return user.role

        role_abi = [
            {
                "inputs": [],
                "name": "admin",
                "outputs": [{"internalType": "address", "name": "", "type": "address"}],
                "stateMutability": "view",
                "type": "function",
            },
            {
                "inputs": [{"internalType": "address", "name": "", "type": "address"}],
                "name": "verifiers",
                "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                "stateMutability": "view",
                "type": "function",
            },
            {
                "inputs": [{"internalType": "address", "name": "", "type": "address"}],
                "name": "banks",
                "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                "stateMutability": "view",
                "type": "function",
            },
        ]
        contract = web3.eth.contract(
            address=Web3.to_checksum_address(config["contract_address"]),
            abi=role_abi,
        )
        user_address = Web3.to_checksum_address(user.wallet_address)

        # Check if Admin
        admin_address = contract.functions.admin().call()
        if admin_address.lower() == user_address.lower():
            user.role = UserRole.ADMIN
            user.is_staff = True
            user.is_superuser = True
        # Check if Verifier
        elif contract.functions.verifiers(user_address).call():
            user.role = UserRole.VERIFIER
            user.is_staff = True
            user.is_superuser = False
        # Check if Bank
        elif contract.functions.banks(user_address).call():
            user.role = UserRole.BANK
            user.is_staff = False
            user.is_superuser = False
        else:
            user.role = UserRole.USER
            user.is_staff = False
            user.is_superuser = False

        user.save(update_fields=["role", "is_staff", "is_superuser"])
    except Exception as e:
        # Fallback to local DB role on error
        pass

    return user.role

