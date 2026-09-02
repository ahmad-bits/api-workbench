# Mock API Engine

Create and host simulated HTTP endpoints that can be called publicly.

## Creating a Mock

1. In **Mock APIs**, click **+ New Mock**.
2. Fill in the endpoint fields:
   * **Method**: GET, POST, PUT, PATCH, DELETE, HEAD, or OPTIONS.
   * **Path**: Route path (e.g. `/api/v1/users`).
   * **Status Code**: Response status code (e.g. 200, 201, 400, 404).
   * **Response Delay**: Millisecond delay before responding (default is 0 ms).
   * **Authentication**: Choose `None`, `API Key`, or `Bearer Token`.
     * API Key checks the specified header and value.
     * Bearer Token expects `Authorization: Bearer <token>`.
     * Missing or incorrect credentials return `401 Unauthorized`.
   * **Response Headers**: Custom headers to return.
   * **Response Body**: JSON payload returned by the mock.
3. Click **Create Endpoint** to save.

## Using & Managing Mocks

* **Public URL**: Each mock gets a public URL you can copy and call from any client.
* **Call Counter**: Tracks total requests received.
* **Test**: Click **Test** to load the endpoint and auth into the API Tester.
* **Edit / Delete**: Update mock settings or remove the endpoint.
