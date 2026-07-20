import json

from cryptography.fernet import Fernet
from django.conf import settings


class KYCEncryption:
    def __init__(self):
        self.cipher = Fernet(settings.KYC_ENCRYPTION_KEY.encode())

    def encrypt(self, data: dict) -> bytes:
        payload = json.dumps(data).encode()

        return self.cipher.encrypt(payload)

    def decrypt(self, encrypted: bytes) -> dict:
        payload = self.cipher.decrypt(encrypted)

        return json.loads(payload.decode())