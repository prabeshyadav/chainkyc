from ninja import Schema


class WalletSchema(Schema):
    wallet_address: str
    

class WalletLoginSchema(Schema):
    wallet_address: str