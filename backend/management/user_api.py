from ninja import Router

from management.jwt_auth import user_auth

from kyc.services import KYCService

router = Router(tags=["User"])


@router.get(
    "/me",
    auth=user_auth,
)
def me(request):

    return {
        "wallet_address": request.auth.wallet_address,
        "role": request.auth.role,
    }


@router.get(
    "/dashboard",
    auth=user_auth,
)
def dashboard(request):

    submission = KYCService.get_latest_submission(
        request.auth
    )

    if submission is None:
        return {
            "has_submission": False,
            "status": None,
            "version": None,
        }

    return {
        "has_submission": True,
        "submission_id": str(submission.id),
        "status": submission.status,
        "version": submission.version,
    }


@router.get(
    "/status",
    auth=user_auth,
)
def status(request):

    submission = KYCService.get_latest_submission(
        request.auth
    )

    if submission is None:
        return {
            "status": "NOT_SUBMITTED"
        }

    return {
        "status": submission.status,
        "version": submission.version,
    }