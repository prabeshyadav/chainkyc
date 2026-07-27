from web3 import Web3

from blockchain.access import has_access
from blockchain.contracts import kyc_registry
from storage.ipfs import IPFSStorage
from verification.encryption import KYCEncryption
from verification.hashing import KYCHasher


class BankService:

    @staticmethod
    def verify_user(user_wallet: str):
        """
        Public verification of a user's KYC.
        No permission required.
        """

        user_wallet = Web3.to_checksum_address(user_wallet)

        if not kyc_registry.functions.hasVerifiedKYC(
            user_wallet
        ).call():
            raise ValueError("User has no verified KYC")

        record = kyc_registry.functions.getPublicKYC(
            user_wallet
        ).call()

        return {
            "verified": True,
            "version": record[0],
            "ipfs_cid": record[1],
            "data_hash": Web3.to_hex(record[2]),
            "verified_at": record[3],
            "verified_by": record[4],
        }

    @staticmethod
    def has_access(
        user_wallet: str,
        bank_wallet: str,
    ):
        """
        Check whether a bank has permission
        to access a user's KYC.
        """

        user_wallet = Web3.to_checksum_address(user_wallet)
        bank_wallet = Web3.to_checksum_address(bank_wallet)

        return {
            "has_access": has_access(
                user_wallet,
                bank_wallet,
            )
        }

    @staticmethod
    def _load_decrypted_kyc(
        user_wallet: str,
        bank_wallet: str,
    ):
        """
        Internal helper.

        Performs:
        - permission check
        - blockchain lookup
        - IPFS download
        - integrity verification
        - decryption
        """

        user_wallet = Web3.to_checksum_address(user_wallet)
        bank_wallet = Web3.to_checksum_address(bank_wallet)

        # Permission check

        if not has_access(
            user_wallet,
            bank_wallet,
        ):
            raise ValueError(
                "Bank does not have access"
            )

        # Check KYC exists

        if not kyc_registry.functions.hasVerifiedKYC(
            user_wallet
        ).call():
            raise ValueError(
                "User has no verified KYC"
            )

        # Read latest KYC from blockchain

        record = (
            kyc_registry.functions
            .getLatestKYC(user_wallet)
            .call(
                {
                    "from": bank_wallet,
                }
            )
        )

        ipfs_cid = record[1]
        data_hash = Web3.to_hex(record[2])
        verified_at = record[3]

        # Download encrypted data

        encrypted_data = (
            IPFSStorage()
            .download(ipfs_cid)
        )

        # Verify integrity

        current_hash = KYCHasher.sha256(
            encrypted_data
        )

        if current_hash != data_hash:
            raise ValueError(
                "KYC data integrity verification failed"
            )

        # Decrypt

        decrypted_data = (
            KYCEncryption()
            .decrypt(encrypted_data)
        )

        return {
            "user_wallet": user_wallet,
            "ipfs_cid": ipfs_cid,
            "data_hash": data_hash,
            "verified_at": verified_at,
            "decrypted_data": decrypted_data,
        }

    @staticmethod
    def _build_clean_response(
        decrypted_data: dict,
    ):
        """
        Structure decrypted KYC into
        a clean JSON response.
        """

        return {
            "submission": decrypted_data["submission"],
            "user": decrypted_data["user"],
            "documents": {
                "document_type": decrypted_data["documents"]["document_type"],
                "identity_document": decrypted_data["documents"]["identity_document"],
                "selfie": decrypted_data["documents"]["selfie"],
            },
            "verification": decrypted_data["verification"],
        }

    @staticmethod
    def _truncate_base64(
        response: dict,
        preview_length: int = 100,
    ):
        """
        Truncate Base64 images for previews.
        """

        result = response.copy()

        docs = result["kyc_data"]["documents"]

        if docs.get("identity_document"):
            docs["identity_document"] = (
                docs["identity_document"][:preview_length]
                + f"... [{len(docs['identity_document'])} chars]"
            )

        if docs.get("selfie"):
            docs["selfie"] = (
                docs["selfie"][:preview_length]
                + f"... [{len(docs['selfie'])} chars]"
            )

        return result

    @staticmethod
    def check_kyc(
        user_wallet: str,
        bank_wallet: str,
    ):
        """
        Return complete decrypted KYC.
        """

        result = BankService._load_decrypted_kyc(
            user_wallet,
            bank_wallet,
        )

        return {
            "user_wallet": result["user_wallet"],
            "ipfs_cid": result["ipfs_cid"],
            "data_hash": result["data_hash"],
            "verified_at": result["verified_at"],
            "kyc_data": BankService._build_clean_response(
                result["decrypted_data"]
            ),
        }

    @staticmethod
    def check_kyc_preview(
        user_wallet: str,
        bank_wallet: str,
    ):
        """
        Return a preview version with
        truncated Base64 image strings.
        """

        full_response = BankService.check_kyc(
            user_wallet,
            bank_wallet,
        )

        return BankService._truncate_base64(
            full_response
        )