"""Optional symmetric encryption helpers for sensitive fields."""

from typing import Protocol


class Encryptor(Protocol):
    def encrypt(self, value: str) -> str: ...

    def decrypt(self, value: str) -> str: ...


def noop_encryptor() -> Encryptor:
    class _NoopEncryptor:
        def encrypt(self, value: str) -> str:
            return value

        def decrypt(self, value: str) -> str:
            return value

    return _NoopEncryptor()


__all__ = ["noop_encryptor", "Encryptor"]
