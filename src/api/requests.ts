import { ApiError } from './api-error';
import { apiGet, apiPost } from './http-client';
import type { ServiceName } from './services';

/**
 * Legacy creation input retained for the current `useCreateRequest` hook and
 * Vehicle Details caller until D4/D5 switch them to the tracked contract.
 *
 * Deliberately left unchanged: the tracked contract below keeps every field
 * required instead of weakening this type with optional channel/coordinates.
 */
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

/** The only approved tracked-request channels. Channel is data, never status. */
export type RequestChannel = 'app' | 'whatsapp' | 'phone';

/**
 * Tracked creation body for the canonical `POST /api/mobile/v1/requests`.
 *
 * Every field is required by design: a tracked request without a channel or
 * without coordinates is not a valid request. `userId`, `status` and
 * `platform` are intentionally absent — identity comes from the authenticated
 * AppUser and the lifecycle is server-owned.
 *
 * Note: TypeScript's structural typing cannot forbid extra properties on a
 * non-literal variable, but object literals containing those keys are rejected
 * by excess-property checking, and the backend rejects them as `missing`.
 */
export type CreateTrackedServiceRequestInput = {
  vehicleId: number;
  driverId: number;
  services: number[];
  channel: RequestChannel;
  latitude: number;
  longitude: number;
};

/** Driver summary embedded in the C4 response (never credentials). */
export type TrackedServiceRequestDriver = {
  id: number;
  name: string;
  phoneNum: string | null;
};

/** Service summary embedded in the C4 response. */
export type TrackedServiceRequestService = {
  id: number;
  name: ServiceName;
};

/**
 * C4 response `data` for a successful create/replay.
 *
 * Mirrors `App\Http\Resources\Mobile\ServiceRequestResource` exactly:
 * - `driverId` is serialised as a string (unlike the numeric create input),
 *   or `null` when no driver is attached.
 * - `vehicleId` and `driver` are nullable for historical rows.
 * - `createdAt` uses the backend's `optional(...)->toJSON()` form.
 * - `status` is server-owned. On creation it is `pending` for `app` and
 *   `contact_initiated` for `whatsapp`/`phone`; later lifecycle values are not
 *   narrowed here because the client never writes status.
 */
export type TrackedServiceRequestData = {
  id: number;
  _id: string;
  channel: RequestChannel;
  status: string;
  vehicleId: number | null;
  driverId: string | null;
  driver: TrackedServiceRequestDriver | null;
  services: TrackedServiceRequestService[];
  createdAt: string | null;
};

/** Standard mobile envelope: `{ success, message, data, errors }`. */
export type CreateTrackedServiceRequestResult = {
  success: boolean;
  message: string;
  data: TrackedServiceRequestData;
  errors: unknown;
};

/**
 * Create a tracked request through the single canonical v1 endpoint.
 *
 * Additive: the legacy `createServiceRequest` above remains the active path
 * until D4/D5 migrate the hook and screen. The relative `'requests'` path
 * resolves under the existing `/api/mobile/v1/` namespace — no new endpoint
 * and no Request v2 API. There is deliberately no coordinate-less fallback.
 */
export function createTrackedServiceRequest(
  input: CreateTrackedServiceRequestInput,
  idempotencyKey: string,
): Promise<CreateTrackedServiceRequestResult> {
  return apiPost<CreateTrackedServiceRequestResult, CreateTrackedServiceRequestInput>(
    'requests',
    input,
    {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    },
  );
}

/* -------------------------------------------------------------------------- */
/* B3.3 — My Requests read data layer                                          */
/* -------------------------------------------------------------------------- */

/** Default and ceiling documented in the approved B3.2 pagination contract. */
export const MY_REQUESTS_DEFAULT_PER_PAGE = 20;
export const MY_REQUESTS_MAX_PER_PAGE = 50;

export type MyRequestVehicleSummary = {
  labelNumber: string | null;
  modelName: string | null;
};

export type MyRequestServiceSummary = {
  id: number;
  name: ServiceName;
};

/**
 * Exact list allowlist emitted by `Mobile\MyRequestSummaryResource`.
 *
 * Deliberately absent: coordinates, driver phone, customer identity,
 * idempotency keys, status history, reason data, transitions and audit actors.
 */
export type MyRequestListItem = {
  id: number;
  channel: RequestChannel;
  status: string;
  createdAt: string | null;
  vehicle_summary: MyRequestVehicleSummary | null;
  services_summary: MyRequestServiceSummary[];
};

export type MyRequestsMetaData = {
  totalCount: number;
  currentCount: number;
  currentPage: number;
  itemsPerPage: number;
  lastPage: number;
};

export type MyRequestsResponse = {
  success: boolean;
  message: string;
  data: {
    list: MyRequestListItem[];
    metaData: MyRequestsMetaData;
  } | null;
  errors: unknown;
};

export type MyRequestVehicleDetail = MyRequestVehicleSummary & {
  type: string | null;
  status: string | null;
  workStatus: string | null;
};

/** Only toStatus + createdAt are ever present in the public timeline. */
export type MyRequestTimelineEntry = {
  toStatus: string;
  createdAt: string | null;
};

/**
 * Detail allowlist. `owner_coords` is NULL for historical requests with no
 * saved snapshot; individual missing components are also NULL. Never inferred.
 */
export type MyRequestDetail = MyRequestListItem & {
  vehicle: MyRequestVehicleDetail | null;
  provider_name: string | null;
  provider_phone: string | null;
  owner_coords: {
    latitude: number | null;
    longitude: number | null;
  } | null;
  timeline: MyRequestTimelineEntry[];
};

export type MyRequestDetailsResponse = {
  success: boolean;
  message: string;
  data: MyRequestDetail | null;
  errors: unknown;
};

export type MyRequestsQuery = {
  page?: number;
  perPage?: number;
};

function toPositiveInteger(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
    ? value
    : fallback;
}

/** Shared by the API functions and hooks so query normalization has one owner. */
export function normalizeMyRequestsQuery(options: MyRequestsQuery = {}): Required<MyRequestsQuery> {
  return {
    page: toPositiveInteger(options.page, 1),
    perPage: Math.min(
      toPositiveInteger(options.perPage, MY_REQUESTS_DEFAULT_PER_PAGE),
      MY_REQUESTS_MAX_PER_PAGE,
    ),
  };
}

/**
 * `GET /api/mobile/v1/requests` — owner-scoped by the authenticated AppUser.
 *
 * No `userId` is accepted: Sanctum Bearer identity is the only ownership input.
 * Returns the standard `{ success, message, data, errors }` envelope with the
 * mobile `{ list, metaData }` pagination shape used by the other v1 lists.
 */
export function getMyRequests(options: MyRequestsQuery = {}): Promise<MyRequestsResponse> {
  const { page, perPage } = normalizeMyRequestsQuery(options);
  return apiGet<MyRequestsResponse>(`requests?page=${page}&perPage=${perPage}`);
}

/**
 * `GET /api/mobile/v1/requests/{id}` — owner-only detail.
 *
 * A foreign or nonexistent id produces HTTP 404 (ApiError with status 404);
 * existence is never distinguishable. Invalid ids fail locally without a call.
 */
export function getMyRequestDetails(requestId: number): Promise<MyRequestDetailsResponse> {
  if (!Number.isInteger(requestId) || requestId <= 0) {
    throw new ApiError('http', 'Invalid request id.');
  }
  return apiGet<MyRequestDetailsResponse>(`requests/${encodeURIComponent(String(requestId))}`);
}
