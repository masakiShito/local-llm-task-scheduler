from dataclasses import dataclass
from typing import Iterable

from fastapi.responses import JSONResponse


@dataclass
class FieldError:
    field: str
    message_id: str
    message: str


@dataclass
class ApiError(Exception):
    status_code: int
    message_id: str
    message: str
    field_errors: Iterable[FieldError] | None = None


def error_response(error: ApiError) -> JSONResponse:
    field_errors_payload = []
    if error.field_errors:
        field_errors_payload = [
            {
                "field": field_error.field,
                "message_id": field_error.message_id,
                "message": field_error.message,
            }
            for field_error in error.field_errors
        ]
    return JSONResponse(
        status_code=error.status_code,
        content={
            "error": {
                "message_id": error.message_id,
                "message": error.message,
                "field_errors": field_errors_payload,
            }
        },
    )
