def safe_division(numerator: float, denominator: float) -> float:
    """Return zero when denominator is zero."""
    if denominator == 0:
        return 0.0
    return numerator / denominator
