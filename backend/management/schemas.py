from ninja import Schema


class HealthOut(Schema):
    status: str
    service: str

class NonceRequest(Schema):
    wallet_address: str


class NonceResponse(Schema):
    nonce: str
    
    


class VerifyRequest(Schema):
    wallet_address: str
    signature: str


class TokenResponse(Schema):
    access_token: str
    refresh_token: str


class UserOut(Schema):
    id: str
    wallet_address: str
    role: str
    is_staff: bool
    is_superuser: bool