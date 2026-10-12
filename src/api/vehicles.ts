import { apiGet } from './http-client';
import type { Service } from './services';

/**
 * `GET /vehicles` — public (registered before the `auth:sanctum` group).
 *
 * Contract verified live (slice 3A + B1.1): envelope `{ success, message, data:
 * { list, metaData }, errors }`, hardcoded filters `work_status = 'online'` +
 * `current_driver_id IS NOT NULL`, and a `distance` field that is Euclidean
 * degrees — NOT kilometres (the legacy app mislabelled it "KM"). Backend query
 * params: `latitude`, `longitude`, `sort`, `page`, `limit`, `query`; there is
 * no `serviceId` filter. The backend does NOT validate them, so this module
 * emits only defined/valid values (`limit=0`/non-numeric `page`/`limit` → 500).
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

/** The `data` payload of `GET /vehicles` (`VehiclesResponse.data`). */
export type VehiclesListData = {
  list: Vehicle[];
  metaData: VehiclesMetaData;
};

export type VehiclesResponse = {
  success: boolean;
  message: string;
  data: VehiclesListData | null;
  errors: null;
};

/**
 * Coordinate pair shared by the vehicle endpoints. Both `GET /vehicles` and
 * `GET /services/{service}/vehicles` only ever accept the two as a finite PAIR:
 * a lone or invalid coordinate is dropped entirely.
 */
export type VehiclesQueryParams = {
  latitude?: number;
  longitude?: number;
};

/** The only sort values `GET /vehicles` understands (`'desc'` else `asc`). */
export type VehicleSort = 'asc' | 'desc';

/**
 * Query params for `GET /vehicles` — the ONLY params the backend accepts
 * (verified in B1.1 against `Api\Mobile\VehicleController@index`). Every field
 * is optional; the backend defaults to `sort=asc`, `page=1`, `limit=10`. There
 * is deliberately no `serviceId` (services are filtered through their own
 * endpoint, not here).
 */
export type VehicleListParams = VehiclesQueryParams & {
  sort?: VehicleSort;
  page?: number;
  limit?: number;
  /** `label_number LIKE %query%`. Supported by the backend; B1 does not send it. */
  query?: string;
};

/**
 * Builds the `GET /vehicles` query string, emitting only params that are BOTH
 * defined and valid, because the backend does not validate them:
 * - `limit=0` / non-numeric `page`/`limit` → HTTP 500, so only an integer `>= 1`
 *   is ever emitted for either;
 * - a lone or non-finite coordinate is dropped entirely, so the backend always
 *   receives either both coordinates or neither.
 * Callers own the DEFAULTS (see `DEFAULT_VEHICLE_PAGE_SIZE` in the paginated
 * vehicles hook); this function never invents a page or a page size.
 */
function buildVehiclesQuery(params: VehicleListParams): string {
  const parts: string[] = [];

  const hasLatitude = typeof params.latitude === 'number' && Number.isFinite(params.latitude);
  const hasLongitude = typeof params.longitude === 'number' && Number.isFinite(params.longitude);
  if (hasLatitude && hasLongitude) {
    parts.push(`latitude=${params.latitude}`, `longitude=${params.longitude}`);
  }

  if (params.sort === 'asc' || params.sort === 'desc') {
    parts.push(`sort=${params.sort}`);
  }
  if (typeof params.page === 'number' && Number.isInteger(params.page) && params.page >= 1) {
    parts.push(`page=${params.page}`);
  }
  if (typeof params.limit === 'number' && Number.isInteger(params.limit) && params.limit >= 1) {
    parts.push(`limit=${params.limit}`);
  }
  if (typeof params.query === 'string' && params.query.trim().length > 0) {
    parts.push(`query=${encodeURIComponent(params.query)}`);
  }

  return parts.length === 0 ? '' : `?${parts.join('&')}`;
}

/**
 * Fetches online vehicles (`GET /vehicles`, public). Optional coordinates only
 * improve the backend's (Euclidean-degree) nearest-first ordering — the client
 * never displays that value; the Home and All-Vehicles UIs compute a real
 * Haversine distance instead. Pagination params are sanitized here.
 */
export function getVehicles(params: VehicleListParams = {}): Promise<VehiclesResponse> {
  return apiGet<VehiclesResponse>(`vehicles${buildVehiclesQuery(params)}`);
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