import type { Attraction } from './types'

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (v: number) => (v * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function makeAttractionId(a: Attraction): string {
  // stable-ish id
  return `${a.PLZ}::${a.Einrichtung}`
}

export async function geocodePlace(query: string): Promise<{ lat: number; lon: number } | null> {
  // Use Nominatim (OpenStreetMap) for geocoding
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query,
    )}&limit=1`
    const res = await fetch(url, { headers: { 'User-Agent': 'lfp-visualized/1.0' } })
    const json = await res.json()
    if (Array.isArray(json) && json.length > 0) {
      return { lat: Number(json[0].lat), lon: Number(json[0].lon) }
    }
    return null
  } catch (err) {
    return null
  }
}
