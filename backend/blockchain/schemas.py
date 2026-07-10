import uuid
from datetime import datetime
from typing import Optional

from ninja import Schema

from blockchain.models import AnchorStatus, BlockchainNetwork


class BlockchainAnchorOut(Schema):
    id: uuid.UUID
    kyc_submission_id: uuid.UUID
    wallet_address: str
    network: BlockchainNetwork
    contract_address: str
    ipfs_cid: str
    data_hash: str
    salt: str
    tx_hash: str
    block_number: Optional[int] = None
    status: AnchorStatus
    anchored_at: datetime


class PublicChainVerificationOut(Schema):
    wallet_address: str
    verified: bool
    data_hash: Optional[str] = None
    ipfs_cid: Optional[str] = None
    tx_hash: Optional[str] = None
    verified_at: Optional[datetime] = None
