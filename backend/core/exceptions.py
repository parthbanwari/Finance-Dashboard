"""Standard JSON error envelope for API responses (matches success envelope shape)."""

from typing import Any

from rest_framework import status
from rest_framework.exceptions import ErrorDetail
from rest_framework.response import Response
from rest_framework.settings import api_settings
from rest_framework.views import exception_handler as drf_exception_handler


def _detail_to_str(detail: Any) -> Any:
    if isinstance(detail, dict):
        return {k: _detail_to_str(v) for k, v in detail.items()}
    if isinstance(detail, list):
        return [_detail_to_str(item) for item in detail]
    if isinstance(detail, ErrorDetail):
        return str(detail)
    return detail


def _first_error_code(detail: Any) -> str | None:
    if isinstance(detail, list):
        for item in detail:
            c = _first_error_code(item)
            if c:
                return c
    if isinstance(detail, ErrorDetail):
        code = getattr(detail, "code", None)
        return str(code) if code else None
    return None


def _message_from_detail(detail: Any) -> str:
    """Human-readable message; never str(list) (that produced ErrorDetail repr in clients)."""
    converted = _detail_to_str(detail)
    if isinstance(converted, list):
        parts = [str(x) for x in converted if x is not None and str(x).strip()]
        return " ".join(parts).strip() if parts else "Request could not be processed."
    if isinstance(converted, dict):
        return "Validation failed."
    if converted is None:
        return "Request could not be processed."
    return str(converted).strip() or "Request could not be processed."


def custom_exception_handler(exc: Exception, context: dict) -> Response | None:
    response = drf_exception_handler(exc, context)
    if response is None:
        return None

    status_code = response.status_code

    message = "Request could not be processed."
    data_payload: Any = None
    error_code: str | None = None

    raw = response.data
    _single_detail_keys = ("detail", api_settings.NON_FIELD_ERRORS_KEY)
    if isinstance(raw, dict):
        if len(raw) == 1:
            only_key = next(iter(raw.keys()))
            if only_key in _single_detail_keys:
                only_val = raw[only_key]
                error_code = _first_error_code(only_val)
                message = _message_from_detail(only_val)
            else:
                message = "Validation failed."
                data_payload = _detail_to_str(raw)
        else:
            message = "Validation failed."
            data_payload = _detail_to_str(raw)
    elif isinstance(raw, list):
        message = "Validation failed."
        data_payload = _detail_to_str(raw)
        error_code = _first_error_code(raw)

    payload: dict[str, Any] = {
        "code": 0,
        "message": message,
        "data": data_payload,
    }
    if error_code:
        payload["error_code"] = error_code

    return Response(payload, status=status_code, headers=response.headers)
