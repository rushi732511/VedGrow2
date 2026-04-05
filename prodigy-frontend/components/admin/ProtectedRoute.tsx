'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { PageLoader } from '@/components/ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect after we've finished checking the session
    // If we redirect during loading, authenticated users get bounced to login
    if (!isLoading && !isAuthenticated) {
      router.replace('/admin/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // While checking session — show a loader, not a redirect
  if (isLoading) {
    return <PageLoader />;
  }

  // Not authenticated — render nothing (redirect is in flight)
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated — render the protected content
  return <>{children}</>;
}