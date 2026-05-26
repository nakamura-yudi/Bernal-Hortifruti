from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import Settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, settings: Settings) -> None:
        super().__init__(app)
        self.settings = settings

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        if not self.settings.security_headers_enabled:
            return response

        response.headers.setdefault("X-Frame-Options", self.settings.frame_options)
        response.headers.setdefault("X-Content-Type-Options", self.settings.content_type_options)
        response.headers.setdefault("Referrer-Policy", self.settings.referrer_policy)
        response.headers.setdefault("Permissions-Policy", self.settings.permissions_policy)
        response.headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
        response.headers.setdefault("Cross-Origin-Resource-Policy", "same-site")

        if self.settings.content_security_policy:
            response.headers.setdefault("Content-Security-Policy", self.settings.content_security_policy)

        if self.settings.hsts_enabled:
            hsts_value = f"max-age={self.settings.hsts_max_age}"
            if self.settings.hsts_include_subdomains:
                hsts_value += "; includeSubDomains"
            if self.settings.hsts_preload:
                hsts_value += "; preload"
            response.headers.setdefault("Strict-Transport-Security", hsts_value)

        return response
