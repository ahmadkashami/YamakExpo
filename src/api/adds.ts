import { apiGet } from './http-client';

/**
 * `title` is a plain scalar string, NOT a localised `{ en, ar }` object: the
 * `ads.title` column is a single `string` and `adResource()` returns it raw.
 * Verified against a live response, where the values are plain strings
 * (including one that happens to be a URL). Unlike `Service.name`, adds
 * therefore need no language handling.
 */
export type Add = {
  id: number;
  /** String mirror of `id`, kept for parity with the legacy `_id` key. */
  _id: string;
  title: string;
  /**
   * Nullable in the schema (`$table->string('link')->nullable()`) and omitted by
   * the backend's own parity-test fixture, so this can genuinely be `null`.
   * Never call `Linking` with it unchecked.
   */
  link: string | null;
  photo: string;
  /** Emitted via `optional()->toJSON()`: `Y-m-d\TH:i:s.u\Z` (microseconds), not strict ISO-8601. */
  startedAt: string | null;
  expiredAt: string | null;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
};

/** Byte-for-byte the same five keys as the services endpoint's `metaData`.
 *  Kept separate so this slice does not have to touch `services.ts`; the two
 *  can be collapsed into one shared alias once `services.ts` is unfrozen. */
export type AddsMetaData = {
  totalCount: number;
  currentCount: number;
  currentPage: number;
  itemsPerPage: number;
  lastPage: number;
};

export type AddsResponse = {
  success: boolean;
  message: string;
  data: {
    list: Add[];
    metaData: AddsMetaData;
  } | null;
  errors: null;
};

/**
 * `GET /adds` — public (registered before the `auth:sanctum` group).
 *
 * The server keeps only ads whose `started_at <= now <= expired_at` and whose
 * `status = 'active'`, soft-deleted excluded, ordered `latest('id')`
 * (DESCENDING — the opposite of `/services`).
 *
 * No `limit` is sent on purpose: the backend defaults to 10, which is exactly
 * what the legacy app requested.
 */
export function getAdds(): Promise<AddsResponse> {
  return apiGet<AddsResponse>('adds');
}
