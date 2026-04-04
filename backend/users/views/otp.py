from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from core.openapi import TokenPairResponseSchema
from users.serializers.otp import OtpSendSerializer, OtpVerifySerializer
from users.services.otp import issue_tokens_for_user, send_login_otp, verify_login_otp


class OtpSendView(APIView):
    """Request a one-time sign-in code sent to the user's email."""

    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Auth"],
        summary="Send sign-in OTP",
        description=(
            "Sends a 6-digit code to the email if an **active** user exists with that address. "
            "Response is the same whether or not the user exists (no account enumeration)."
        ),
        request=OtpSendSerializer,
        responses={
            200: OpenApiResponse(
                description="Code sent or generic acknowledgment.",
            ),
            429: OpenApiResponse(description="Rate limited — wait before retrying."),
        },
        examples=[
            OpenApiExample(
                "Request",
                value={"email": "analyst@example.com"},
                request_only=True,
            ),
        ],
    )
    def post(self, request):
        ser = OtpSendSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email = ser.validated_data["email"]

        ok, err = send_login_otp(email)
        if not ok:
            code = (
                status.HTTP_429_TOO_MANY_REQUESTS
                if err and "wait" in err.lower()
                else status.HTTP_400_BAD_REQUEST
            )
            return Response({"detail": err}, status=code)

        resp = Response(
            {
                "detail": (
                    "If an account exists for this email, a sign-in code has been sent. "
                    "Check your inbox."
                )
            },
            status=status.HTTP_200_OK,
        )
        resp.envelope_message = "Sign-in code sent."
        return resp


class OtpVerifyView(APIView):
    """Exchange email + OTP for JWT access and refresh tokens (includes `role` in access)."""

    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Auth"],
        summary="Verify OTP and obtain JWT",
        description=(
            "Submit the 6-digit code from email. On success, returns **access** and **refresh** "
            "tokens (same as password login). Access token includes `role`."
        ),
        request=OtpVerifySerializer,
        responses={
            200: OpenApiResponse(
                response=TokenPairResponseSchema,
                description="JWT access and refresh strings.",
            ),
            401: OpenApiResponse(description="Invalid or expired code."),
        },
        examples=[
            OpenApiExample(
                "Verify",
                value={"email": "analyst@example.com", "otp": "123456"},
                request_only=True,
            ),
        ],
    )
    def post(self, request):
        ser = OtpVerifySerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email = ser.validated_data["email"]
        otp = ser.validated_data["otp"]

        user = verify_login_otp(email, otp)
        if user is None:
            return Response(
                {"detail": "Invalid or expired code. Request a new code and try again."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        data = issue_tokens_for_user(user)
        resp = Response(data, status=status.HTTP_200_OK)
        resp.envelope_message = "Signed in successfully."
        return resp
