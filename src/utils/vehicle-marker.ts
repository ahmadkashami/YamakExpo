import type { Vehicle } from '@/api';

import type { GeoCoordinate } from './distance';

/**
 * Converts a vehicle's `geoLocation.coordinates` (GeoJSON order
 * `[longitude, latitude]`) into a react-native-maps coordinate
 * `{ latitude, longitude }`.
 *
 * Returns `null` (caller must skip the marker) when the coordinates are
 * missing, non-finite, out of the valid lat/lng ranges, or the backend's
 * `(0, 0)` sentinel for vehicles without a stored location (the resource
 * coerces missing coordinates — see `isUsableVehicleGeo` in `distance.ts`).
 *
 * Never reads the legacy `geoMetry` typo — the current backend only emits
 * `geoLocation`.
 */
export function vehicleMarkerCoordinate(
  vehicle: Vehicle,
): GeoCoordinate | null {
  const coordinates = vehicle.geoLocation?.coordinates;
  if (
    !Array.isArray(coordinates) ||
    coordinates.length < 2 ||
    typeof coordinates[0] !== 'number' ||
    typeof coordinates[1] !== 'number'
  ) {
    return null;
  }

  const [longitude, latitude] = coordinates;

  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180 ||
    (latitude === 0 && longitude === 0)
  ) {
    return null;
  }

  return { latitude, longitude };
}