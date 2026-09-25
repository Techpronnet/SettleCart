import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from starlette.exceptions import HTTPException as StarletteHTTPException
from slowapi.errors import RateLimitExceeded
from typing import Any

logger = logging.getLogger(__name__)

class AppException(Exception):
    def __init__(self, status_code: int, detail: str, error_code: str = "error"):
        self.status_code = status_code
        self.detail = detail
        self.error_code = error_code

class NotFoundException(AppException):
    def __init__(self, detail: str = "Not Found", error_code: str = "not_found"):
        super().__init__(status_code=404, detail=detail, error_code=error_code)

class BadRequestException(AppException):
    def __init__(self, detail: str = "Bad Request", error_code: str = "bad_request"):
        super().__init__(status_code=400, detail=detail, error_code=error_code)

class UnauthorizedException(AppException):
    def __init__(self, detail: str = "Unauthorized", error_code: str = "unauthorized"):
        super().__init__(status_code=401, detail=detail, error_code=error_code)

class ForbiddenException(AppException):
    def __init__(self, detail: str = "Forbidden", error_code: str = "forbidden"):
        super().__init__(status_code=403, detail=detail, error_code=error_code)

class ConflictException(AppException):
    def __init__(self, detail: str = "Conflict", error_code: str = "conflict"):
        super().__init__(status_code=409, detail=detail, error_code=error_code)

def register_exception_handlers(app: FastAPI):
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.error_code,
                    "message": exc.detail
                }
            }
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "validation_error",
                    "message": "Invalid request parameters or payload",
                    "details": jsonable_encoder(exc.errors())
                }
            }
        )

    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
        return JSONResponse(
            status_code=429,
            content={
                "error": {
                    "code": "rate_limit_exceeded",
                    "message": f"Rate limit exceeded: {exc.detail}",
                }
            },
            headers={"Retry-After": "60"},
        )

    @app.exception_handler(StarletteHTTPException)
    async def starlette_http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": "http_error",
                    "message": exc.detail
                }
            }
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception(f"Unhandled exception on {request.method} {request.url.path}: {exc}")
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "internal_server_error",
                    "message": "An unexpected internal server error occurred"
                }
            }
        )
