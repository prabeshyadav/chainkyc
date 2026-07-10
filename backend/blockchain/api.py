from ninja import Router
from ninja.errors import HttpError

from blockchain.models import BlockchainAnchor
from blockchain.schemas import BlockchainAnchorOut, PublicChainVerificationOut
from blockchain.services import get_anchor_for_submission, get_public_verification

router = Router(tags=["blockchain"])


def serialize_anchor(anchor: BlockchainAnchor) -> dict:
    return {
        "id": anchor.id,
        "kyc_submission_id": anchor.kyc_submission_id,
        "wallet_address": anchor.kyc_submission.user.wallet_address,
        "network": anchor.network,
        "contract_address": anchor.contract_address,
        "ipfs_cid": anchor.ipfs_cid,
        "data_hash": anchor.data_hash,
        "salt": anchor.salt,
        "tx_hash": anchor.tx_hash,
        "block_number": anchor.block_number,
        "status": anchor.status,
        "anchored_at": anchor.anchored_at,
    }


@router.get("/anchor/{submission_id}", response=BlockchainAnchorOut)
def get_anchor(request, submission_id: str):
    try:
        anchor = get_anchor_for_submission(submission_id)
        return serialize_anchor(anchor)
    except BlockchainAnchor.DoesNotExist as exc:
        raise HttpError(404, "Blockchain anchor not found.") from exc


@router.get("/verify/{wallet_address}", response=PublicChainVerificationOut)
def verify_wallet_on_chain(request, wallet_address: str):
    submission = get_public_verification(wallet_address)
    if submission is None:
        return {
            "wallet_address": wallet_address.lower(),
            "verified": False,
            "data_hash": None,
            "ipfs_cid": None,
            "tx_hash": None,
            "verified_at": None,
        }

    return {
        "wallet_address": submission.user.wallet_address,
        "verified": True,
        "data_hash": submission.data_hash,
        "ipfs_cid": submission.ipfs_cid,
        "tx_hash": submission.tx_hash,
        "verified_at": submission.verified_at,
    }
