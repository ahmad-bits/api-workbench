import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
import httpx

from app.main import app
from app.schemas.request import HttpRequestPayload
from app.services.http_dispatcher import HttpDispatcherService


@pytest.fixture
def client():
    return TestClient(app)


def test_prepare_components_deduplicate_identical_param():
    """URL and Params contain identical key=value: city=Lahore."""
    payload = HttpRequestPayload(
        method="GET",
        url="https://api.example.com/data?city=Lahore",
        params={"city": "Lahore"},
        headers={},
    )
    method, clean_url, headers, params, content, json_data = (
        HttpDispatcherService._prepare_request_components(payload)
    )

    assert clean_url == "https://api.example.com/data"
    assert params == {"city": "Lahore"}
    assert list(params.keys()) == ["city"]


def test_prepare_components_override_with_params_section():
    """URL has city=Lahore, Params has city=Karachi. Params section value must win."""
    payload = HttpRequestPayload(
        method="GET",
        url="https://api.example.com/data?city=Lahore",
        params={"city": "Karachi"},
        headers={},
    )
    method, clean_url, headers, params, content, json_data = (
        HttpDispatcherService._prepare_request_components(payload)
    )

    assert clean_url == "https://api.example.com/data"
    assert params == {"city": "Karachi"}
    assert len(params) == 1


def test_prepare_components_multiple_mixed_params():
    """URL has city=Lahore&format=json, Params has city=Karachi&page=2."""
    payload = HttpRequestPayload(
        method="GET",
        url="https://api.example.com/data?city=Lahore&format=json",
        params={"city": "Karachi", "page": "2"},
        headers={"Accept": "application/json"},
    )
    method, clean_url, headers, params, content, json_data = (
        HttpDispatcherService._prepare_request_components(payload)
    )

    assert clean_url == "https://api.example.com/data"
    assert params == {"city": "Karachi", "format": "json", "page": "2"}
    assert len(params) == 3


def test_prepare_components_url_duplicate_keys():
    """URL contains duplicate keys in query string: city=Lahore&city=Karachi."""
    payload = HttpRequestPayload(
        method="GET",
        url="https://api.example.com/data?city=Lahore&city=Karachi",
        params={},
        headers={},
    )
    method, clean_url, headers, params, content, json_data = (
        HttpDispatcherService._prepare_request_components(payload)
    )

    assert clean_url == "https://api.example.com/data"
    assert params == {"city": "Karachi"}
    assert len(params) == 1


def test_dispatch_endpoint_query_deduplication(client):
    """Test the /api/v1/requests/dispatch endpoint handles deduplication without throwing error."""
    # Mock httpx AsyncClient request to inspect called arguments
    with patch("httpx.AsyncClient.request", new_callable=AsyncMock) as mock_req:
        mock_response = httpx.Response(
            status_code=200,
            json={"message": "ok"},
            headers={"content-type": "application/json"},
            request=httpx.Request("GET", "https://api.example.com/data"),
        )
        mock_req.return_value = mock_response

        response = client.post(
            "/api/v1/requests/dispatch",
            json={
                "method": "GET",
                "url": "https://api.example.com/data?city=Lahore",
                "params": {"city": "Lahore"},
                "headers": {},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status_code"] == 200

        # Verify httpx was called with clean URL and deduplicated params
        mock_req.assert_called_once()
        call_kwargs = mock_req.call_args.kwargs
        assert call_kwargs["url"] == "https://api.example.com/data"
        assert call_kwargs["params"] == {"city": "Lahore"}
