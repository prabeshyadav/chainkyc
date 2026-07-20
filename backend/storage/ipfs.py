from io import BytesIO
from pathlib import Path

import requests
from django.conf import settings


class IPFSStorage:
    BASE_URL = "https://api.pinata.cloud"

    def __init__(self):
        self.headers = {
            "Authorization": f"Bearer {settings.PINATA_JWT}"
        }

    def upload(self, file):
        """
        Upload a Django UploadedFile or any file-like object to IPFS.
        Returns the Pinata response.
        """

        url = f"{self.BASE_URL}/pinning/pinFileToIPFS"

        filename = Path(
            getattr(file, "name", "document")
        ).name

        files = {
            "file": (filename, file)
        }

        response = requests.post(
            url,
            headers=self.headers,
            files=files,
            timeout=60,
        )

        response.raise_for_status()

        return response.json()

    def upload_bytes(
        self,
        data: bytes,
        filename="kyc.enc",
    ):
        """
        Upload raw bytes directly to IPFS.
        """

        file = BytesIO(data)
        file.name = filename

        return self.upload(file)

    def download(self, cid):
        url = f"https://gateway.pinata.cloud/ipfs/{cid}"

        response = requests.get(
            url,
            timeout=60,
        )

        response.raise_for_status()

        return response.content