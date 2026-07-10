from ninja import Router

from management.schemas import HealthOut
from .schemas import NonceRequest, NonceResponse, VerifyRequest, TokenResponse, UserOut
from .services import create_nonce, verify_wallet
from .jwt_auth import JWTAuth

router = Router(tags=["core"])


@router.get("/health", response=HealthOut)
def health(request):
    return {"status": "ok", "service": "reusable-kyc"}


@router.post("/nonce", response=NonceResponse)
def get_nonce(request, payload: NonceRequest):
    nonce = create_nonce(payload.wallet_address)

    return {
        "nonce": nonce.nonce,
    }


@router.post("/verify", response=TokenResponse)
def verify(request, payload: VerifyRequest):
    return verify_wallet(
        payload.wallet_address,
        payload.signature,
    )


@router.get("/me", response=UserOut, auth=JWTAuth())
def me(request):
    return request.auth