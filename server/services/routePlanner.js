import { searchConnections, searchStations } from './pkpService.js';
import { searchBusConnections } from './busService.js';
import { detectCity, searchJakDojade, getCityTransitInfo } from './ztmService.js';

// Main route planning function - combines multiple transit sources
export async function findRoutes(from, to, options = {}) {
  const { date, time, fromLat, fromLon, toLat, toLon } = options;

  const fromCity = fromLat && fromLon ? detectCity(fromLat, fromLon) : null;
  const toCity = toLat && toLon ? detectCity(toLat, toLon) : null;

  // Launch all searches in parallel
  const searches = [];

  // 1. Train connections (PKP)
  searches.push(
    searchConnections(from, to, date, time)
      .then(results => results.map(r => ({ ...r, source: 'pkp' })))
      .catch(() => [])
  );

  // 2. Intercity bus connections
  searches.push(
    searchBusConnections(from, to, date)
      .then(results => results.map(r => ({ ...r, source: 'bus' })))
      .catch(() => [])
  );

  // 3. Local transit (if both points are in the same city)
  if (fromCity && toCity && fromCity === toCity && fromLat && toLat) {
    searches.push(
      searchJakDojade(fromLat, fromLon, toLat, toLon, fromCity)
        .then(results => results.map(r => ({ ...r, source: 'local' })))
        .catch(() => [])
    );
  }

  const allResults = await Promise.all(searches);
  const combined = allResults.flat();

  // Sort by departure time, then by duration
  combined.sort((a, b) => {
    if (a.departure && b.departure) {
      return new Date(a.departure) - new Date(b.departure);
    }
    return 0;
  });

  // Add metadata
  return {
    from,
    to,
    date: date || new Date().toISOString().split('T')[0],
    fromCity: fromCity ? getCityTransitInfo(fromCity)?.name : null,
    toCity: toCity ? getCityTransitInfo(toCity)?.name : null,
    sameCity: fromCity === toCity && fromCity !== null,
    totalResults: combined.length,
    connections: combined,
  };
}

// Find multi-modal routes (combining different transport types)
export async function findMultiModalRoute(from, to, options = {}) {
  const { fromLat, fromLon, toLat, toLon, date, time } = options;

  // Direct routes
  const directRoutes = await findRoutes(from, to, options);

  // If no direct routes found and cities are far apart,
  // try to find routes via major transit hubs
  if (directRoutes.connections.length === 0 && fromLat && toLat) {
    const distance = haversineKm(fromLat, fromLon, toLat, toLon);

    if (distance > 50) {
      // Try routing via nearest major city stations
      const hubs = findNearestHubs(fromLat, fromLon, toLat, toLon);

      const hubRoutes = [];
      for (const hub of hubs) {
        const toHub = await findRoutes(from, hub.name, { ...options });
        const fromHub = await findRoutes(hub.name, to, { ...options });

        if (toHub.connections.length > 0 && fromHub.connections.length > 0) {
          hubRoutes.push({
            type: 'multi_modal',
            via: hub.name,
            firstLeg: toHub.connections[0],
            secondLeg: fromHub.connections[0],
            totalLegs: 2,
          });
        }
      }

      directRoutes.multiModal = hubRoutes;
    }
  }

  return directRoutes;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Major Polish transit hubs for multi-modal routing
const MAJOR_HUBS = [
  { name: 'Warszawa Centralna', lat: 52.2289, lon: 21.0034 },
  { name: 'Kraków Główny', lat: 50.0680, lon: 19.9478 },
  { name: 'Wrocław Główny', lat: 51.0988, lon: 17.0366 },
  { name: 'Poznań Główny', lat: 52.4025, lon: 16.9118 },
  { name: 'Gdańsk Główny', lat: 54.3562, lon: 18.6440 },
  { name: 'Katowice', lat: 50.2575, lon: 19.0180 },
  { name: 'Łódź Fabryczna', lat: 51.7680, lon: 19.4700 },
  { name: 'Szczecin Główny', lat: 53.4300, lon: 14.5530 },
  { name: 'Bydgoszcz Główna', lat: 53.1320, lon: 18.0010 },
  { name: 'Lublin', lat: 51.2310, lon: 22.5650 },
];

function findNearestHubs(fromLat, fromLon, toLat, toLon) {
  // Find hubs that are roughly between the two points
  const midLat = (fromLat + toLat) / 2;
  const midLon = (fromLon + toLon) / 2;
  const totalDist = haversineKm(fromLat, fromLon, toLat, toLon);

  return MAJOR_HUBS
    .map(hub => ({
      ...hub,
      distFromStart: haversineKm(fromLat, fromLon, hub.lat, hub.lon),
      distToEnd: haversineKm(hub.lat, hub.lon, toLat, toLon),
      distFromMid: haversineKm(midLat, midLon, hub.lat, hub.lon),
    }))
    .filter(hub =>
      hub.distFromStart > 10 && hub.distToEnd > 10 &&
      (hub.distFromStart + hub.distToEnd) < totalDist * 1.5
    )
    .sort((a, b) => a.distFromMid - b.distFromMid)
    .slice(0, 3);
}
