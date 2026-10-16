import { Platform } from 'react-native';
import * as Location from 'expo-location';

export type Place = {
  latitude: number;
  longitude: number;
  address: string;
};

function formatNativeAddress(p: Location.LocationGeocodedAddress): string {
  const parts = [p.name, p.street, p.district, p.subregion, p.city, p.region, p.postalCode, p.country].filter(
    (x): x is string => Boolean(x && String(x).trim())
  );
  // De-dupe consecutive repeats (e.g. city twice)
  return [...new Set(parts.map((s) => s.trim()))].join(', ');
}

async function reverseViaNominatim(latitude: number, longitude: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'SnapNear/1.0' },
  });
  if (!res.ok) throw new Error('Could not resolve address');
  const data = (await res.json()) as { display_name?: string };
  const label = data.display_name?.trim();
  if (!label || label.length < 8) throw new Error('Could not resolve address');
  return label;
}

async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  try {
    const places = await Location.reverseGeocodeAsync({ latitude, longitude });
    const label = places[0] ? formatNativeAddress(places[0]) : '';
    if (label.length >= 8) return label;
  } catch {
    // fall through to Nominatim (especially useful on web)
  }
  return reverseViaNominatim(latitude, longitude);
}

/** Asks for permission, reads GPS, reverse-geocodes to a readable address. */
export async function getCurrentPlace(): Promise<Place> {
  const current = await Location.getForegroundPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') {
    const asked = await Location.requestForegroundPermissionsAsync();
    status = asked.status;
  }
  if (status !== 'granted') {
    throw new Error(
      Platform.OS === 'web'
        ? 'Allow location access in the browser to continue'
        : 'Location permission is required to continue'
    );
  }

  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const latitude = pos.coords.latitude;
  const longitude = pos.coords.longitude;
  const address = await reverseGeocode(latitude, longitude);
  return { latitude, longitude, address };
}
