import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/Spinner';

type Role = 'consumer' | 'creator' | 'admin';

export default function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { isAuthenticated, role, authReady } = useAuth();
  const location = useLocation();

  // ⏳ Wait until we know the auth state (prevents redirect on refresh)
  if (!authReady) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner label="Loading…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && roles.length > 0) {
    const norm = (role || '').toString().trim().toLowerCase();
    const allowed = roles.map((r) => r.toLowerCase()).includes(norm as Role);
    if (!allowed) {
      return (
        <div className="mx-auto max-w-xl p-6 text-sm text-neutral-300">
          <div className="rounded-2xl border border-brand-line bg-black/30 p-4">
            <p className="font-semibold text-white">Access denied</p>
            <p className="mt-1 text-neutral-400">
              This page requires: <b>{roles.join(', ')}</b>. Your role: <b>{norm || 'unknown'}</b>.
            </p>
          </div>
        </div>
      );
    }
  }

  return <Outlet />;
}
