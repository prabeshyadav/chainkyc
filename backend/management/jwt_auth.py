import jwt
from django.conf import settings
from ninja.security import HttpBearer

from management.models import User


class JWTAuth(HttpBearer):
    def authenticate(self, request, token):
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=["HS256"],
            )
        except jwt.PyJWTError:
            return None

        if payload.get("type") != "access":
            return None

        try:
            return User.objects.get(id=payload["sub"])
        except User.DoesNotExist:
            return None


class StaffAuth(JWTAuth):
    def authenticate(self, request, token):
        user = super().authenticate(request, token)
        if user and user.is_staff:
            return user
        return None


class AdminAuth(JWTAuth):
    def authenticate(self, request, token):
        from management.models import UserRole
        user = super().authenticate(request, token)
        if user and user.role == UserRole.ADMIN:
            return user
        return None


class VerifierAuth(JWTAuth):
    def authenticate(self, request, token):
        from management.models import UserRole
        user = super().authenticate(request, token)
        if user and user.role in {UserRole.VERIFIER, UserRole.ADMIN}:
            return user
        return None


class BankAuth(JWTAuth):
    def authenticate(self, request, token):
        from management.models import UserRole
        user = super().authenticate(request, token)
        if user and user.role == UserRole.BANK:
            return user
        return None

