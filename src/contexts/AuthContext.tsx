'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LoadingSpinner } from '../components/ui/loading-spinner';

type User = {
  id: string;
  name: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
};

type AuthContextType = {
  user: User | null;
  login: (name: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Fetch current user data from the backend
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const { user: userData } = await response.json();
          if (userData) {
            const user: User = {
              id: userData.id,
              name: userData.name,
              password: userData.password,
              createdAt: new Date(userData.createdAt),
              updatedAt: new Date(userData.updatedAt)
            };
            setUser(user);
          }
        } else {
          // If the token is invalid, clear it
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('auth_token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname]);

  const login = async (name: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password }),
      });

      if (response.ok) {
        const { data } = await response.json();
        const { user: userData, token } = data;
        
        // Store the token in localStorage for persistence
        if (token) {
          localStorage.setItem('auth_token', token);
        }
        
        if (userData) {
          const user: User = {
            id: userData.id,
            name: userData.name,
            password: userData.password,
            createdAt: new Date(userData.createdAt),
            updatedAt: new Date(userData.updatedAt)
          };
          setUser(user);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      // Clear the stored token
      localStorage.removeItem('auth_token');
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
