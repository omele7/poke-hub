import axios from 'axios';

export const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';
const REQUEST_TIMEOUT_MS = 10000;

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? POKEAPI_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const method = error.config?.method?.toUpperCase() ?? 'UNKNOWN_METHOD';
      const url = error.config?.url ?? 'UNKNOWN_URL';
      const status = error.response?.status ?? 'NO_STATUS';

      console.error(
        `[PokeAPI] ${method} ${url} -> ${status}`,
        error.response?.data ?? error.message,
      );
    } else {
      console.error('[PokeAPI] Unexpected error', error);
    }

    return Promise.reject(error);
  },
);
