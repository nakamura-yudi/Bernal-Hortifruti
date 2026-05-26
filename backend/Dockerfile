FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /code

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY alembic ./alembic
COPY app ./app
COPY scripts ./scripts
COPY entrypoint.sh ./entrypoint.sh

RUN chmod +x /code/entrypoint.sh

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD curl -fsS http://127.0.0.1:${PORT:-8000}/health || exit 1

CMD ["/code/entrypoint.sh"]
