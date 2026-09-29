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