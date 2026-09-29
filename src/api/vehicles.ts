import { apiGet } from './http-client';
import type { Service } from './services';

/**
 * `GET /vehicles` — public (registered before the `auth:sanctum` group).
 *
 * Contract verified live (slice 3A): envelope `{ success, message, data: { list,
 * metaData }, errors }`, hardcoded filters `work_status = 'online'` +
 * `current_driver_id IS NOT NULL`, and a `distance` field that is Euclidean
 * degrees — NOT kilometres (the legacy app mislabelled it "KM"). No `limit` is
 * ever sent here: the backend defaults to 10 and `limit=0`/non-numeric values
 * return HTTP 500.
 */

export type VehicleGeoLocation = {
  latitude: number;
  longitude: number;
  /** Backend emits `[longitude, latitude]` (GeoJSON order). */
  coordinates: [number, number];
};

/** Exact output of `Dashboard\CompanyController::companyResource()`. */
export type CompanyResource = {
  id: number;
  _id: string;
  name: { en: string; ar: string };
  phone: string | null;
  email: string | null;
  logo: string | null;
  status: string;
  address: string | null;
  description: string | null;
  createdAt: string | null;
};

/** Exact output of `Dashboard\BranchController::branchResource()`. */
export type BranchResource = {
  id: number;
  _id: string;
  name: string;
  phone: string | null;
  companyId: string;
  logo: string | null;
  status: string;
  address: {
    countryId: string | null;
    stateId: string | null;
    cityId: string | null;
    block: string | null;
    street: string | null;
    zipCode: string | null;
  };
  geoLocation: {
    latitude: number;
    longitude: number;
  };
  /** `branch_service` ids as strings. */
  services: string[];
  createdAt: string | null;
};

/** Exact output of `Dashboard\DriverController::driverResource()`. */
export type DriverResource = {
  id: number;
  _id: string;
  status: string;
  name: string;
  email: string | null;
  photo: string | null;
  phoneNum: string | null;
  licenseExpiredAt: string | null;
  createdAt: string | null;
  branchId: string;
  branch: BranchResource | null;
  companyId: string;
  company: CompanyResource | null;
  vehicleId: string | null;
};

/** Exact output of `mobile.VehicleController::index()` per list item. */
export type Vehicle = {
  id: number;
  _id: string;
  status: string;
  companyId: string;
  company: CompanyResource | null;
  branchId: string;
  branch: BranchResource | null;
  drivers: DriverResource[];
  /** Reuses the services endpoint's `Service` shape — `serviceResource()` is identical. */
  services: Service[];
  createdAt: string | null;
  workStatus: string;
  lastActiveDate: string | null;
  currentDriver: DriverResource | null;
  iconMap: string | null;
  labelNumber: string | null;
  modelName: string | null;
  geoLocation: VehicleGeoLocation;
};

export type VehiclesMetaData = {
  totalCount: number;
  currentCount: number;
  currentPage: number;
  itemsPerPage: number;
  lastPage: number;
};

export type VehiclesResponse = {
  success: boolean;
  message: string;
  data: {
    list: Vehicle[];
    metaData: VehiclesMetaData;
  } | null;
  errors: null;
};

export type VehiclesQueryParams = {
  latitude?: number;
  longitude?: number;
};

/**
 * Fetches online vehicles. Coordinates are optional and only ever sent as a
 * finite PAIR — a lone or invalid coordinate is dropped entirely, so the
 * backend always receives either both or neither (never a latitude-only or
 * longitude-only request, never a non-finite string).
 */
export function getVehicles(params: VehiclesQueryParams = {}): Promise<VehiclesResponse> {
  const hasLatitude = typeof params.latitude === 'number' && Number.isFinite(params.latitude);
  const hasLongitude = typeof params.longitude === 'number' && Number.isFinite(params.longitude);
  const query =
    hasLatitude && hasLongitude ? `?latitude=${params.latitude}&longitude=${params.longitude}` : '';
  return apiGet<VehiclesResponse>(`vehicles${query}`);
}

/**
 * `GET /services/{service}/vehicles` — public (route-model-bound; unknown
 * service → 404), filter `work_status='online'` + `current_driver_id IS NOT
 * NULL` scoped to the service via `whereHas`, eager loads, optional Euclidean
 * `distance` sort, **no pagination**.
 *
 * CRITICAL envelope difference vs `GET /vehicles`: here `data` is a **bare
 * array** (`response()->success($vehicles)`, asserted by `MobileParityTest`
 * via `data.0.*`), NOT `{ list, metaData }` — the legacy Map screen's
 * `vehicelsList?.list` read never populated markers because of exactly this.
 */
export type VehiclesByServiceResponse = {
  success: boolean;
  message: string;
  data: Vehicle[] | null;
  errors: null;
};

/**
 * Fetches the online vehicles of one service for the Map screen. The optional
 * user coordinates follow the same finite-PAIR rule as `getVehicles` (never a
 * lone coordinate, never a non-finite value) and only improve the backend's
 * nearest-first ordering — the backend `distance` is Euclidean degrees and is
 * never rendered by the Map.
 */
export function getVehiclesByService(
  serviceId: number,
  params: VehiclesQueryParams = {},
): Promise<VehiclesByServiceResponse> {
  const hasLatitude = typeof params.latitude === 'number' && Number.isFinite(params.latitude);
  const hasLongitude = typeof params.longitude === 'number' && Number.isFinite(params.longitude);
  const query =
    hasLatitude && hasLongitude ? `?latitude=${params.latitude}&longitude=${params.longitude}` : '';
  return apiGet<VehiclesByServiceResponse>(`services/${serviceId}/vehicles${query}`);
}

/**
 * `GET /vehicles/{id}` — public (route-model bound, same resource as the list).
 *
 * STEP 5A proof: the detail route reuses `vehicleResource()`, so there is NO
 * separate detail type — the response `data` is the same `Vehicle` shape.
 *
 * VERIFIED BACKEND FACT: an unknown id returns HTTP 500 with the Laravel
 * ModelNotFoundException text, NOT a 404. The client sanitises that text via
 * `extractBackendMessage` (which rejects "No query results for model") and
 * never surfaces model-binding internals; the caller only sees a generic
 * "Request failed with status 500" + Retry.
 */
export type VehicleResponse = {
  success: boolean;
  message: string;
  data: Vehicle | null;
  errors: null;
};

/** Callers must pass a pre-validated positive integer; never NaN/abc. */
export function getVehicleById(id: number): Promise<VehicleResponse> {
  return apiGet<VehicleResponse>(`vehicles/${id}`);
}