import React from 'react';
import { useAuth } from '@/context/AuthContext';

type Role = 'consumer' | 'creator' | 'admin';

export function RoleGate({
  allow,
  children,
  fallback = null,
}: {
  allow: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { role } = useAuth();
  const norm = (role || '').toString().trim().toLowerCase();
  const ok = allow.map((r) => r.toLowerCase()).includes(norm as Role);
  return <>{ok ? children : fallback}</>;
}
