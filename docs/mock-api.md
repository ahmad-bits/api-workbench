# Mock API Engine

The Mock API Engine allows you to create and host simulated HTTP endpoints that can be called publicly.

---

## Creating a Mock

1. In **Mock APIs**, click **+ New Mock**.
2. Configure the endpoint:
   - **Method**: Select the HTTP method (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, or `OPTIONS`).
   - **Path**: Set the route subpath (e.g., `/api/v1/users`).
   - **Status Code**: Select the returned HTTP status code (e.g., `200`, `201`, `400`, `404`).
   - **Response Delay**: Set a custom response delay in milliseconds (default is `0 ms` for immediate response).
   - **Authentication**: Choose between `None` (default), `API Key`, or `Bearer Token`.
     - *API Key*: Requires incoming requests to match the configured header name and secret value.
     - *Bearer Token*: Requires incoming requests to supply `Authorization: Bearer <token>`.
     - Missing or incorrect credentials return `401 Unauthorized`.
   - **Response Headers**: Add custom headers (e.g., `Content-Type: application/json`).
   - **Response Body**: Enter the JSON response payload.
3. Click **Save Mock** to deploy the endpoint.

---

## Public Mock Endpoints

Each mock generates a public URL that you can call from any application.

- **Call Counter**: Tracks the total number of requests received on each mock card.
- **Copy URL**: Click **Copy** on any mock card to copy its live public URL.

---

## Managing Mocks

- **Search**: Filter mocks by name, path, or method.
- **Edit**: Update the route, status code, delay, authentication, headers, or response body.
- **Test**: Click **Test** on a mock card to load its URL and method into the API Tester.
- **Delete**: Permanently remove the mock endpoint.
