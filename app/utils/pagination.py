from dataclasses import dataclass

from fastapi import Query


@dataclass
class PaginationParams:
    """Inject as ``pagination: PaginationParams = Depends()``."""

    skip: int = Query(0, ge=0, description="Number of records to skip")
    limit: int = Query(20, ge=1, le=100, description="Max records to return")
