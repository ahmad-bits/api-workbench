export interface HealthResponse {
  status: string;
  app: string;
  version: string;
  environment: string;
  timestamp: string;
}

export interface ApiError {
  message: string;
  status?: number;
}
