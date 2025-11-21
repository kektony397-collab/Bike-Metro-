// Earth radius in kilometers
const R = 6371;

const toRad = (value: number) => (value * Math.PI) / 180;

/**
 * Calculates the great-circle distance between two points using the Haversine formula.
 * Returns distance in kilometers.
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Parses "HH:MM" string and checks if current time falls within range.
 * Handles ranges that cross midnight (e.g., 23:00 to 06:00).
 */
export const isNightTime = (start: string, end: string): boolean => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes < endMinutes) {
    // Range inside same day, e.g., 14:00 to 16:00
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Range crosses midnight, e.g., 23:00 to 06:00
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
};
