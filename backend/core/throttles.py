from rest_framework.throttling import SimpleRateThrottle


class AuthTokenRateThrottle(SimpleRateThrottle):
    """Throttle token obtain to slow brute-force attempts."""

    scope = "auth_token"

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        return self.cache_format % {
            "scope": self.scope,
            "ident": ident,
        }


class AuthRefreshRateThrottle(SimpleRateThrottle):
    """Throttle refresh endpoint to reduce abusive token cycling."""

    scope = "auth_refresh"

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        return self.cache_format % {
            "scope": self.scope,
            "ident": ident,
        }
