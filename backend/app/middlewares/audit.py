"""Middleware that automatically writes audit log entries for mutating requests."""

from __future__ import annotations

import logging

import jwt
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import get_settings
from app.core.security import decode_token
from app.db.session import SessionLocal
from app.services.audit_service import AuditService

logger = logging.getLogger(__name__)

# ── Mapeamento de segmento de path → nome legível do recurso ──────────────────
_RESOURCE_MAP: dict[str, str] = {
    "users": "usuario",
    "roles": "perfil",
    "permissions": "permissão",
    "produtores": "produtor",
    "produtos": "produto",
    "fretes": "frete",
    "cargas": "carga",
    "embalagens": "embalagem",
    "veiculos": "veículo",
    "manutencoes": "manutenção",
    "tipos_manutencao": "tipo de manutenção",
    "firmas": "firma",
    "coletas": "coleta",
    "services": "serviço",
    "company_product_prices": "preço",
    "freight_rates": "tarifa",
    "package_deliveries": "entrega",
    "package_stock": "estoque",
    "reports": "relatório",
}

# Sufixos de sub-rota que determinam uma ação específica
_SUFFIX_ACTION: dict[str, str] = {
    "reset-password": "reset de senha",
    "permissions": "atualização de permissões",
}

# Paths de auth com ação fixa (relativo ao prefixo da API)
_AUTH_FIXED: dict[str, str] = {
    "/auth/login": "login",
    "/auth/logout": "logout",
    "/auth/change-password": "troca de senha",
}

# Paths que devem ser ignorados pelo middleware
_SKIP_PATHS: set[str] = {
    "/auth/refresh",
    "/auth/me",
    "/health",
}

# Método HTTP → ação padrão
_METHOD_ACTION: dict[str, str] = {
    "POST": "criação",
    "PUT": "atualização",
    "PATCH": "atualização",
    "DELETE": "exclusão",
}


def _parse_request(method: str, path: str, api_prefix: str) -> tuple[str, str | None, str | None] | None:
    """
    Retorna (action, resource_type, resource_id) ou None se o request não deve ser auditado.
    """
    if method == "GET":
        return None

    # Remove o prefixo da API (/api/v1)
    if not path.startswith(api_prefix):
        return None
    rel = path[len(api_prefix):]  # ex.: /users/42/reset-password

    # Verifica paths de skip
    for skip in _SKIP_PATHS:
        if rel == skip or rel.startswith(skip + "/"):
            return None

    # Paths de auth com ação fixa
    for auth_path, action in _AUTH_FIXED.items():
        if rel == auth_path or rel.startswith(auth_path + "/"):
            return action, "auth", None

    # Decompõe o path em segmentos: ["", "users", "42", "reset-password"]
    segments = rel.split("/")
    if len(segments) < 2:
        return None

    resource_segment = segments[1]  # "users"
    resource_type = _RESOURCE_MAP.get(resource_segment)
    if not resource_type:
        return None

    resource_id: str | None = None
    action = _METHOD_ACTION.get(method, "operação")

    # /users/42  →  resource_id = "42"
    if len(segments) >= 3 and segments[2]:
        candidate = segments[2]
        # Se não é um sub-recurso, é o ID
        if candidate not in _RESOURCE_MAP and candidate not in _SUFFIX_ACTION:
            resource_id = candidate

    # /users/42/reset-password  →  ação específica pelo sufixo
    if len(segments) >= 4 and segments[3]:
        suffix = segments[3]
        if suffix in _SUFFIX_ACTION:
            action = _SUFFIX_ACTION[suffix]

    return action, resource_type, resource_id


def _extract_user(request: Request) -> tuple[int | None, str | None, str | None]:
    """Extrai (user_id, user_email, user_name) do JWT, sem lançar exceção."""
    settings = get_settings()
    token = request.cookies.get(settings.access_token_cookie_name)
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        return None, None, None
    try:
        payload = decode_token(token)
        return payload.get("user_id"), payload.get("sub"), payload.get("user_name")
    except jwt.PyJWTError:
        return None, None, None


def _get_ip(request: Request) -> str | None:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None


class AuditMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, api_prefix: str = "/api/v1") -> None:
        super().__init__(app)
        self.api_prefix = api_prefix

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)

        # Só registra se a resposta foi bem-sucedida
        if response.status_code >= 400:
            return response

        parsed = _parse_request(request.method, request.url.path, self.api_prefix)
        if parsed is None:
            return response

        action, resource_type, resource_id = parsed
        user_id, user_email, user_name = _extract_user(request)
        ip = _get_ip(request)

        details = getattr(request.state, "audit_details", None)

        try:
            with SessionLocal() as session:
                AuditService(session).log(
                    action,
                    user_id=user_id,
                    user_email=user_email,
                    user_name=user_name,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    ip_address=ip,
                    details=details,
                )
                session.commit()
        except Exception:
            logger.exception("Erro ao gravar audit log")

        return response
