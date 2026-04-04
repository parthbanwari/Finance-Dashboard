"""Standard JSON error envelope for API responses (matches success envelope shape)."""

from typing import Any

from rest_framework import status
from rest_framework.exceptions import ErrorDetail
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


def _detail_to_str(detail: Any) -> Any:
    if isinstance(detail, dict):
        return {k: _detail_to_str(v) for k, v in detail.items()}
    if isinstance(detail, list):
        return [_detail_to_str(item) for item in detail]
    if isinstance(detail, ErrorDetail):
        return str(detail)
    return detail


def custom_exception_handler(exc: Exception, context: dict) -> Response | None:
    response = drf_exception_handler(exc, context)
    if response is None:
        return None

    status_code = response.status_code

    message = "Request could not be processed."
    data_payload: Any = None

    raw = response.data
    if isinstance(raw, dict):
        if "detail" in raw and len(raw) == 1:
            message = str(raw["detail"])
        else:
            message = "Validation failed."
            data_payload = _detail_to_str(raw)
    elif isinstance(raw, list):
        message = "Validation failed."
        data_payload = _detail_to_str(raw)

    payload = {
        "code": 0,
        "message": message,
        "data": data_payload,
    }

    return Response(payload, status=status_code, headers=response.headers)
