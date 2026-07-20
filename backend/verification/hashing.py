import hashlib


class KYCHasher:
    """
    Utility class for generating hashes used in blockchain anchoring.
    """

    @staticmethod
    def sha256(data: bytes) -> str:
        """
        Generate SHA-256 hash of bytes.

        Returns:
            Hex string prefixed with '0x' for blockchain storage.
        """

        digest = hashlib.sha256(data).hexdigest()

        return f"0x{digest}"