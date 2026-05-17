from typing import Optional

from fastapi import HTTPException
from starlette.status import (
    HTTP_400_BAD_REQUEST,
    HTTP_404_NOT_FOUND,
    HTTP_409_CONFLICT,
    HTTP_422_UNPROCESSABLE_CONTENT,
    HTTP_429_TOO_MANY_REQUESTS,
    HTTP_500_INTERNAL_SERVER_ERROR,
    HTTP_502_BAD_GATEWAY,
    HTTP_503_SERVICE_UNAVAILABLE,
)


class AppException(HTTPException):
    def __init__(self, status_code: int, code: int, message: str, detail: Optional[str] = None):
        super().__init__(status_code=status_code, detail=detail or message)
        self.code = code
        self.message = message


class BadRequestError(AppException):
    def __init__(self, message: str = "参数错误", code: int = 40000, detail: str = ""):
        super().__init__(HTTP_400_BAD_REQUEST, code, message, detail)


class NotFoundError(AppException):
    def __init__(self, message: str = "资源不存在", code: int = 40400, detail: str = ""):
        super().__init__(HTTP_404_NOT_FOUND, code, message, detail)


class ConflictError(AppException):
    def __init__(self, message: str = "资源冲突", code: int = 40900, detail: str = ""):
        super().__init__(HTTP_409_CONFLICT, code, message, detail)


class LLMOutputError(AppException):
    def __init__(self, message: str = "LLM 输出解析失败", code: int = 42200, detail: str = ""):
        super().__init__(HTTP_422_UNPROCESSABLE_CONTENT, code, message, detail)


class RateLimitError(AppException):
    def __init__(self, message: str = "请求过于频繁", code: int = 42900, detail: str = ""):
        super().__init__(HTTP_429_TOO_MANY_REQUESTS, code, message, detail)


class InternalError(AppException):
    def __init__(self, message: str = "服务内部错误", code: int = 50000, detail: str = ""):
        super().__init__(HTTP_500_INTERNAL_SERVER_ERROR, code, message, detail)


class LLMAPIError(AppException):
    def __init__(self, message: str = "LLM API 调用失败", code: int = 50200, detail: str = ""):
        super().__init__(HTTP_502_BAD_GATEWAY, code, message, detail)


class ServiceUnavailableError(AppException):
    def __init__(self, message: str = "服务暂不可用", code: int = 50300, detail: str = ""):
        super().__init__(HTTP_503_SERVICE_UNAVAILABLE, code, message, detail)
