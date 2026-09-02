# API Workbench

API Workbench is a fast, full-stack developer platform designed to test HTTP requests, generate live mock REST servers, run latency benchmarks, and organize APIs in personal workspaces.

## Overview

API Workbench brings API development, testing, and mock servers into a single interface. Developers can test live endpoints without CORS limitations, simulate mock endpoints with configurable status codes and delays, run concurrent request benchmarks, and group saved APIs into organized workspace collections.

## Screenshots

### Landing Page
![API Workbench Landing Page](docs/screenshots/landing_page.png)

### Interactive API Tester & Benchmarking
![API Tester and Benchmarking](docs/screenshots/api_tester.png)

### Mock API Server
![Mock Server Manager](docs/screenshots/mock_api.png)

## Key Features

- **Interactive API Tester**: Send GET, POST, PUT, DELETE, and PATCH requests with custom headers, query parameters, authorization tokens, and JSON request bodies.
- **Live Mock Server**: Create simulated REST endpoints with custom status codes, simulated response latency, header authorization, and JSON response payloads served at `/mock/*`.
- **Concurrency Benchmarking**: Dispatch batch requests in parallel to monitor endpoint latency metrics (minimum, average, maximum) and evaluate throughput and success rates.
- **Workspaces & API Collections**: Group and manage saved endpoints into organized workspace cards with color-coded themes, search filters, and one-click testing.
- **User Authentication**: Secure JWT-based authentication with OTP email verification, password resets, and account management.

## Main Capabilities

- **CORS-Free Dispatcher**: Proxies target requests safely through the backend engine to avoid browser cross-origin blocks.
- **Benchmark Engine**: Measures throughput and response time distributions over repeated parallel executions.
- **Mock Routing Engine**: Dynamic path matching that serves user-defined mock endpoints with customizable status codes and simulated delays.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, React Router v7, Vanilla CSS
- **Backend**: FastAPI, Python 3.10+, Uvicorn, Pydantic v2, SQLAlchemy, HTTPX
- **Database & Security**: SQLite, PyJWT, Cryptography, Bcrypt

## Project Structure

```text
api-workbench/
├── backend/            # FastAPI application, database models, and services
│   ├── app/            # API routers, schemas, and business logic
│   ├── database/       # Local SQLite database file
│   └── tests/          # Pytest backend test suite
├── frontend/           # React and Vite client application
│   └── src/            # Components, contexts, pages, and styling
├── docs/screenshots/   # Application preview screenshots
└── scripts/            # Automation and startup scripts
```

## Getting Started

### Prerequisites

- Node.js (v18+) and npm
- Python (v3.10+)

### Backend Setup

1. Open a terminal and change to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` configuration file from the example:
   ```bash
   cp .env.example .env
   ```

5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

The backend server will run at `http://127.0.0.1:8000`. Interactive OpenAPI documentation is accessible at `http://127.0.0.1:8000/docs`.

### Frontend Setup

1. Open a separate terminal and change to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

The frontend application will run at `http://localhost:5173`.

### Quick Start (Windows)

To start both the FastAPI backend and Vite frontend together, run:
```bat
./scripts/start_dev.bat
```

## Configuration & Environment Variables

The backend configuration is managed through `backend/.env`. Key parameters include:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `sqlite:///./database/api_workbench.db` | Path to the SQLite database |
| `JWT_SECRET_KEY` | `your_secure_random_jwt_secret_key_here` | Secret key used for signing authentication tokens |
| `JWT_ALGORITHM` | `HS256` | Algorithm for JWT generation |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Token expiration time in minutes |
| `BACKEND_CORS_ORIGINS` | `["http://localhost:5173", "http://127.0.0.1:5173"]` | Allowed frontend origin URLs |
| `EMAIL_HOST` / `EMAIL_PORT` | `""` / `587` | SMTP settings for email OTP delivery (printed to server log if unconfigured) |
