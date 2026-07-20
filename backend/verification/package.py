import base64


class KYCPackageBuilder:
    """
    Build a complete KYC package that will later be encrypted
    and uploaded to IPFS.
    """

    @staticmethod
    def _encode_file(document):
        """
        Convert a document file to a Base64 string.
        """
        if document is None:
            return None

        with document.file.open("rb") as f:
            return base64.b64encode(
                f.read()
            ).decode("utf-8")

    @staticmethod
    def build(*, submission, verification):
        """
        Build the complete KYC package.
        """

        selfie = submission.selfie
        identity_document = submission.identity_document

        return {
            "submission": {
                "id": str(submission.id),
                "status": submission.status,
                "version": submission.version,
                "created_at": submission.created_at.isoformat(),
                "updated_at": submission.updated_at.isoformat(),
            },

            "user": {
                "wallet_address": submission.user.wallet_address,
                "full_name": submission.full_name,
                "date_of_birth": submission.date_of_birth.isoformat(),
                "country": submission.country,
                "nationality": submission.nationality,
                "phone_number": submission.phone_number,
                "email": submission.email,
                "address": submission.address,
                "document_number": submission.document_number,
            },

            "documents": {
                "document_type": (
                    identity_document.document_type
                    if identity_document
                    else None
                ),

                "identity_document": (
                    KYCPackageBuilder._encode_file(
                        identity_document
                    )
                ),

                "selfie": (
                    KYCPackageBuilder._encode_file(
                        selfie
                    )
                ),
            },

            "verification": {
                "verifier_wallet": verification.verifier.wallet_address,
                "remarks": verification.remarks,
                "verified_at": verification.verified_at.isoformat(),
            },
        }