import axios from 'axios';

const FALLBACK_URL = 'https://671be2342c842d92c381a1a2.mockapi.io/api/v1';

export const apiClient = axios.create({
  baseURL:
    process.env.EXPO_PUBLIC_MOCK_API_URL || process.env.EXPO_PUBLIC_MOCKAPI_URL || FALLBACK_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});
