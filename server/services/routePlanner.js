import { searchConnections } from './pkpService.js';
import { searchBusConnections, estimateBusPrice } from './busService.js';
import { detectCity, searchJakDojade, getCityTransitInfo } from './ztmService.js';

// Main route planning function - combines multiple transit sources
export async function findRoutes(from, to, options = {}) {
  const { date, time, fromLat, fromLon, toLat, toLon, sortBy } = options;

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

  // 2. Intercity bus connections (FlixBus, RegioJet, Sindbad, e-Podróżnik)
  searches.push(
    searchBusConnections(from, to, date)
      .then(results => results.map(r => ({ ...r, source: 'bus' })))
      .catch(() => [])
  );

  // 3. Local transit (if both points are in the same city)
  if (fromCity && toCity && fromCity === toCity && fromLat && toLat) {
    searches.push(
      searchJakDojade(fromLat, fromLon, toLat, toLon, fromCity, date, time)
        .then(results => results.map(r => ({ ...r, source: 'local' })))
        .catch(() => [])
    );
  }

  const allResults = await Promise.all(searches);
  let combined = allResults.flat();

  // If bus results lack price, estimate based on distance
  if (fromLat && toLat) {
    const distKm = haversineKm(fromLat, fromLon, toLat, toLon);
    combined = combined.map(c => {
      if (c.type === 'bus' && !c.price && distKm > 0) {
        const est = estimateBusPrice(distKm);
        return {
          ...c,
          price: { amount: est.average.amount, currency: 'PLN', estimated: true },
          priceRange: est,
        };
      }
      return c;
    });
  }

  // Normalize duration to minutes for sorting
  combined = combined.map(c => ({
    ...c,
    _durationMin: parseDurationMinutes(c.duration),
    _priceAmount: c.price?.amount ?? Infinity,
    _transfers: c.transfers ?? c.legs?.length ?? 0,
  }));

  // Sort based on preference
  combined = sortConnections(combined, sortBy || 'departure');

  // Tag fastest, cheapest, shortest
  const tagged = tagBestRoutes(combined);

  return {
    from,
    to,
    date: date || new Date().toISOString().split('T')[0],
    fromCity: fromCity ? getCityTransitInfo(fromCity)?.name : null,
    toCity: toCity ? getCityTransitInfo(toCity)?.name : null,
    sameCity: fromCity === toCity && fromCity !== null,
    totalResults: tagged.length,
    sortedBy: sortBy || 'departure',
    connections: tagged,
  };
}

// Sort connections by different criteria
function sortConnections(connections, sortBy) {
  switch (sortBy) {
    case 'fastest':
      return [...connections].sort((a, b) => a._durationMin - b._durationMin);
    case 'cheapest':
      return [...connections].sort((a, b) => a._priceAmount - b._priceAmount);
    case 'fewest_transfers':
      return [...connections].sort((a, b) => a._transfers - b._transfers);
    case 'departure':
    default:
      return [...connections].sort((a, b) => {
        if (a.departure && b.departure) {
          return new Date(a.departure) - new Date(b.departure);
        }
        return 0;
      });
  }
}

// Tag the best route for each category
function tagBestRoutes(connections) {
  if (connections.length === 0) return connections;

  // Find indexes of best in each category
  let fastestIdx = 0;
  let cheapestIdx = 0;
  let fewestTransfersIdx = 0;

  for (let i = 1; i < connections.length; i++) {
    if (connections[i]._durationMin < connections[fastestIdx]._durationMin) fastestIdx = i;
    if (connections[i]._priceAmount < connections[cheapestIdx]._priceAmount) cheapestIdx = i;
    if (connections[i]._transfers < connections[fewestTransfersIdx]._transfers) fewestTransfersIdx = i;
  }

  return connections.map((c, i) => {
    const tags = [];
    if (i === fastestIdx && c._durationMin < Infinity) tags.push('najszybsza');
    if (i === cheapestIdx && c._priceAmount < Infinity) tags.push('najtańsza');
    if (i === fewestTransfersIdx) tags.push('najmniej przesiadek');
    return { ...c, tags };
  });
}

// Parse duration string/number to minutes
function parseDurationMinutes(duration) {
  if (!duration) return Infinity;
  if (typeof duration === 'number') {
    return duration > 300 ? Math.ceil(duration / 60) : duration; // seconds vs minutes
  }
  if (typeof duration === 'string') {
    // "2h 30min", "2h 30m", "150min", "02:30"
    const hm = duration.match(/(\d+)\s*h\w*\s*(\d+)/i);
    if (hm) return parseInt(hm[1]) * 60 + parseInt(hm[2]);

    const hOnly = duration.match(/^(\d+)\s*h/i);
    if (hOnly) return parseInt(hOnly[1]) * 60;

    const mOnly = duration.match(/^(\d+)\s*m/i);
    if (mOnly) return parseInt(mOnly[1]);

    const colon = duration.match(/^(\d+):(\d+)/);
    if (colon) return parseInt(colon[1]) * 60 + parseInt(colon[2]);
  }
  return Infinity;
}

// Find multi-modal routes (combining different transport types)
export async function findMultiModalRoute(from, to, options = {}) {
  const { fromLat, fromLon, toLat, toLon } = options;

  const directRoutes = await findRoutes(from, to, options);

  if (directRoutes.connections.length === 0 && fromLat && toLat) {
    const distance = haversineKm(fromLat, fromLon, toLat, toLon);

    if (distance > 50) {
      const hubs = findNearestHubs(fromLat, fromLon, toLat, toLon);

      const hubRoutes = [];
      for (const hub of hubs) {
        const toHub = await findRoutes(from, hub.name, { ...options });
        const fromHub = await findRoutes(hub.name, to, { ...options });

        if (toHub.connections.length > 0 && fromHub.connections.length > 0) {
          const firstLeg = toHub.connections[0];
          const secondLeg = fromHub.connections[0];
          const totalPrice = (firstLeg.price?.amount || 0) + (secondLeg.price?.amount || 0);

          hubRoutes.push({
            type: 'multi_modal',
            via: hub.name,
            firstLeg,
            secondLeg,
            totalLegs: 2,
            totalPrice: totalPrice > 0 ? { amount: totalPrice, currency: 'PLN' } : null,
            totalDuration: (firstLeg._durationMin || 0) + (secondLeg._durationMin || 0),
          });
        }
      }

      // Sort multi-modal by total price
      hubRoutes.sort((a, b) => (a.totalPrice?.amount || Infinity) - (b.totalPrice?.amount || Infinity));
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
