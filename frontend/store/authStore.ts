import { create } from 'zustand';
// import axios from 'axios';

interface User {
  _id: string;
  name: string;
  email: string;
  token?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

import { api } from '../src/config';

const AUTH_URL = '/auth';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  signIn: async (email: string, password: string) => {
    try {
      const response = await api.post(`${AUTH_URL}/login`, { email, password });
      const user = response.data;
      localStorage.setItem('token', user.token);
      set({ user });
      return { error: null };
    } catch (error: any) {
      return { error: new Error(error.response?.data?.message || 'Login failed') };
    }
  },

  signUp: async (email: string, password: string, name: string) => {
    try {
      const response = await api.post(`${AUTH_URL}/signup`, { email, password, name });
      const user = response.data;
      localStorage.setItem('token', user.token);
      set({ user });
      return { error: null };
    } catch (error: any) {
      return { error: new Error(error.response?.data?.message || 'Signup failed') };
    }
  },

  signOut: async () => {
    localStorage.removeItem('token');
    set({ user: null });
  },

  initialize: async () => {
    set({ loading: true });
    const token = localStorage.getItem('token');

    if (token) {
      try {
        const response = await api.get(`${AUTH_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        set({ user: response.data });
      } catch (error) {
        console.error('Failed to fetch user', error);
        localStorage.removeItem('token');
        set({ user: null });
      }
    } else {
      set({ user: null });
    }
    set({ loading: false });
  },
}));
