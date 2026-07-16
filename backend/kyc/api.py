from ninja import File, Form, Router
from ninja.errors import HttpError
from ninja.files import UploadedFile

from management.jwt_auth import JWTAuth, VerifierAuth

router = Router(tags=["kyc"])

