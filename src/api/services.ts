import { apiGet } from './http-client';

/**
 * Languages the backend actually returns for a service name.
 * Source: `Dashboard\ServiceController::serviceResource()` -> `name => ['en' =>, 'ar' =>]`.
 */
export type ServiceLanguage = 'en' | 'ar';

export type ServiceName = Record<ServiceLanguage, string>;

export type Service = {
  id: number;
  /** String mirror of `id`, kept because the legacy app keyed its Zustand
   *  `selectedServiceId` on `_id`. Use `id` for comparisons. */
  _id: string;
  name: ServiceName;
  status: string | null;
  /**
   * Serialised by the backend with `optional($model->created_at)->toJSON()`,
   * which emits `Y-m-d\TH:i:s.u\Z` (microsecond precision), not strict
   * ISO-8601. Kept as an opaque string; normalise before parsing.
   */
  createdAt: string | null;
  /** Absolute Cloudinary URL, or `null` when the service has no logo. */
  logo: string | null;
};

/** Note: mobile metaData keys differ from the dashboard's (`totalCount` vs `total`). */
export type ServicesMetaData = {
  totalCount: number;
  currentCount: number;
  currentPage: number;
  itemsPerPage: number;
  lastPage: number;
};

export type ServicesResponse = {
  success: boolean;
  message: string;
  data: {
    list: Service[];
    metaData: ServicesMetaData;
  } | null;
  errors: null;
};

/**
 * `GET /services` — public (no auth middleware), `status = 'active'` only,
 * soft-deleted excluded, ordered `oldest('id')` (ascending).
 *
 * No `limit` is sent on purpose: the backend defaults to 10, which is exactly
 * what the legacy app requested, so passing an explicit limit here would be a
 * behaviour change rather than a port.
 */
export function getServices(): Promise<ServicesResponse> {
  return apiGet<ServicesResponse>('services');
}
