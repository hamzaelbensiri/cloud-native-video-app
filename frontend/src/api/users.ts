import { api } from '@/api/client';

export type Role = 'consumer' | 'creator' | 'admin';

export type ApiUser = {
  user_id: number;
  email: string;
  username: string;
  display_name?: string | null;
  role: Role;
};

export async function listUsers(skip = 0, limit = 100): Promise<ApiUser[]> {
  // trailing slash avoids Azure redirect/CORS surprises
  const { data } = await api.get<ApiUser[]>('/users/', { params: { skip, limit } });
  return data;
}

export async function updateUser(
  userId: number,
  changes: Partial<Pick<ApiUser, 'email' | 'display_name' | 'role'>>
): Promise<ApiUser> {
  const { data } = await api.put<ApiUser>(`/users/${userId}`, changes, {
    headers: { 'Content-Type': 'application/json' },
  });
  return data;
}

export async function deleteUser(userId: number): Promise<void> {
  await api.delete(`/users/${userId}`);
}

export async function createUserWithRole(payload: {
  email: string;
  username: string;
  password: string;
  role: Role;
}): Promise<ApiUser> {
  const { data } = await api.post<ApiUser>('/users/admin', payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  return data;
}

/** self-service role switch (consumer<->creator only) */
export async function setMyRole(role: 'consumer' | 'creator'): Promise<ApiUser> {
  const { data } = await api.post<ApiUser>('/users/me/role', { role }, {
    headers: { 'Content-Type': 'application/json' },
  });
  return data;
}
