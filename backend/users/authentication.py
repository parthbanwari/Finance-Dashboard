from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication

from users.auth_errors import ACCOUNT_INACTIVE_LOGIN
from users.services import inactivity


class StaleAwareJWTAuthentication(JWTAuthentication):
    """
    After JWT validation, deactivate accounts with no login/refresh activity
    for INACTIVE_AFTER_DAYS (default 7), then reject the request.
    """

    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        if user is None:
            return user
        if user.is_active and inactivity.is_stale(user):
            inactivity.deactivate_for_inactivity(user)
            raise AuthenticationFailed(detail=[ACCOUNT_INACTIVE_LOGIN])
        return user
