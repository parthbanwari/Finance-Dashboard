"""
Wrap successful JSON responses in a consistent envelope:

    { "code": 1, "message": "<human-readable>", "data": <payload> }

Skips OpenAPI schema/docs routes and responses that are already enveloped.
"""

from __future__ import annotations

from typing import Any

from rest_framework.renderers import JSONRenderer


def _should_skip_envelope(request, path: str) -> bool:
    if path.startswith("/api/schema") or path.startswith("/api/docs") or path.startswith("/api/redoc"):
        return True
    if path.startswith("/admin"):
        return True
    return False


def _already_enveloped(data: Any) -> bool:
    return (
        isinstance(data, dict)
        and "code" in data
        and "message" in data
        and "data" in data
        and data.get("code") in (0, 1)
    )


def _default_success_message(request, response) -> str:
    method = (getattr(request, "method", "GET") or "GET").upper()
    status_code = getattr(response, "status_code", 200) or 200

    if method == "GET":
        return "Data retrieved successfully."
    if method == "POST" and status_code == 201:
        return "Resource created successfully."
    if method == "POST":
        return "Request completed successfully."
    if method in ("PUT", "PATCH"):
        return "Resource updated successfully."
    if method == "DELETE":
        return "Resource deleted successfully."
    return "Success"


def _envelope_message(request, response, renderer_context) -> str:
    explicit = getattr(response, "envelope_message", None)
    if isinstance(explicit, str) and explicit.strip():
        return explicit.strip()

    view = renderer_context.get("view")
    if view is not None:
        getter = getattr(view, "get_envelope_success_message", None)
        if callable(getter):
            try:
                msg = getter()
                if isinstance(msg, str) and msg.strip():
                    return msg.strip()
            except Exception:
                pass

    return _default_success_message(request, response)


class EnvelopeJSONRenderer(JSONRenderer):
    """
    Renders JSON with { code: 1, message, data } for 2xx/3xx bodies.
    """

    charset = "utf-8"
    format = "json"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        renderer_context = renderer_context or {}
        request = renderer_context.get("request")
        response = renderer_context.get("response")

        if request is None:
            return super().render(data, accepted_media_type, renderer_context)

        if _should_skip_envelope(request, request.path):
            return super().render(data, accepted_media_type, renderer_context)

        if response is not None and response.status_code == 204:
            return super().render(data, accepted_media_type, renderer_context)

        if _already_enveloped(data):
            return super().render(data, accepted_media_type, renderer_context)

        if response is not None and response.status_code >= 400:
            return super().render(data, accepted_media_type, renderer_context)

        message = _envelope_message(request, response, renderer_context)
        envelope = {
            "code": 1,
            "message": message,
            "data": data,
        }
        return super().render(envelope, accepted_media_type, renderer_context)
