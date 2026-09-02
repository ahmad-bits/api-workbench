# API Tester

The API Tester allows you to configure, execute, and benchmark HTTP requests.

---

## Request Configuration

- **Method**: Select from `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, or `OPTIONS`.
- **URL & Params**: Enter the endpoint URL. Query parameters sync automatically with the **Params** tab, where you can edit values or toggle them on and off with checkboxes.
- **Headers**: Add custom headers using key-value rows with enable/disable checkboxes.
- **Body**: Supports **JSON only**. Enter your JSON payload directly into the editor.
- **Auth**: Add authentication headers as key-value pairs (e.g., `Authorization` or `X-API-Key`).

---

## Sending & Benchmarking

- **Single Request**: Set **Runs** to `1 (Single)` and click **Send**.
- **Benchmark Mode**: Set **Runs** to `5`, `10`, `25`, `50`, or `100` and click **Run (<N>x)** to execute sequential requests and generate performance metrics.

---

## Inspecting Responses

### Single Request
- **Status & Latency**: Displays the HTTP status code, round-trip time in milliseconds, and payload size.
- **Views**:
  - **Pretty**: Formatted JSON.
  - **Raw**: Unformatted response body.
  - **Headers**: Searchable response headers table.
- **Actions**: Click **Copy** to copy the payload, **Download** to save it to a file, or **Save API** to store the endpoint in a workspace.

### Benchmark Results
- **Summary Metrics**: Shows Total Runs, Success Rate (%), Average Speed (ms), and Min/Max latency.
- **Status Distribution**: Badge breakdown of returned status codes.
- **Tabs**: View overall **Stats**, latest **Body**, latest **Headers**, or the run-by-run **Runs** table.
