from ninja import Schema


class WalletSchema(Schema):
    wallet_address: str
    

class WalletLoginSchema(Schema):
    wallet_address: str
    
class MessageSchema(Schema):
    message: str
    tx_hash: str
    status: int