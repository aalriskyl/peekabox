'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useLoading } from '../contexts/LoadingContext';

export function useRouteChange() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setPageLoading } = useLoading();

  useEffect(() => {
    // Reset loading state when route changes complete
    setPageLoading(false);
  }, [pathname, searchParams, setPageLoading]);
}
