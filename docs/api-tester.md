# API Tester

Execute and benchmark HTTP requests.

## Request Setup

* **Method**: GET, POST, PUT, PATCH, DELETE, HEAD, or OPTIONS.
* **URL & Params**: Enter the endpoint URL. Query parameters sync with the **Params** tab where they can be edited or toggled.
* **Headers**: Add key-value headers with checkboxes to enable or disable them.
* **Body**: JSON only. Enter the payload directly in the editor.
* **Auth**: Add authentication headers as key-value pairs (such as `Authorization` or `X-API-Key`).

## Sending & Benchmarking

* **Single Request**: Set **Runs** to `1 (Single)` and click **Send**.
* **Benchmark**: Select `5`, `10`, `25`, `50`, or `100` runs and click **Run (<N>x)** to measure performance over multiple requests.

## Inspecting Responses

* **Single Run**: View status code, latency (ms), response size, formatted JSON (Pretty), raw body, and response headers. Use **Copy**, **Download**, or **Save API** as needed.
* **Benchmark Results**: View overall stats (total runs, success rate, average latency, min/max time), status breakdown, and the detailed **Runs** table.
