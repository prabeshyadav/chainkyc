import base64
import hashlib
import os

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from django.conf import settings


def _get_fernet() -> Fernet:
    digest = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    key = base64.urlsafe_b64encode(digest)
    return Fernet(key)


def generate_dek() -> bytes:
    return os.urandom(32)


def encrypt_file(data: bytes, dek: bytes) -> bytes:
    nonce = os.urandom(12)
    ciphertext = AESGCM(dek).encrypt(nonce, data, None)
    return nonce + ciphertext


def decrypt_file(encrypted: bytes, dek: bytes) -> bytes:
    nonce = encrypted[:12]
    ciphertext = encrypted[12:]
    return AESGCM(dek).decrypt(nonce, ciphertext, None)


def wrap_key(dek: bytes) -> str:
    return _get_fernet().encrypt(dek).decode()


def unwrap_key(wrapped: str) -> bytes:
    return _get_fernet().decrypt(wrapped.encode())


def hash_file(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()
