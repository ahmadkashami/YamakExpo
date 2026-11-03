import { apiPost } from './http-client';
import type { Service } from './services';

export type CreateServiceRequestInput = {
  vehicleId: number;
  driverId: number;
  services: number[];
};

export type CreateServiceRequestResult = {
  success: boolean;
  message: string;
  data: unknown;
  errors: unknown;
};

export function createServiceRequest(
  input: CreateServiceRequestInput,
  idempotencyKey: string,
): Promise<CreateServiceRequestResult> {
  return apiPost<CreateServiceRequestResult, CreateServiceRequestInput>(
    'requests',
    input,
    {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    },
  );
}
