import secrets

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from users.models import User


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Sign in with **email** + shared **DEMO_LOGIN_PASSWORD**, or **ADMIN_DEMO_EMAIL** with empty password.
    Unknown emails + correct demo password **auto-create** a Viewer account (except **ADMIN_DEMO_EMAIL**).
    Access token includes `role` (viewer | analyst | admin).
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields.pop("username", None)
        self.fields["email"] = serializers.EmailField(write_only=True)
        self.fields["password"] = serializers.CharField(
            write_only=True,
            required=False,
            allow_blank=True,
            trim_whitespace=False,
            style={"input_type": "password"},
        )

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        return token

    def validate(self, attrs):
        email = (attrs.get("email") or "").strip().lower()
        password = attrs.get("password")
        if password is None:
            password = ""
        else:
            password = str(password)

        admin_email = getattr(settings, "ADMIN_DEMO_EMAIL", "admin@demo.finance").strip().lower()

        UserModel = get_user_model()

        if admin_email and email == admin_email and password == "":
            user = UserModel.objects.filter(email__iexact=email).first()
            if (
                user
                and user.is_active
                and getattr(user, "role", None) == User.Role.ADMIN
            ):
                refresh = self.get_token(user)
                return {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                }
            raise serializers.ValidationError(
                {
                    "detail": "Admin account not available. Use admin@demo.finance and run create_demo_users."
                }
            )

        demo = (getattr(settings, "DEMO_LOGIN_PASSWORD", "") or "").strip()
        if not demo:
            raise serializers.ValidationError(
                {"detail": "Server login is not configured (set DEMO_LOGIN_PASSWORD)."}
            )
        if password != demo:
            raise serializers.ValidationError(
                {"detail": "No active account found with the given credentials."}
            )

        user = UserModel.objects.filter(email__iexact=email).first()
        if user is not None and not user.is_active:
            raise serializers.ValidationError(
                {"detail": "No active account found with the given credentials."}
            )

        if user is None:
            user = self._get_or_create_demo_user(email, admin_email)

        refresh = self.get_token(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }

    def _get_or_create_demo_user(self, email: str, admin_email: str):
        """
        Create a new active Viewer when the shared password matched and no user exists.
        Do not auto-create the reserved admin email — that account must be seeded (create_demo_users).
        """
        if admin_email and email == admin_email:
            raise serializers.ValidationError(
                {
                    "detail": (
                        "This admin address is not registered yet. Run "
                        "`python manage.py create_demo_users` or use Sign in as admin."
                    )
                }
            )

        UserModel = get_user_model()
        username = email[:150]
        if UserModel.objects.filter(username__iexact=username).exclude(email__iexact=email).exists():
            suffix = f"_{secrets.token_hex(4)}"
            username = f"{email[: 150 - len(suffix)]}{suffix}"

        try:
            with transaction.atomic():
                user = UserModel(
                    username=username,
                    email=email,
                    role=User.Role.VIEWER,
                    is_active=True,
                )
                user.set_unusable_password()
                user.save()
                return user
        except IntegrityError:
            existing = UserModel.objects.filter(email__iexact=email).first()
            if existing and existing.is_active:
                return existing
            raise serializers.ValidationError(
                {"detail": "Could not create your account. Try again in a moment."}
            ) from None
