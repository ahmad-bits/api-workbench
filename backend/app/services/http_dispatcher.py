import asyncio
import json
import time
from typing import Dict, Any, List, Optional
from urllib.parse import urlsplit, urlunsplit, parse_qsl
import httpx
from http import HTTPStatus
from collections import Counter

from app.schemas.request import (
    HttpRequestPayload,
    HttpResponsePayload,
    BenchmarkStats,
    StatusCodeStat,
    BatchHttpResponsePayload,
)


class HttpDispatcherService:
    @staticmethod
    def _prepare_request_components(request_data: HttpRequestPayload):
        method = request_data.method.upper().strip()
        raw_url = request_data.url.strip()

        if not raw_url.startswith("http://") and not raw_url.startswith("https://"):
            raw_url = f"https://{raw_url}"

        headers = {k: v for k, v in request_data.headers.items() if k.strip()}

        parsed_url = urlsplit(raw_url)
        url_query_tuples = parse_qsl(parsed_url.query, keep_blank_values=True)

        merged_params: Dict[str, str] = {}
        for k, v in url_query_tuples:
            clean_k = k.strip()
            if clean_k:
                merged_params[clean_k] = v

        for k, v in request_data.params.items():
            clean_k = k.strip()
            if clean_k:
                merged_params[clean_k] = v

        clean_url = urlunsplit((
            parsed_url.scheme,
            parsed_url.netloc,
            parsed_url.path,
            "",
            parsed_url.fragment,
        ))

        content = None
        json_data = None

        if request_data.body and method not in ["GET", "HEAD"]:
            if request_data.body_type == "json":
                try:
                    json_data = json.loads(request_data.body)
                    if "content-type" not in [h.lower() for h in headers]:
                        headers["Content-Type"] = "application/json"
                except json.JSONDecodeError:
                    content = request_data.body.encode("utf-8")
            else:
                content = request_data.body.encode("utf-8")

        return method, clean_url, headers, merged_params, content, json_data

    @staticmethod
    async def _execute_single(
        client: httpx.AsyncClient,
        method: str,
        url: str,
        headers: Optional[Dict[str, str]],
        params: Optional[Dict[str, str]],
        content: Optional[bytes],
        json_data: Any,
        timeout_seconds: float,
    ) -> HttpResponsePayload:
        start_time = time.perf_counter()

        try:
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
            resp_headers: Dict[str, str] = {k: v for k, v in response.headers.items()}

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
                error=f"Request timed out after {timeout_seconds}s: {str(exc)}",
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

    async def dispatch(self, request_data: HttpRequestPayload) -> HttpResponsePayload:
        method, url, headers, params, content, json_data = self._prepare_request_components(request_data)

        async with httpx.AsyncClient(
            timeout=httpx.Timeout(request_data.timeout_seconds, connect=10.0),
            follow_redirects=True,
            verify=True,
        ) as client:
            return await self._execute_single(
                client=client,
                method=method,
                url=url,
                headers=headers,
                params=params,
                content=content,
                json_data=json_data,
                timeout_seconds=request_data.timeout_seconds,
            )

    async def dispatch_batch(self, request_data: HttpRequestPayload) -> BatchHttpResponsePayload:
        count = max(1, min(100, request_data.request_count))
        method, url, headers, params, content, json_data = self._prepare_request_components(request_data)

        semaphore = asyncio.Semaphore(20)

        async def run_one(client: httpx.AsyncClient) -> HttpResponsePayload:
            async with semaphore:
                return await self._execute_single(
                    client=client,
                    method=method,
                    url=url,
                    headers=headers,
                    params=params,
                    content=content,
                    json_data=json_data,
                    timeout_seconds=request_data.timeout_seconds,
                )

        limits = httpx.Limits(max_connections=50, max_keepalive_connections=20)
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(request_data.timeout_seconds, connect=10.0),
            follow_redirects=True,
            verify=True,
            limits=limits,
        ) as client:
            tasks = [run_one(client) for _ in range(count)]
            results: List[HttpResponsePayload] = await asyncio.gather(*tasks)

        total_requests = len(results)
        successful_requests = sum(
            1 for r in results if 200 <= r.status_code < 400 and not r.error
        )
        failed_requests = total_requests - successful_requests
        success_rate = round((successful_requests / total_requests) * 100, 1) if total_requests > 0 else 0.0

        latencies = [r.elapsed_ms for r in results]
        avg_latency_ms = round(sum(latencies) / len(latencies), 2) if latencies else 0.0
        min_latency_ms = min(latencies) if latencies else 0.0
        max_latency_ms = max(latencies) if latencies else 0.0

        status_counts = Counter(r.status_code for r in results)
        status_code_distribution = {code: count for code, count in status_counts.items()}

        status_codes_list: List[StatusCodeStat] = []
        for code, c in sorted(status_counts.items(), key=lambda x: x[0]):
            matching_resp = next((r for r in results if r.status_code == code), None)
            text = matching_resp.status_text if matching_resp else "Unknown Status"
            pct = round((c / total_requests) * 100, 1)
            status_codes_list.append(
                StatusCodeStat(
                    status_code=code,
                    status_text=text,
                    count=c,
                    percentage=pct,
                )
            )

        stats = BenchmarkStats(
            total_requests=total_requests,
            successful_requests=successful_requests,
            failed_requests=failed_requests,
            success_rate=success_rate,
            avg_latency_ms=avg_latency_ms,
            min_latency_ms=min_latency_ms,
            max_latency_ms=max_latency_ms,
            status_code_distribution=status_code_distribution,
            status_codes=status_codes_list,
        )

        latest_response = results[-1] if results else HttpResponsePayload(
            status_code=0, status_text="No response", headers={}, data=None, is_json=False, size_bytes=0, elapsed_ms=0.0
        )

        return BatchHttpResponsePayload(
            stats=stats,
            results=results,
            latest_response=latest_response,
        )


http_dispatcher = HttpDispatcherService()
