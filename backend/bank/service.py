from web3 import Web3

from blockchain.contracts import kyc_registry
from blockchain.access import has_access
from storage.ipfs import IPFSStorage

from verification.encryption import KYCEncryption
from verification.hashing import KYCHasher


class BankService:

    @staticmethod
    def verify_user(user_wallet):
        """
        Public verification of user's KYC status.

        No permission required.
        Returns blockchain KYC metadata.
        """

        user_wallet = Web3.to_checksum_address(
            user_wallet
        )

        if not kyc_registry.functions.hasVerifiedKYC(
            user_wallet
        ).call():
            raise ValueError(
                "User has no verified KYC"
            )

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
        Check whether bank has permission
        to access user's KYC.
        """

        user_wallet = Web3.to_checksum_address(
            user_wallet
        )

        bank_wallet = Web3.to_checksum_address(
            bank_wallet
        )

        return {
            "has_access": has_access(
                user_wallet,
                bank_wallet,
            )
        }


    @staticmethod
    def check_kyc(
        user_wallet: str,
        bank_wallet: str,
    ):
        """
        Return KYC metadata and decrypted data
        after permission verification.
        """

        user_wallet = Web3.to_checksum_address(
            user_wallet
        )

        bank_wallet = Web3.to_checksum_address(
            bank_wallet
        )


        # 1. Check bank permission

        if not has_access(
            user_wallet,
            bank_wallet,
        ):
            raise ValueError(
                "Bank does not have access"
            )


        # 2. Check verified KYC exists

        if not kyc_registry.functions.hasVerifiedKYC(
            user_wallet
        ).call():
            raise ValueError(
                "User has no verified KYC"
            )


        # 3. Get blockchain record
        # Call from bank wallet because Solidity
        # checks msg.sender permission

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

        data_hash = Web3.to_hex(
            record[2]
        )

        verified_at = record[3]



        # 4. Download encrypted KYC from IPFS

        encrypted_data = IPFSStorage().download(
            ipfs_cid
        )


        # 5. Verify data integrity

        current_hash = KYCHasher.sha256(
            encrypted_data
        )


        if current_hash != data_hash:
            raise ValueError(
                "KYC data integrity verification failed"
            )


        # 6. Decrypt KYC

        decrypted_data = (
            KYCEncryption()
            .decrypt(
                encrypted_data
            )
        )


        return {
            "user_wallet": user_wallet,
            "ipfs_cid": ipfs_cid,
            "data_hash": data_hash,
            "verified_at": verified_at,
            "kyc_data": decrypted_data,
        }



    @staticmethod
    def get_decrypted_kyc(
        user_wallet: str,
        bank_wallet: str,
    ):
        """
        Return only decrypted KYC data
        after permission verification.
        """

        user_wallet = Web3.to_checksum_address(
            user_wallet
        )

        bank_wallet = Web3.to_checksum_address(
            bank_wallet
        )


        # 1. Check permission

        if not has_access(
            user_wallet,
            bank_wallet,
        ):
            raise ValueError(
                "Bank does not have permission"
            )


        # 2. Check verified KYC exists

        if not kyc_registry.functions.hasVerifiedKYC(
            user_wallet
        ).call():
            raise ValueError(
                "User has no verified KYC"
            )


        # 3. Get latest KYC from blockchain

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

        blockchain_hash = Web3.to_hex(
            record[2]
        )


        # 4. Download encrypted data

        encrypted_data = IPFSStorage().download(
            ipfs_cid
        )


        # 5. Verify hash

        current_hash = KYCHasher.sha256(
            encrypted_data
        )


        if current_hash != blockchain_hash:
            raise ValueError(
                "KYC data integrity verification failed"
            )


        # 6. Decrypt

        decrypted_data = (
            KYCEncryption()
            .decrypt(
                encrypted_data
            )
        )


        return {
            "user_wallet": user_wallet,
            "kyc": decrypted_data,
        }