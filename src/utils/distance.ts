export type GeoCoordinate = {
  latitude: number;
  longitude: number;
};

const EARTH_RADIUS_KM = 6371;

function isValidCoordinate(value: number): boolean {
  return Number.isFinite(value);
}

/**
 * Great-circle distance in kilometres between two coordinates (Haversine).
 *
 * The backend's own `distance` field is Euclidean degrees and must NOT be
 * displayed — this utility exists so the client can compute a real distance in
 * km from the user's location instead. Returns `null` for non-finite inputs.
 */
export function haversineDistanceKm(from: GeoCoordinate, to: GeoCoordinate): number | null {
  if (
    !isValidCoordinate(from.latitude) ||
    !isValidCoordinate(from.longitude) ||
    !isValidCoordinate(to.latitude) ||
    !isValidCoordinate(to.longitude)
  ) {
    return null;
  }

  const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Formats a true Haversine distance (km) for display. Never formats the
 * backend's Euclidean `distance` field; never emits `0 km` / `NaN km` /
 * `unknown km` (sub-100 m values collapse to `<0.1 km`). Callers omit the
 * label entirely when the user has no valid position.
 */
export function formatDistanceKm(km: number): string | null {
  if (!Number.isFinite(km) || km < 0) {
    return null;
  }
  if (km < 0.1) {
    return '<0.1 km';
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Guard for a vehicle's `geoLocation`. The backend resource coerces missing
 * coordinates to `(0, 0)`, which is meaningless for a distance — so a vehicle
 * at exactly `(0, 0)` (or with non-finite values) is treated as having no
 * usable location, mirroring the backend's own truthiness check.
 */
export function isUsableVehicleGeo(
  geo: GeoCoordinate | null | undefined,
): geo is GeoCoordinate {
  if (geo === null || geo === undefined) {
    return false;
  }
  if (!isValidCoordinate(geo.latitude) || !isValidCoordinate(geo.longitude)) {
    return false;
  }
  return geo.latitude !== 0 || geo.longitude !== 0;
}