import json
import time
from typing import Dict, Any
import httpx
from http import HTTPStatus

from app.schemas.request import HttpRequestPayload, HttpResponsePayload


class HttpDispatcherService:
    """Service to asynchronously dispatch HTTP requests and capture diagnostics."""

    @staticmethod
    async def dispatch(request_data: HttpRequestPayload) -> HttpResponsePayload:
        method = request_data.method.upper().strip()
        url = request_data.url.strip()

        # Default protocol if missing
        if not url.startswith("http://") and not url.startswith("https://"):
            url = f"https://{url}"

        # Clean headers
        headers = {k: v for k, v in request_data.headers.items() if k.strip()}
        params = {k: v for k, v in request_data.params.items() if k.strip()}

        content = None
        json_data = None

        if request_data.body and method not in ["GET", "HEAD"]:
            if request_data.body_type == "json":
                try:
                    json_data = json.loads(request_data.body)
                    if "content-type" not in [h.lower() for h in headers]:
                        headers["Content-Type"] = "application/json"
                except json.JSONDecodeError:
                    # Fallback to raw content if JSON is malformed
                    content = request_data.body.encode("utf-8")
            else:
                content = request_data.body.encode("utf-8")

        start_time = time.perf_counter()

        try:
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(request_data.timeout_seconds, connect=10.0),
                follow_redirects=True,
                verify=True,
            ) as client:
                response = await client.request(
                    method=method,
                    url=url,
                    headers=headers if headers else None,
                    params=params if params else None,
                    content=content,
                    json=json_data,
                )

                elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
                size_bytes = len(response.content)

                # Process response headers
                resp_headers: Dict[str, str] = {k: v for k, v in response.headers.items()}

                # Determine if response is JSON
                is_json = False
                parsed_data: Any = None
                content_type = resp_headers.get("content-type", "").lower()

                if "application/json" in content_type:
                    try:
                        parsed_data = response.json()
                        is_json = True
                    except Exception:
                        parsed_data = response.text
                else:
                    # Try json parse anyway, fallback to text
                    try:
                        parsed_data = response.json()
                        is_json = True
                    except Exception:
                        parsed_data = response.text

                try:
                    status_text = HTTPStatus(response.status_code).phrase
                except ValueError:
                    status_text = "Unknown Status"

                return HttpResponsePayload(
                    status_code=response.status_code,
                    status_text=status_text,
                    headers=resp_headers,
                    data=parsed_data,
                    is_json=is_json,
                    size_bytes=size_bytes,
                    elapsed_ms=elapsed_ms,
                )

        except httpx.TimeoutException as exc:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return HttpResponsePayload(
                status_code=408,
                status_text="Request Timeout",
                headers={},
                data=None,
                is_json=False,
                size_bytes=0,
                elapsed_ms=elapsed_ms,
                error=f"Request timed out after {request_data.timeout_seconds}s: {str(exc)}",
            )

        except httpx.ConnectError as exc:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return HttpResponsePayload(
                status_code=502,
                status_text="Connection Error",
                headers={},
                data=None,
                is_json=False,
                size_bytes=0,
                elapsed_ms=elapsed_ms,
                error=f"Failed to connect to host: {str(exc)}",
            )

        except httpx.InvalidURL as exc:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return HttpResponsePayload(
                status_code=400,
                status_text="Invalid URL",
                headers={},
                data=None,
                is_json=False,
                size_bytes=0,
                elapsed_ms=elapsed_ms,
                error=f"Invalid URL provided: {str(exc)}",
            )

        except Exception as exc:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return HttpResponsePayload(
                status_code=500,
                status_text="Dispatch Error",
                headers={},
                data=None,
                is_json=False,
                size_bytes=0,
                elapsed_ms=elapsed_ms,
                error=f"An unexpected error occurred during dispatch: {str(exc)}",
            )


http_dispatcher = HttpDispatcherService()
