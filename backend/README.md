# Bernal Transportadora API

Stack baseado em FastAPI + SQLAlchemy + PostgreSQL.

## Requisitos
- Docker e Docker Compose
- uv (ou pip) para gerenciamento local (opcional)

## Primeiros passos
1. Configure seu arquivo `.env` baseado em [.env.example](.env.example).
2. Instale dependências localmente: `uv pip install -r requirements.txt`.
3. Suba os serviços: `docker compose up --build`.
4. Acesse `http://localhost:8000/health` para verificar o serviço e `http://localhost:8000/api/v1/docs` para documentação interativa.

Variáveis obrigatórias de segurança:
- `SECRET_KEY` deve ser definido com pelo menos 32 caracteres e não pode usar valor padrão.
- Em produção, ajuste `AUTH_COOKIE_SECURE=true`.

## Migrations (Alembic)
Criação de migration:
```
alembic revision --autogenerate -m "descricao"
```

Aplicar migrations:
```
alembic upgrade head
```

Reverter última migration:
```
alembic downgrade -1
```

## Deploy no EasyPanel
Use o `Dockerfile` desta pasta como origem do serviço backend.

Variáveis mínimas:
- `DATABASE_URL=postgresql+psycopg://USER:SENHA@HOST:5432/BANCO`
- `SECRET_KEY=<uma-chave-com-pelo-menos-32-caracteres>`
- `ENVIRONMENT=production`
- `AUTH_COOKIE_SECURE=true`
- `AUTH_COOKIE_SAMESITE=none`
- `CORS_ORIGINS=["https://seu-frontend.exemplo.com"]`
- `ALLOWED_HOSTS=["api.seu-dominio.com"]`
- `RATE_LIMIT_ENABLED=true`
- `RATE_LIMIT_REQUESTS=120`
- `RATE_LIMIT_WINDOW_SECONDS=60`
- `AUTH_RATE_LIMIT_REQUESTS=10`
- `AUTH_RATE_LIMIT_WINDOW_SECONDS=60`
- `SECURITY_HEADERS_ENABLED=true`
- `CONTENT_SECURITY_POLICY=default-src 'self'; connect-src 'self' https://seu-frontend.exemplo.com https://api.seu-dominio.com; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; font-src 'self' data:`
- `PERMISSIONS_POLICY=geolocation=(), microphone=(), camera=()`
- `REFERRER_POLICY=strict-origin-when-cross-origin`
- `FRAME_OPTIONS=DENY`
- `HSTS_ENABLED=true`
- `HSTS_MAX_AGE=31536000`
- `HSTS_INCLUDE_SUBDOMAINS=true`
- `HSTS_PRELOAD=false`
- `FORCE_HTTPS_REDIRECT=false`
- `PORT=8000`

O container executa `alembic -c alembic/alembic.ini upgrade head` automaticamente antes de iniciar a API.

## Seed RBAC (roles/permissoes/admin)
Exemplo usando Python:
```
python - <<'PY'
from app.db.seed import RBACSeedConfig, seed_rbac
from app.db.session import SessionLocal

with SessionLocal() as session:
    seed_rbac(
        session,
        RBACSeedConfig(admin_email="admin@example.com", admin_password="replace-me"),
    )
PY
```

## Sessão e autenticação
- `access_token` e `refresh_token` são emitidos em cookies `httpOnly`.
- O refresh token é persistido no banco, rotacionado a cada refresh e revogado em logout.
- Alteração de senha revoga as sessões de refresh do usuário.

## Estrutura
A estrutura segue o padrão modular descrito nas issues, com camadas para API, core, DB, modelos, schemas, serviços e middlewares. As pastas já estão criadas com placeholders para facilitar implementação incremental dos domínios e regras de negócio.

## Próximos passos
- Implementar modelos e migrações (SQLAlchemy + Alembic).
- Conectar dependências reais de banco (`get_db_session`).
- Implementar autenticação JWT e RBAC.
- Preencher serviços/endpoints com regras de negócio descritas nas issues subsequentes.
