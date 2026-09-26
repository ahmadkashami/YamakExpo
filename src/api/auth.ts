import { apiPost } from './http-client';

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
  phone: string;
};

export type RegisteredUser = {
  id: number;
  _id: string;
  name: string;
  email: string;
  phone: string;
  isEmailVerified: boolean;
};

export type RegisterResponse = {
  success: boolean;
  message: string;
  data: {
    user?: RegisteredUser;
  } | null;
};

export function registerUser(payload: RegisterRequest): Promise<RegisterResponse> {
  return apiPost<RegisterResponse, RegisterRequest>('auth/signup', payload);
}
