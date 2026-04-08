from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema, extend_schema_view
from core.throttles import AuthRefreshRateThrottle, AuthTokenRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from core.openapi import TokenPairResponseSchema
from users.serializers.tokens import CustomTokenObtainPairSerializer


@extend_schema_view(
    post=extend_schema(
        tags=["Auth"],
        summary="Obtain JWT token pair",
        description=(
            "Authenticate with **email** and **DEMO_LOGIN_PASSWORD** (viewer/analyst), or "
            "**ADMIN_DEMO_EMAIL** with an **empty password** (admin UI). "
            "Returns **access** and **refresh** JWTs with `role` in the access payload."
        ),
        responses={
            200: OpenApiResponse(
                response=TokenPairResponseSchema,
                description="Access and refresh JWT strings.",
            ),
        },
        examples=[
            OpenApiExample(
                "Viewer / analyst",
                value={"email": "analyst@demo.finance", "password": "<DEMO_LOGIN_PASSWORD>"},
                request_only=True,
            ),
            OpenApiExample(
                "Admin (passwordless when enabled)",
                value={"email": "admin@demo.finance", "password": ""},
                request_only=True,
            ),
        ],
    ),
)
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [AuthTokenRateThrottle]


@extend_schema_view(
    post=extend_schema(
        tags=["Auth"],
        summary="Refresh JWT access token",
        description=(
            "Submit a valid **refresh** token to receive a new **access** token. "
            "Use when the access token expires before the refresh token does."
        ),
        examples=[
            OpenApiExample(
                "Refresh",
                value={"refresh": "<refresh_token_jwt>"},
                request_only=True,
            ),
        ],
    ),
)
class TokenRefreshViewWithSchema(TokenRefreshView):
    """Same behavior as SimpleJWT's TokenRefreshView; OpenAPI metadata only."""
    throttle_classes = [AuthRefreshRateThrottle]
