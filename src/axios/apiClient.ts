import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_MOCKAPI_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});
