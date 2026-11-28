import { apiGet } from './http-client';

export type MyCar = {
  id: number;
  _id: string;
  make: string | null;
  model: string | null;
  userId: string;
  year: string | null;
  type: string;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type MyCarsResponse = {
  success: boolean;
  message: string;
  data: MyCar[];
  errors: null;
};

/** Authenticated GET /api/mobile/v1/user-cars; data is an array, not a paged list. */
export function getMyCars(): Promise<MyCarsResponse> {
  return apiGet<MyCarsResponse>('user-cars');
}
