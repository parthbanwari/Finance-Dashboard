from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema, extend_schema_view
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from core.openapi import TokenPairResponseSchema
from users.serializers.tokens import CustomTokenObtainPairSerializer


@extend_schema_view(
    post=extend_schema(
        tags=["Auth"],
        summary="Obtain JWT token pair",
        description=(
            "Authenticate with **username** and **password**. Returns **access** and **refresh** "
            "JWT strings. The access token payload includes a `role` field (viewer | analyst | admin). "
            "Send subsequent requests with header: `Authorization: Bearer <access>`."
        ),
        responses={
            200: OpenApiResponse(
                response=TokenPairResponseSchema,
                description="Access and refresh JWT strings.",
            ),
        },
        examples=[
            OpenApiExample(
                "Login",
                value={"username": "analyst1", "password": "your-password"},
                request_only=True,
            ),
        ],
    ),
)
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


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
