from datetime import datetime


def utcnow() -> datetime:
    """Wrapper around datetime.utcnow for easier mocking in tests."""
    return datetime.utcnow()
