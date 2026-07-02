import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Storage from '../utils/storage';
import { User, Role } from '../types';
import * as api from '../api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  balance: number;
  login: (email: string, password: string, role?: Role) => Promise<void>;
  register: (name: string, email: string, password: string, role: Role) => Promise<void>;
  logout: () => Promise<void>;
  refreshBalance: () => Promise<number>;
  updateBalance: (next: number | ((current: number) => number)) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getProfilePayload(profile: any) {
  return profile?.data?.user || profile?.data?.profile || profile?.user || profile?.profile || profile?.data || profile || {};
}

function extractBalance(profile: any, fallback = 0) {
  const payload = getProfilePayload(profile);
  const raw = payload.balance ?? payload.points ?? payload.walletBalance ?? profile?.balance ?? profile?.points ?? fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mergeProfileUser(current: User | null, profile: any, nextBalance: number): User | null {
  const payload = getProfilePayload(profile);
  const base = current || (payload.userId || payload._id || payload.id ? {
    id: payload.userId || payload._id || payload.id,
    name: payload.fullName || payload.name || 'User',
    role: payload.role || 'SPECTATOR',
    email: payload.email,
  } as User : null);

  if (!base) return null;

  return {
    ...base,
    id: payload.userId || payload._id || payload.id || base.id,
    name: payload.fullName || payload.name || base.name,
    role: payload.role || base.role,
    email: payload.email || base.email,
    phone: payload.phone || base.phone,
    status: payload.status || base.status,
    balance: nextBalance,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refreshBalance = async () => {
    const profile = await api.getMyProfile();
    const nextBalance = extractBalance(profile, balance);
    setBalance(nextBalance);
    setUser((current) => {
      const merged = mergeProfileUser(current, profile, nextBalance);
      if (merged) {
        Storage.setItemAsync('user', JSON.stringify(merged)).catch(() => {});
      }
      return merged;
    });
    return nextBalance;
  };

  const updateBalance = (next: number | ((current: number) => number)) => {
    setBalance((current) => {
      const value = typeof next === 'function' ? next(current) : next;
      const normalized = Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : current;
      setUser((currentUser) => {
        if (!currentUser) return currentUser;
        const updated = { ...currentUser, balance: normalized };
        Storage.setItemAsync('user', JSON.stringify(updated)).catch(() => {});
        return updated;
      });
      return normalized;
    });
  };

  const loadStoredUser = async () => {
    try {
      const userStr = await Storage.getItemAsync('user');
      const token = await Storage.getItemAsync('accessToken');
      if (userStr && token) {
        const storedUser = JSON.parse(userStr);
        setUser(storedUser);
        setBalance(Number(storedUser.balance || 0));
        try {
          await refreshBalance();
        } catch {
          // Keep the stored session usable when profile refresh is unavailable.
        }
      }
    } catch (e) {
      console.error('Failed to load user', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStoredUser();
  }, []);

  const login = async (email: string, password: string, role?: Role) => {
    const session = await api.login({ email, password, role });
    await Storage.setItemAsync('accessToken', session.token);
    await Storage.setItemAsync('user', JSON.stringify(session.user));
    setUser(session.user);
    setBalance(Number(session.user.balance || 0));
    try {
      await refreshBalance();
    } catch {
      // Login should not fail only because profile refresh failed.
    }
  };

  const register = async (name: string, email: string, password: string, role: Role) => {
    const session = await api.register({ name, email, password, role });
    await Storage.setItemAsync('accessToken', session.token);
    await Storage.setItemAsync('user', JSON.stringify(session.user));
    setUser(session.user);
    setBalance(Number(session.user.balance || 0));
    try {
      await refreshBalance();
    } catch {
      // Registration should not fail only because profile refresh failed.
    }
  };

  const logout = async () => {
    await Storage.deleteItemAsync('accessToken');
    await Storage.deleteItemAsync('user');
    setUser(null);
    setBalance(0);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, balance, login, register, logout, refreshBalance, updateBalance }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
