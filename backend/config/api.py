from ninja import NinjaAPI

from bank.api import router as bank_router
from blockchain.api import router as blockchain_router
from kyc.api import router as kyc_router
from management.api import router as management_router
from organization.api import router as organization_router
from verification.api import router as verification_router

api = NinjaAPI(title="Reusable KYC API", version="1.0.0")

api.add_router("/", management_router)
api.add_router("/kyc", kyc_router)
api.add_router("/organizations", organization_router)
api.add_router("/banks", bank_router)
api.add_router("/verification", verification_router)
api.add_router("/blockchain", blockchain_router)
