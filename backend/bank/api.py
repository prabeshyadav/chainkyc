from ninja import Router

from management.jwt_auth import bank_auth

from .service import BankService
from .schemas import BankKYCResponseSchema

router = Router(
    tags=["Bank"]
)


@router.get(
    "/me",
    auth=bank_auth,
)
def me(request):

    return {
        "wallet_address": request.auth.wallet_address,
        "role": request.auth.role,
    }
    
    
    
@router.get(
    "/kyc/{wallet_address}",
    auth=bank_auth,
    response=BankKYCResponseSchema,
)
def get_user_kyc(
    request,
    wallet_address: str,
):

    return BankService.check_kyc(
        wallet_address
    )