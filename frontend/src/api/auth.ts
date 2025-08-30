import { api, toFormUrlEncoded } from '@/api/client';

export type Role = 'consumer' | 'creator' | 'admin';
export type User = {
  user_id: number;
  email: string;
  username: string;
  role: Role;
};

type LoginResponse = {
  access_token: string;
  token_type: 'bearer' | string;
 
  user?: User;
};

export async function login(email: string, password: string): Promise<LoginResponse> {
  const body = toFormUrlEncoded({ username: email, password });
  const { data } = await api.post<LoginResponse>('/auth/login', body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return data;
}

export async function register(email: string, username: string, password: string): Promise<User> {
  const { data } = await api.post<User>('/auth/register', { email, username, password });
  return data;
}

export async function me(): Promise<User> {
  const { data } = await api.get<User>('/auth/me');
  return data;
}
