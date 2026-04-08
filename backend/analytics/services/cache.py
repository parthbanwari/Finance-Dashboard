from __future__ import annotations

import hashlib
from urllib.parse import urlencode

from django.conf import settings
from django.core.cache import cache


def _request_query_string(request) -> str:
    parts: list[tuple[str, str]] = []
    for key in sorted(request.query_params.keys()):
        values = request.query_params.getlist(key)
        for value in values:
            parts.append((key, value))
    return urlencode(parts)


def analytics_cache_key(user_id, endpoint_name: str, request) -> str:
    raw = f"{user_id}:{endpoint_name}:{_request_query_string(request)}"
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    return f"analytics:{endpoint_name}:{digest}"


def get_or_set_analytics_cache(user_id, endpoint_name: str, request, builder):
    key = analytics_cache_key(user_id, endpoint_name, request)
    cached = cache.get(key)
    if cached is not None:
        return cached
    data = builder()
    cache.set(key, data, timeout=getattr(settings, "ANALYTICS_CACHE_SECONDS", 30))
    return data
