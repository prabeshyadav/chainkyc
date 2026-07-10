from ninja import Router
from ninja.errors import HttpError

from organization.models import Organization
from organization.schemas import OrganizationIn, OrganizationOut
from organization.services import OrganizationServiceError, create_organization, handle_service_error

router = Router(tags=["organizations"])


def serialize_organization(org: Organization) -> dict:
    return {
        "id": org.id,
        "name": org.name,
        "slug": org.slug,
        "org_type": org.org_type,
        "contact_email": org.contact_email,
        "contact_phone": org.contact_phone,
        "address": org.address,
        "is_active": org.is_active,
        "created_at": org.created_at,
    }


@router.get("/", response=list[OrganizationOut])
def list_organizations(request):
    return [serialize_organization(org) for org in Organization.objects.filter(is_active=True)]


@router.post("/", response=OrganizationOut)
def create_organization_endpoint(request, payload: OrganizationIn):
    try:
        org = create_organization(payload.dict())
        return serialize_organization(org)
    except OrganizationServiceError as exc:
        handle_service_error(exc)


@router.get("/{organization_id}", response=OrganizationOut)
def get_organization(request, organization_id: str):
    org = Organization.objects.filter(id=organization_id, is_active=True).first()
    if org is None:
        raise HttpError(404, "Organization not found.")
    return serialize_organization(org)
