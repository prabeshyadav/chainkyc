import json

from cryptography.fernet import Fernet
from django.conf import settings
from django.http import JsonResponse


class KYCEncryption:
    def __init__(self):
        self.cipher = Fernet(settings.KYC_ENCRYPTION_KEY.encode())

    def encrypt(self, data: dict) -> bytes:
        payload = json.dumps(data).encode()

        return self.cipher.encrypt(payload)

    def decrypt(self, encrypted: bytes) -> dict:
        payload = self.cipher.decrypt(encrypted)
        return json.loads(payload.decode())

    def decrypt_to_json_string(self, encrypted: bytes) -> str:
        """Returns pretty-printed JSON string instead of dict."""
        data = self.decrypt(encrypted)
        return json.dumps(data, indent=2)