import os
from datetime import date
from unittest.mock import patch

from django.test import TestCase

from blockchain.models import BlockchainAnchor
from blockchain.services import anchor_kyc_submission
from kyc.models import DocumentType, KYCSubmission
from management.models import User


class BlockchainServiceTests(TestCase):
    def test_anchor_submission_uses_onchain_service_when_configured(self):
        user = User.objects.create_user(wallet_address="0x1234567890abcdef1234567890abcdef12345678")
        submission = KYCSubmission.objects.create(
            user=user,
            full_name="Jane Doe",
            date_of_birth=date(1990, 1, 1),
            gender="F",
            nationality="US",
            phone="1234567890",
            email="jane@example.com",
            country="US",
            province="CA",
            district="SF",
            street="1 Main St",
            postal_code="94105",
            document_type=DocumentType.NATIONAL_ID,
            document_number="ABC123",
            document_front_encrypted=b"front",
            document_back_encrypted=b"back",
            selfie_encrypted=b"selfie",
            encrypted_dek="dek",
            status="PENDING",
        )

        with patch.dict(
            os.environ,
            {
                "BLOCKCHAIN_RPC_URL": "http://localhost:8545",
                "KYC_CONTRACT_ADDRESS": "0x1111111111111111111111111111111111111111",
                "VERIFIER_PRIVATE_KEY": "0x" + "1" * 64,
            },
            clear=False,
        ), patch("blockchain.services._submit_onchain_anchor") as mock_submit:
            mock_submit.return_value = {
                "tx_hash": "0xabc",
                "contract_address": "0x1111111111111111111111111111111111111111",
                "block_number": 42,
                "network": "ETHEREUM",
            }

            anchor = anchor_kyc_submission(submission, salt="salt123")

        mock_submit.assert_called_once()
        self.assertEqual(anchor.tx_hash, "0xabc")
        self.assertEqual(anchor.contract_address, "0x1111111111111111111111111111111111111111")
        self.assertEqual(anchor.block_number, 42)
        self.assertTrue(BlockchainAnchor.objects.filter(kyc_submission=submission).exists())


    @patch("blockchain.services.Web3")
    def test_sync_user_role_admin(self, mock_web3):
        mock_web3.to_checksum_address.side_effect = lambda x: x
        mock_w3 = mock_web3.return_value
        mock_w3.is_connected.return_value = True
        mock_contract = mock_w3.eth.contract.return_value
        mock_contract.functions.admin.return_value.call.return_value = "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1"
        mock_contract.functions.verifiers.return_value.call.return_value = False
        mock_contract.functions.banks.return_value.call.return_value = False

        from management.models import User, UserRole
        from blockchain.services import sync_user_role

        user = User.objects.create_user(wallet_address="0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1")

        with patch.dict(
            os.environ,
            {
                "BLOCKCHAIN_RPC_URL": "http://localhost:8545",
                "KYC_CONTRACT_ADDRESS": "0x1111111111111111111111111111111111111111",
            },
            clear=False,
        ):
            role = sync_user_role(user)

        self.assertEqual(role, UserRole.ADMIN)
        user.refresh_from_db()
        self.assertEqual(user.role, UserRole.ADMIN)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)



