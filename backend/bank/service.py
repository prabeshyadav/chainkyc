from blockchain.contracts import kyc_registry
from web3 import Web3


class BankService:

    @staticmethod
    def check_kyc(user_wallet):

        wallet = Web3.to_checksum_address(
            user_wallet
        )

        has_kyc = kyc_registry.functions.hasVerifiedKYC(
            wallet
        ).call()

        if not has_kyc:
            raise ValueError(
                "User has no verified KYC"
            )

        record = kyc_registry.functions.getLatestKYC(
            wallet
        ).call()

        return {
            "user_wallet": user_wallet,
            "ipfs_cid": record[1],
            "data_hash": Web3.to_hex(record[2]),
            "timestamp": record[3],
        }