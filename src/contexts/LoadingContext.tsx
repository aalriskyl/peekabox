'use client';

import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { LoadingSpinner } from '../components/ui/loading-spinner';

type FetchDataFunction = <T = unknown>(
  url: string, 
  options?: RequestInit
) => Promise<T>;

type LoadingContextType = {
  isLoading: boolean;
  error: string | null;
  isPageLoading: boolean;
  fetchData: FetchDataFunction;
  setLoading: (isLoading: boolean) => void;
  setPageLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
};

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Reset loading state when route changes
  useEffect(() => {
    setIsPageLoading(false);
  }, [pathname, searchParams]);

  const fetchData = useCallback(async <T = unknown,>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: T = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  // Set up route change events
  const setPageLoading = useCallback((loading: boolean) => {
    setIsPageLoading(loading);
  }, []);

  return (
    <LoadingContext.Provider 
      value={{ 
        isLoading, 
        error, 
        isPageLoading,
        fetchData, 
        setLoading,
        setPageLoading,
        setError 
      }}
    >
      {children}
      {isPageLoading && (
        <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
          <LoadingSpinner size="lg" />
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
