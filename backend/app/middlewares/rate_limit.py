from __future__ import annotations

import time
from collections import defaultdict, deque
from collections.abc import Callable
from threading import Lock

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.core.config import Settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, settings: Settings) -> None:
        super().__init__(app)
        self.settings = settings
        self._buckets: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def _client_key(self, request: Request) -> str:
        forwarded_for = request.headers.get("x-forwarded-for", "")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        if request.client and request.client.host:
            return request.client.host
        return "unknown"

    def _resolve_policy(self, path: str) -> tuple[int, int]:
        if path.startswith("/api/v1/auth/login") or path.startswith("/api/v1/auth/refresh"):
            return self.settings.auth_rate_limit_requests, self.settings.auth_rate_limit_window_seconds
        return self.settings.rate_limit_requests, self.settings.rate_limit_window_seconds

    def _is_exempt(self, path: str) -> bool:
        return path in {"/health"} or path.startswith("/api/v1/docs") or path.startswith("/api/v1/openapi")

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if not self.settings.rate_limit_enabled or self._is_exempt(request.url.path):
            return await call_next(request)

        max_requests, window_seconds = self._resolve_policy(request.url.path)
        if max_requests <= 0 or window_seconds <= 0:
            return await call_next(request)

        now = time.time()
        key = f"{request.method}:{request.url.path}:{self._client_key(request)}"

        with self._lock:
            bucket = self._buckets[key]
            threshold = now - window_seconds
            while bucket and bucket[0] <= threshold:
                bucket.popleft()

            if len(bucket) >= max_requests:
                retry_after = max(1, int(window_seconds - (now - bucket[0])))
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded. Try again later."},
                    headers={"Retry-After": str(retry_after)},
                )

            bucket.append(now)

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(max_requests)
        response.headers["X-RateLimit-Remaining"] = str(max(0, max_requests - len(self._buckets[key])))
        return response
