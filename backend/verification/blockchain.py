from web3 import Web3

from django.conf import settings


class BlockchainService:

    def __init__(self):
        self.w3 = Web3(
            Web3.HTTPProvider(settings.WEB3_RPC_URL)
        )

        if not self.w3.is_connected():
            raise RuntimeError(
                "Unable to connect to blockchain."
            )

        self.contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(
                settings.KYC_CONTRACT_ADDRESS
            ),
            abi=settings.KYC_CONTRACT_ABI,
        )

        self.account = self.w3.eth.account.from_key(
            settings.VERIFIER_PRIVATE_KEY
        )

    def anchor(
        self,
        *,
        wallet_address,
        ipfs_cid,
        data_hash,
    ):
        """
        Anchor a verified KYC record on blockchain.
        """

        nonce = self.w3.eth.get_transaction_count(
            self.account.address
        )

        transaction = (
            self.contract.functions.anchorKYC(
                Web3.to_checksum_address(wallet_address),
                ipfs_cid,
                data_hash,
            ).build_transaction(
                {
                    "from": self.account.address,
                    "nonce": nonce,
                    "gas": 500000,
                    "gasPrice": self.w3.eth.gas_price,
                }
            )
        )

        signed = self.account.sign_transaction(
            transaction
        )

        tx_hash = self.w3.eth.send_raw_transaction(
            signed.raw_transaction
        )

        receipt = self.w3.eth.wait_for_transaction_receipt(
            tx_hash
        )

        return {
            "transaction_hash": tx_hash.hex(),
            "block_number": receipt.blockNumber,
            "status": receipt.status,
        }