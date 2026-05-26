#!/usr/bin/env python3
"""
Bernal Transportadora API - Startup Script with Pre-flight Checks

This script runs basic checks before starting the server:
- Required environment variables
- PostgreSQL connectivity
- Alembic migration status

Usage:
    python run.py [--check-only] [--skip-db] [--no-auto-migrate]
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import List, Tuple

# Add project root to sys.path so Alembic can import app.*
PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError


class Colors:
    """ANSI colors for terminal output."""

    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"
    END = "\033[0m"


def print_header(message: str) -> None:
    """Print a formatted header."""
    line = "=" * 70
    print(f"\n{Colors.BOLD}{Colors.CYAN}{line}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}{message.center(70)}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}{line}{Colors.END}\n")


def print_check(message: str, status: bool, details: str = "") -> None:
    """Print a check result."""
    icon = f"{Colors.GREEN}✓{Colors.END}" if status else f"{Colors.RED}✗{Colors.END}"
    color = Colors.GREEN if status else Colors.RED
    status_text = "OK" if status else "FAILED"
    print(f"{icon} {message}... {color}{status_text}{Colors.END}")
    if details:
        print(f"  {Colors.YELLOW}→{Colors.END} {details}")


def print_warning(message: str) -> None:
    """Print a warning."""
    print(f"{Colors.YELLOW}⚠ {message}{Colors.END}")


def print_error(message: str) -> None:
    """Print an error."""
    print(f"{Colors.RED}✗ ERROR: {message}{Colors.END}")


def print_info(message: str) -> None:
    """Print an informational message."""
    print(f"{Colors.BLUE}ℹ {message}{Colors.END}")


def check_python_version() -> Tuple[bool, str]:
    """Ensure Python version is supported."""
    required = (3, 10)
    current = sys.version_info[:2]
    if current >= required:
        return True, f"Python {current[0]}.{current[1]}"
    return False, f"Python {current[0]}.{current[1]} (required {required[0]}.{required[1]}+)"


def check_env_file() -> Tuple[bool, str]:
    """Ensure .env exists."""
    env_path = PROJECT_ROOT / ".env"
    if env_path.exists():
        return True, f".env found ({env_path})"
    return False, "Missing .env (copy .env.example to .env)"


def check_required_env_vars() -> Tuple[bool, List[str]]:
    """Ensure critical env vars are present."""
    from app.core.config import get_settings

    settings = get_settings()
    missing: List[str] = []

    if not settings.database_url:
        missing.append("DATABASE_URL")
    if not settings.secret_key:
        missing.append("SECRET_KEY")

    if missing:
        return False, missing
    return True, []


def check_secret_key() -> Tuple[bool, str]:
    """Validate SECRET_KEY strength."""
    from app.core.config import get_settings

    secret_key = get_settings().secret_key
    if not secret_key:
        return False, "SECRET_KEY not defined"
    if len(secret_key) < 32:
        return False, f"SECRET_KEY too short ({len(secret_key)} chars, min 32)"
    if secret_key == "change-me":
        return False, "SECRET_KEY uses default value"
    return True, f"SECRET_KEY configured ({len(secret_key)} chars)"


def check_database_connection() -> Tuple[bool, str]:
    """Check PostgreSQL connectivity."""
    from app.core.config import get_settings

    try:
        engine = create_engine(get_settings().database_url, pool_pre_ping=True)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.scalar() or "unknown"
        engine.dispose()
        pg_version = version.split(",")[0] if version else "unknown"
        return True, f"Connected to {pg_version}"
    except SQLAlchemyError as exc:
        return False, f"Connection failed: {exc}"


def apply_database_migrations() -> Tuple[bool, str]:
    """Apply Alembic migrations."""
    try:
        from alembic import command
        from alembic.config import Config

        alembic_cfg = Config(str(PROJECT_ROOT / "alembic" / "alembic.ini"))
        alembic_cfg.set_main_option("script_location", "alembic")
        command.upgrade(alembic_cfg, "head")
        return True, "Migrations applied successfully"
    except Exception as exc:  # noqa: BLE001
        return False, f"Migration failed: {exc}"


def check_database_migrations(auto_migrate: bool = True) -> Tuple[bool, str]:
    """Check if migrations are up to date."""
    try:
        from alembic.config import Config
        from alembic.script import ScriptDirectory
        from app.core.config import get_settings

        alembic_cfg = Config(str(PROJECT_ROOT / "alembic" / "alembic.ini"))
        script = ScriptDirectory.from_config(alembic_cfg)
        head = script.get_current_head()

        engine = create_engine(get_settings().database_url, pool_pre_ping=True)
        with engine.connect() as conn:
            try:
                result = conn.execute(text("SELECT version_num FROM alembic_version"))
                current = result.scalar()
            except Exception:
                current = None
        engine.dispose()

        if current is None:
            if auto_migrate:
                print_info("Database not initialized. Applying migrations...")
                return apply_database_migrations()
            return False, "alembic_version table not found. Run alembic upgrade head"

        if current == head:
            return True, f"Migrations up to date ({current})"

        if auto_migrate:
            print_info(f"Pending migrations: {current} -> {head}. Applying...")
            return apply_database_migrations()

        return False, f"Pending migrations (current: {current}, head: {head})"
    except Exception as exc:  # noqa: BLE001
        return False, f"Migration check failed: {exc}"


def run_checks(skip_db: bool, auto_migrate: bool) -> bool:
    """Run all pre-flight checks."""
    print_header("Bernal Transportadora API - Pre-flight Checks")

    all_ok = True

    status, details = check_python_version()
    print_check("Python version", status, details)
    if not status:
        all_ok = False

    status, details = check_env_file()
    print_check(".env file", status, details)
    if not status:
        all_ok = False
        print_error("Create .env before continuing")
        return False

    status, missing = check_required_env_vars()
    if status:
        print_check("Required env vars", True)
    else:
        print_check("Required env vars", False)
        for var in missing:
            print_error(f"Missing: {var}")
        all_ok = False

    status, details = check_secret_key()
    print_check("SECRET_KEY", status, details)
    if not status:
        all_ok = False

    if not skip_db:
        status, details = check_database_connection()
        print_check("PostgreSQL connection", status, details)
        if not status:
            print_warning("Make sure PostgreSQL is running")
            all_ok = False
        else:
            status, details = check_database_migrations(auto_migrate=auto_migrate)
            print_check("Database migrations", status, details)
            if not status:
                all_ok = False
    else:
        print_info("Database checks skipped (--skip-db)")

    return all_ok


def main() -> int:
    """CLI entrypoint."""
    parser = argparse.ArgumentParser(description="Start server with pre-flight checks")
    parser.add_argument("--check-only", action="store_true", help="Run checks only")
    parser.add_argument("--skip-db", action="store_true", help="Skip database checks")
    parser.add_argument("--no-auto-migrate", action="store_true", help="Do not auto-apply migrations")
    parser.add_argument("--host", default="0.0.0.0", help="Server host")
    parser.add_argument("--port", type=int, default=8000, help="Server port")
    parser.add_argument("--reload", action="store_true", help="Enable reload")
    parser.add_argument("--workers", type=int, default=1, help="Number of workers")

    args = parser.parse_args()

    ok = run_checks(skip_db=args.skip_db, auto_migrate=not args.no_auto_migrate)
    print()

    if not ok:
        print_header("CHECKS FAILED")
        print_error("Fix the errors above before starting the server")
        return 1

    print_header("CHECKS PASSED")
    if args.check_only:
        print_info("--check-only enabled; not starting server")
        return 0

    try:
        import uvicorn
        from app.core.config import get_settings

        settings = get_settings()
        print_header("STARTING SERVER")
        print_info(f"Host: {args.host}")
        print_info(f"Port: {args.port}")
        print_info(f"Environment: {settings.environment}")
        print_info(f"Reload: {args.reload}")

        if args.workers > 1 and args.reload:
            print_warning("Reload with multiple workers is not recommended; using 1 worker")
            args.workers = 1

        uvicorn.run(
            "app.main:app",
            host=args.host,
            port=args.port,
            reload=args.reload,
            workers=args.workers if not args.reload else 1,
            log_level="info",
        )
        return 0
    except KeyboardInterrupt:
        print_warning("Server interrupted by user")
        return 0
    except Exception as exc:  # noqa: BLE001
        print_error(f"Failed to start server: {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
