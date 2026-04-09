"""Shared API error details for auth flows (codes consumed by the SPA)."""

from rest_framework.exceptions import ErrorDetail

# Matches envelope field `error_code` when serialized from ValidationError / APIException.
ACCOUNT_INACTIVE_LOGIN = ErrorDetail(
    "This account is inactive and cannot sign in. Ask a workspace administrator to set your "
    "status to Active under Team Section.",
    code="account_inactive",
)
