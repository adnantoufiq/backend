import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  _id: string;
  username: string;
  email: string;
  fcmToken?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  signup: async (data: {
    username: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> => {
    const res = await api.post('/auth/signup', data);
    return res.data.data;
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await api.post('/auth/login', data);
    return res.data.data;
  },

  getMe: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res.data.data.user;
  },

  updateFcmToken: async (fcmToken: string): Promise<void> => {
    await api.put('/auth/fcm-token', { fcmToken });
  },

  saveSession: async (token: string, user: User): Promise<void> => {
    await AsyncStorage.multiSet([
      ['authToken', token],
      ['authUser', JSON.stringify(user)],
    ]);
  },

  clearSession: async (): Promise<void> => {
    await AsyncStorage.multiRemove(['authToken', 'authUser']);
  },

  getStoredUser: async (): Promise<User | null> => {
    const raw = await AsyncStorage.getItem('authUser');
    return raw ? JSON.parse(raw) : null;
  },

  getStoredToken: async (): Promise<string | null> => {
    return AsyncStorage.getItem('authToken');
  },
};
