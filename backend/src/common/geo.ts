/** Earth distance in km (Haversine). */
export function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function hasCoords(v: { latitude?: number | null; longitude?: number | null }): v is { latitude: number; longitude: number } {
  return (
    typeof v.latitude === 'number' &&
    typeof v.longitude === 'number' &&
    Number.isFinite(v.latitude) &&
    Number.isFinite(v.longitude)
  );
}

/** True when both points exist and are within `radiusKm` (inclusive). */
export function withinRadiusKm(
  a: { latitude?: number | null; longitude?: number | null },
  b: { latitude?: number | null; longitude?: number | null },
  radiusKm: number
): boolean {
  if (!hasCoords(a) || !hasCoords(b)) return false;
  return distanceKm(a, b) <= radiusKm;
}
