import { create } from 'zustand';
import { User, AuthResponse } from '@atomic-chat/shared';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (auth: AuthResponse) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: (auth) => {
    localStorage.setItem('auth-token', auth.token);
    localStorage.setItem('auth-user', JSON.stringify(auth.user));
    set({ user: auth.user, token: auth.token });
  },
  logout: () => {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-user');
    set({ user: null, token: null });
  },
  loadFromStorage: () => {
    const token = localStorage.getItem('auth-token');
    const userStr = localStorage.getItem('auth-user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token });
      } catch (e) {
        console.error('Failed to parse user from storage', e);
      }
    }
  },
}));
