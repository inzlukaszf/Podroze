const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function geocodeSearch(query) {
  return fetchJson(`${API_BASE}/geocode/search?q=${encodeURIComponent(query)}`);
}

export async function reverseGeocode(lat, lon) {
  return fetchJson(`${API_BASE}/geocode/reverse?lat=${lat}&lon=${lon}`);
}

export async function searchRoutes(from, to, options = {}) {
  const params = new URLSearchParams({ from, to });
  if (options.date) params.set('date', options.date);
  if (options.time) params.set('time', options.time);
  if (options.fromLat) params.set('fromLat', options.fromLat);
  if (options.fromLon) params.set('fromLon', options.fromLon);
  if (options.toLat) params.set('toLat', options.toLat);
  if (options.toLon) params.set('toLon', options.toLon);
  if (options.multiModal) params.set('multiModal', 'true');
  if (options.sortBy) params.set('sortBy', options.sortBy);
  return fetchJson(`${API_BASE}/transit/search?${params}`);
}

export async function searchStations(query) {
  return fetchJson(`${API_BASE}/transit/stations?q=${encodeURIComponent(query)}`);
}

export async function getSupportedCities() {
  return fetchJson(`${API_BASE}/transit/cities`);
}

export async function detectCity(lat, lon) {
  return fetchJson(`${API_BASE}/transit/detect-city?lat=${lat}&lon=${lon}`);
}
