import axios from 'axios';

export class ApiError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export function handleApiError(error: unknown, fallbackMessage: string): never {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const details = error.response?.data;

    throw new ApiError(error.message || fallbackMessage, status, details);
  }

  if (error instanceof Error) {
    throw new ApiError(error.message || fallbackMessage);
  }

  throw new ApiError(fallbackMessage);
}
