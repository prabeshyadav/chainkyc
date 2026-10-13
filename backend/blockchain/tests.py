import os
import tempfile
from datetime import date
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings

from blockchain.models import BlockchainAnchor
from blockchain.services import _build_proof_payload, anchor_kyc_submission
from kyc.models import DocumentType, KYCDocument, KYCSubmission
from management.models import User


@override_settings(MEDIA_ROOT=tempfile.mkdtemp(prefix="chainkyc-test-media-"))
class BlockchainServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            wallet_address="0x1234567890abcdef1234567890abcdef12345678"
        )
        self.submission = KYCSubmission.objects.create(
            user=self.user,
            full_name="Jane Doe",
            date_of_birth=date(1990, 1, 1),
            nationality="US",
            email="jane@example.com",
            country="US",
            phone_number="1234567890",
            address="1 Main St, San Francisco, CA 94105",
            document_number="ABC123",
            status="PENDING",
        )

    def add_identity_document(self) -> KYCDocument:
        return KYCDocument.objects.create(
            submission=self.submission,
            document_type=DocumentType.NATIONAL_ID,
            file=SimpleUploadedFile("national-id.png", b"front"),
        )

    def test_build_proof_payload_reads_document_type_from_identity_document(self):
        """Regression: ``KYCSubmission`` has no ``document_type`` attribute --
        it lives on the related :class:`KYCDocument`."""
        self.add_identity_document()

        payload = _build_proof_payload(self.submission, salt="salt123")

        self.assertEqual(payload["document_type"], DocumentType.NATIONAL_ID)
        self.assertEqual(payload["document_number"], "ABC123")
        self.assertEqual(payload["salt"], "salt123")
        self.assertEqual(payload["submission_id"], str(self.submission.id))

    def test_build_proof_payload_without_documents(self):
        payload = _build_proof_payload(self.submission, salt="salt123")

        self.assertIsNone(payload["document_type"])

    def test_anchor_submission_uses_onchain_service_when_configured(self):
        self.add_identity_document()

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

            anchor = anchor_kyc_submission(self.submission, salt="salt123")

        mock_submit.assert_called_once()
        submitted_hash = mock_submit.call_args[0][1]
        self.assertRegex(submitted_hash, r"^[0-9a-f]{64}$")

        self.assertEqual(anchor.tx_hash, "0xabc")
        self.assertEqual(anchor.contract_address, "0x1111111111111111111111111111111111111111")
        self.assertEqual(anchor.block_number, 42)
        self.assertEqual(anchor.data_hash, submitted_hash)
        self.assertTrue(
            BlockchainAnchor.objects.filter(kyc_submission=self.submission).exists()
        )

    @patch("blockchain.services.Web3")
    def test_sync_user_role_admin(self, mock_web3):
        mock_web3.to_checksum_address.side_effect = lambda x: x
        mock_w3 = mock_web3.return_value
        mock_w3.is_connected.return_value = True
        mock_contract = mock_w3.eth.contract.return_value
        mock_contract.functions.admin.return_value.call.return_value = (
            "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1"
        )
        mock_contract.functions.verifiers.return_value.call.return_value = False
        mock_contract.functions.banks.return_value.call.return_value = False

        from blockchain.services import sync_user_role
        from management.models import UserRole

        admin_user = User.objects.create_user(
            wallet_address="0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1"
        )

        with patch.dict(
            os.environ,
            {
                "BLOCKCHAIN_RPC_URL": "http://localhost:8545",
                "KYC_CONTRACT_ADDRESS": "0x1111111111111111111111111111111111111111",
            },
            clear=False,
        ):
            role = sync_user_role(admin_user)

        self.assertEqual(role, UserRole.ADMIN)
        admin_user.refresh_from_db()
        self.assertEqual(admin_user.role, UserRole.ADMIN)
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)
