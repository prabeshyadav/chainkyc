from blockchain.contracts import kyc_registry
from web3 import Web3
from storage.ipfs import IPFSStorage
from verification.encryption import KYCEncryption

from blockchain.access import (
    grant_access,
    revoke_access,
    has_access,
)



class BankService:

    @staticmethod
    def check_kyc(user_wallet, bank_wallet):
        """
        Return the complete verified KYC for a user
        only if the bank has been granted access.
        """

        user_wallet = Web3.to_checksum_address(user_wallet)
        bank_wallet = Web3.to_checksum_address(bank_wallet)

        # 1. Check access permission
        allowed = has_access(user_wallet, bank_wallet)

        if not allowed:
            raise ValueError("Bank does not have access")

        # 2. Check verified KYC exists
        has_kyc = kyc_registry.functions.hasVerifiedKYC(
            user_wallet
        ).call()

        if not has_kyc:
            raise ValueError("User has no verified KYC")

        # 3. Get latest KYC metadata from blockchain
        record = kyc_registry.functions.getLatestKYC(
            user_wallet
        ).call()

        ipfs_cid = record[1]
        data_hash = Web3.to_hex(record[2])
        verified_at = record[3]

        # 4. Download encrypted package from IPFS
        storage = IPFSStorage()
        encrypted_bytes = storage.download(ipfs_cid)

        # 5. Decrypt package
        crypto = KYCEncryption()
        decrypted_data = crypto.decrypt(encrypted_bytes)

        # 6. Return full KYC data
        return {
            "user_wallet": user_wallet,
            "ipfs_cid": ipfs_cid,
            "data_hash": data_hash,
            "verified_at": verified_at,
            "kyc_data": decrypted_data,
        }

    @staticmethod
    def grant_access(bank_wallet):
        return grant_access(bank_wallet)

    @staticmethod
    def revoke_access(bank_wallet):
        return revoke_access(bank_wallet)

    @staticmethod
    def has_access(user_wallet, bank_wallet):
        return {
            "has_access": has_access(
                user_wallet,
                bank_wallet,
            )
        }
        
        
        
        
    @staticmethod
    def get_decrypted_kyc(
        user_wallet,
        bank_wallet,
    ):

        user_wallet = Web3.to_checksum_address(
            user_wallet
        )

        bank_wallet = Web3.to_checksum_address(
            bank_wallet
        )


        # 1. Check blockchain permission

        allowed = kyc_registry.functions.hasAccess(
            user_wallet,
            bank_wallet,
        ).call()


        if not allowed:
            raise ValueError(
                "Bank does not have permission"
            )


        # 2. Get latest KYC record

        record = kyc_registry.functions.getLatestKYC(
            user_wallet
        ).call()


        ipfs_cid = record[1]


        # 3. Download encrypted data

        encrypted_data = IPFSStorage().download(
            ipfs_cid
        )


        # 4. Decrypt

        data = KYCEncryption().decrypt(
            encrypted_data
        )


        return {
            "user_wallet": user_wallet,
            "kyc": data,
        }
