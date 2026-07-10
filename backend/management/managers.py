from django.contrib.auth.base_user import BaseUserManager


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, wallet_address, **extra_fields):
        if not wallet_address:
            raise ValueError("Wallet address is required.")

        wallet_address = wallet_address.lower()

        user = self.model(
            wallet_address=wallet_address,
            **extra_fields,
        )

        user.set_unusable_password()
        user.save(using=self._db)

        return user

    def create_superuser(self, wallet_address, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        return self.create_user(wallet_address, **extra_fields)