import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const BASE_URL =
  (Constants.expoConfig?.extra?.API_BASE_URL as string) ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  'http://10.0.2.2:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT token ─────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: normalize error messages ────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; errors?: any[] }>) => {
    if (error.response) {
      const message =
        error.response.data?.message ||
        `Request failed with status ${error.response.status}`;
      const normalized = new Error(message) as any;
      normalized.status = error.response.status;
      normalized.errors = error.response.data?.errors;
      return Promise.reject(normalized);
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timed out. Please check your connection.'));
    }

    return Promise.reject(new Error('Network error. Please check your connection.'));
  }
);

export default api;
