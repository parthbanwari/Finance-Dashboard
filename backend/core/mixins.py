"""Optional helpers for API response envelope messages."""

from __future__ import annotations

from typing import Any

from rest_framework.request import Request
from rest_framework.response import Response


class EnvelopeMessageMixin:
    """
    Attach response.envelope_message for EnvelopeJSONRenderer.

    For viewsets, set envelope_resource_label and/or *_message attributes.
    For plain APIView, set envelope_success_message.
    """

    envelope_resource_label: str | None = None
    envelope_success_message: str | None = None
    envelope_list_message: str | None = None
    envelope_detail_message: str | None = None
    envelope_create_message: str | None = None
    envelope_update_message: str | None = None
    envelope_delete_message: str | None = None

    def finalize_response(self, request: Request, response: Response, *args: Any, **kwargs: Any) -> Response:
        response = super().finalize_response(request, response, *args, **kwargs)

        if response.status_code >= 400:
            return response

        msg = self._pick_envelope_message(request, response)
        if msg:
            setattr(response, "envelope_message", msg)

        return response

    def _pick_envelope_message(self, request: Request, response: Response) -> str | None:
        if isinstance(self.envelope_success_message, str) and self.envelope_success_message.strip():
            return self.envelope_success_message.strip()

        action = getattr(self, "action", None)
        label = self.envelope_resource_label

        if action == "list" and self.envelope_list_message:
            return self.envelope_list_message
        if action == "retrieve" and self.envelope_detail_message:
            return self.envelope_detail_message
        if action == "create" and self.envelope_create_message:
            return self.envelope_create_message
        if action in ("update", "partial_update") and self.envelope_update_message:
            return self.envelope_update_message
        if action == "destroy" and self.envelope_delete_message:
            return self.envelope_delete_message

        if label and action:
            if action == "list":
                return f"{label} retrieved successfully."
            if action == "retrieve":
                return f"{label} retrieved successfully."
            if action == "create":
                return f"{label} created successfully."
            if action in ("update", "partial_update"):
                return f"{label} updated successfully."
            if action == "destroy":
                return f"{label} deleted successfully."

        return None
