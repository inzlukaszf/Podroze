import { searchConnections } from './pkpService.js';
import { searchBusConnections, estimateBusPrice } from './busService.js';
import { detectCity, searchJakDojade, getCityTransitInfo } from './ztmService.js';
import {
  getStationsForCity,
  getTrainStationsForCity,
  getMainStationForCity,
  findStationsWithinRadius,
} from './stationsService.js';

const MIN_WAIT_MINUTES = 5;  // minimum transfer time to be considered valid
const MAX_CONNECTIONS = 5;    // default number of connections to return

// Main route planning function - searches for next N connections after given time
export async function findRoutes(from, to, options = {}) {
  const { date, time, fromLat, fromLon, toLat, toLon, sortBy, count = MAX_CONNECTIONS } = options;

  const fromCity = fromLat && fromLon ? detectCity(fromLat, fromLon) : null;
  const toCity = toLat && toLon ? detectCity(toLat, toLon) : null;

  // Find nearby stations for from/to locations
  const fromStations = fromLat && fromLon ? findStationsWithinRadius(fromLat, fromLon, 3) : [];
  const toStations = toLat && toLon ? findStationsWithinRadius(toLat, toLon, 3) : [];

  // Determine all station name variants to search
  const fromNames = buildSearchNames(from, fromCity, fromStations);
  const toNames = buildSearchNames(to, toCity, toStations);

  // Launch all searches in parallel across all name variants
  const searches = [];

  // 1. Train connections (PKP) - search across all from/to station variants
  for (const fromName of fromNames.slice(0, 3)) {
    for (const toName of toNames.slice(0, 3)) {
      searches.push(
        searchConnections(fromName, toName, date, time)
          .then(results => results.map(r => ({
            ...r,
            source: 'pkp',
            _fromName: fromName,
            _toName: toName,
          })))
          .catch(() => [])
      );
    }
  }

  // 2. Intercity bus connections (FlixBus, RegioJet, Sindbad, e-Podróżnik)
  for (const fromName of fromNames.slice(0, 2)) {
    for (const toName of toNames.slice(0, 2)) {
      searches.push(
        searchBusConnections(fromName, toName, date)
          .then(results => results.map(r => ({
            ...r,
            source: 'bus',
            _fromName: fromName,
            _toName: toName,
          })))
          .catch(() => [])
      );
    }
  }

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

  // Deduplicate (same carrier, same departure time)
  combined = deduplicateConnections(combined);

  // Filter: only connections departing at or after the entered time
  if (time && date) {
    const requestedDT = parseDateTime(date, time);
    if (requestedDT) {
      combined = combined.filter(c => {
        const dep = c.departure ? new Date(c.departure) : null;
        if (!dep || isNaN(dep.getTime())) return true; // keep if no departure time
        return dep >= requestedDT;
      });
    }
  }

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

  // Normalize and compute metrics
  combined = combined.map(c => ({
    ...c,
    _durationMin: parseDurationMinutes(c.duration),
    _priceAmount: c.price?.amount ?? Infinity,
    _transfers: c.transfers ?? (c.legs?.length > 1 ? c.legs.length - 1 : 0),
    _totalWaitMin: calculateTotalWaitMinutes(c),
    _departureTS: c.departure ? new Date(c.departure).getTime() : Infinity,
  }));

  // Sort by departure time (closest to requested time first), then by total wait
  combined = sortConnections(combined, sortBy || 'departure');

  // Return only the first N connections
  const limited = combined.slice(0, count);

  // Tag fastest, cheapest, fewest transfers, minimum wait
  const tagged = tagBestRoutes(limited);

  // Add nearby station info
  const fromNearbyStations = fromStations.slice(0, 3).map(s => ({
    name: s.name, type: s.type, distKm: s.distKm.toFixed(2),
  }));
  const toNearbyStations = toStations.slice(0, 3).map(s => ({
    name: s.name, type: s.type, distKm: s.distKm.toFixed(2),
  }));

  return {
    from,
    to,
    date: date || new Date().toISOString().split('T')[0],
    fromCity: fromCity ? getCityTransitInfo(fromCity)?.name : null,
    toCity: toCity ? getCityTransitInfo(toCity)?.name : null,
    sameCity: fromCity === toCity && fromCity !== null,
    totalResults: tagged.length,
    sortedBy: sortBy || 'departure',
    fromNearbyStations,
    toNearbyStations,
    connections: tagged,
  };
}

// Build list of location names to search (original + city stations)
function buildSearchNames(name, cityKey, nearbyStations) {
  const names = [name];

  // Add short city name (first word)
  const shortName = name.split(',')[0].trim();
  if (shortName !== name) names.push(shortName);

  // Add nearby train/bus station names
  for (const station of nearbyStations.slice(0, 3)) {
    if (!names.includes(station.name)) {
      names.push(station.name);
    }
  }

  // Add city station names if we know the city
  if (cityKey) {
    const trainStations = getTrainStationsForCity(cityKey);
    const mainTrainStation = trainStations.find(s => s.main);
    if (mainTrainStation && !names.includes(mainTrainStation.name)) {
      names.push(mainTrainStation.name);
    }
  }

  return names;
}

// Calculate total waiting time between transfers (in minutes)
function calculateTotalWaitMinutes(connection) {
  const legs = connection.legs || [];
  if (legs.length <= 1) return 0;

  let totalWait = 0;
  for (let i = 0; i < legs.length - 1; i++) {
    const currentLeg = legs[i];
    const nextLeg = legs[i + 1];

    // Skip walking legs for wait calculation
    if (currentLeg.mode === 'pieszo' || nextLeg.mode === 'pieszo') continue;

    const arrival = currentLeg.arrival ? new Date(currentLeg.arrival) : null;
    const departure = nextLeg.departure ? new Date(nextLeg.departure) : null;

    if (arrival && departure && !isNaN(arrival.getTime()) && !isNaN(departure.getTime())) {
      const waitMin = (departure - arrival) / 60000;
      if (waitMin >= 0) totalWait += waitMin;
    }
  }

  return totalWait;
}

// Deduplicate connections (same carrier + departure time)
function deduplicateConnections(connections) {
  const seen = new Set();
  return connections.filter(c => {
    const key = `${c.provider || c.carrier}-${c.departure}-${c.from}-${c.to}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Parse date+time string to Date object
function parseDateTime(date, time) {
  if (!date || !time) return null;
  try {
    const dt = new Date(`${date}T${time}:00`);
    return isNaN(dt.getTime()) ? null : dt;
  } catch {
    return null;
  }
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
    case 'min_wait':
      return [...connections].sort((a, b) => a._totalWaitMin - b._totalWaitMin);
    case 'departure':
    default:
      return [...connections].sort((a, b) => {
        if (a._departureTS !== Infinity && b._departureTS !== Infinity) {
          return a._departureTS - b._departureTS;
        }
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

  let fastestIdx = 0;
  let cheapestIdx = 0;
  let fewestTransfersIdx = 0;
  let minWaitIdx = 0;

  for (let i = 1; i < connections.length; i++) {
    if (connections[i]._durationMin < connections[fastestIdx]._durationMin) fastestIdx = i;
    if (connections[i]._priceAmount < connections[cheapestIdx]._priceAmount) cheapestIdx = i;
    if (connections[i]._transfers < connections[fewestTransfersIdx]._transfers) fewestTransfersIdx = i;
    if (connections[i]._totalWaitMin < connections[minWaitIdx]._totalWaitMin) minWaitIdx = i;
  }

  return connections.map((c, i) => {
    const tags = [];
    if (i === fastestIdx && c._durationMin < Infinity) tags.push('najszybsza');
    if (i === cheapestIdx && c._priceAmount < Infinity) tags.push('najtańsza');
    if (i === fewestTransfersIdx) tags.push('najmniej przesiadek');
    if (i === minWaitIdx && c._totalWaitMin > 0) tags.push('min. oczekiwanie');
    return { ...c, tags };
  });
}

// Parse duration string/number to minutes
function parseDurationMinutes(duration) {
  if (!duration) return Infinity;
  if (typeof duration === 'number') {
    return duration > 300 ? Math.ceil(duration / 60) : duration;
  }
  if (typeof duration === 'string') {
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
// Enhanced to use real station locations and support multiple stations per city
export async function findMultiModalRoute(from, to, options = {}) {
  const { fromLat, fromLon, toLat, toLon, date, time } = options;

  const directRoutes = await findRoutes(from, to, options);

  if (fromLat && toLat) {
    const distance = haversineKm(fromLat, fromLon, toLat, toLon);

    // For longer distances, try routing through intermediate hubs
    if (distance > 30) {
      const hubs = findBestHubs(fromLat, fromLon, toLat, toLon, distance);
      const hubRoutes = [];

      for (const hub of hubs.slice(0, 3)) {
        try {
          // For each hub, try all its station variants
          const hubStations = getStationsForCity(hub.cityKey);
          const hubStationNames = hubStations.length > 0
            ? [hubStations.find(s => s.main)?.name || hub.name, hub.name]
            : [hub.name];

          for (const hubName of hubStationNames.slice(0, 2)) {
            const [toHubResults, fromHubResults] = await Promise.all([
              findRoutes(from, hubName, { ...options }),
              findRoutes(hubName, to, { ...options }),
            ]);

            if (toHubResults.connections.length > 0 && fromHubResults.connections.length > 0) {
              // Find best connection pairs with minimum wait at hub
              const bestPair = findBestConnectionPair(
                toHubResults.connections,
                fromHubResults.connections,
                hubName
              );

              if (bestPair) {
                const { firstLeg, secondLeg, waitMinutes } = bestPair;
                const totalPrice = (firstLeg.price?.amount || 0) + (secondLeg.price?.amount || 0);

                hubRoutes.push({
                  type: 'multi_modal',
                  via: hubName,
                  viaCity: hub.name,
                  firstLeg,
                  secondLeg,
                  waitAtHub: waitMinutes,
                  totalLegs: 2,
                  totalPrice: totalPrice > 0 ? { amount: totalPrice, currency: 'PLN' } : null,
                  totalDuration: (firstLeg._durationMin || 0) + (secondLeg._durationMin || 0) + waitMinutes,
                  hubStations: hubStations.map(s => ({ name: s.name, type: s.type })),
                });
              }
            }
          }
        } catch (err) {
          // Skip hubs that fail
        }
      }

      // Also try local transit connections at start/end
      if (fromLat && toLat) {
        const fromCity = detectCity(fromLat, fromLon);
        const toCity = detectCity(toLat, toLon);

        if (fromCity) {
          const nearestTrainFromCity = getMainStationForCity(fromCity, 'train');
          if (nearestTrainFromCity) {
            // Local transit from start to train station, then train to destination
            try {
              const localToStation = await searchJakDojade(
                fromLat, fromLon,
                nearestTrainFromCity.lat, nearestTrainFromCity.lon,
                fromCity, date, time
              );

              if (localToStation.length > 0) {
                const trainFromStation = await findRoutes(
                  nearestTrainFromCity.name, to, { ...options }
                );

                if (trainFromStation.connections.length > 0) {
                  const localLeg = { ...localToStation[0], source: 'local' };
                  const trainLeg = trainFromStation.connections[0];
                  const totalWait = calculateTransferWait(localLeg, trainLeg);

                  hubRoutes.push({
                    type: 'multi_modal',
                    via: nearestTrainFromCity.name,
                    viaCity: nearestTrainFromCity.name,
                    firstLeg: localLeg,
                    secondLeg: trainLeg,
                    waitAtHub: totalWait,
                    totalLegs: 2,
                    totalPrice: null,
                    totalDuration: (localLeg._durationMin || 0) + (trainLeg._durationMin || 0) + totalWait,
                    transferType: 'local_to_train',
                  });
                }
              }
            } catch {
              // Skip
            }
          }
        }

        if (toCity) {
          const nearestTrainToCity = getMainStationForCity(toCity, 'train');
          if (nearestTrainToCity) {
            // Train from start to destination city station, then local transit to end
            try {
              const trainToStation = await findRoutes(
                from, nearestTrainToCity.name, { ...options }
              );

              if (trainToStation.connections.length > 0) {
                const localFromStation = await searchJakDojade(
                  nearestTrainToCity.lat, nearestTrainToCity.lon,
                  toLat, toLon,
                  toCity, date, time
                );

                if (localFromStation.length > 0) {
                  const trainLeg = trainToStation.connections[0];
                  const localLeg = { ...localFromStation[0], source: 'local' };
                  const totalWait = calculateTransferWait(trainLeg, localLeg);

                  hubRoutes.push({
                    type: 'multi_modal',
                    via: nearestTrainToCity.name,
                    viaCity: nearestTrainToCity.name,
                    firstLeg: trainLeg,
                    secondLeg: localLeg,
                    waitAtHub: totalWait,
                    totalLegs: 2,
                    totalPrice: null,
                    totalDuration: (trainLeg._durationMin || 0) + (localLeg._durationMin || 0) + totalWait,
                    transferType: 'train_to_local',
                  });
                }
              }
            } catch {
              // Skip
            }
          }
        }
      }

      // Sort by minimum wait time at hub (then by total duration)
      hubRoutes.sort((a, b) => {
        const waitDiff = (a.waitAtHub || Infinity) - (b.waitAtHub || Infinity);
        if (waitDiff !== 0) return waitDiff;
        return (a.totalDuration || Infinity) - (b.totalDuration || Infinity);
      });

      if (hubRoutes.length > 0) {
        directRoutes.multiModal = hubRoutes.slice(0, 5);
      }
    }
  }

  return directRoutes;
}

// Find best connection pair at a hub with minimum waiting time
function findBestConnectionPair(firstLegs, secondLegs, hubName) {
  let bestPair = null;
  let bestScore = Infinity;

  for (const first of firstLegs.slice(0, 5)) {
    for (const second of secondLegs.slice(0, 5)) {
      const wait = calculateTransferWait(first, second);
      if (wait === null) continue;
      if (wait < MIN_WAIT_MINUTES) continue; // not enough time for transfer

      // Score = wait time + penalty for very long waits
      const score = wait <= 60 ? wait : wait * 1.5;

      if (score < bestScore) {
        bestScore = score;
        bestPair = { firstLeg: first, secondLeg: second, waitMinutes: wait };
      }
    }
  }

  // If no timed pair found, use first of each with unknown wait
  if (!bestPair && firstLegs.length > 0 && secondLegs.length > 0) {
    bestPair = {
      firstLeg: firstLegs[0],
      secondLeg: secondLegs[0],
      waitMinutes: null,
    };
  }

  return bestPair;
}

// Calculate wait time between two consecutive connections (minutes)
function calculateTransferWait(firstConn, secondConn) {
  const arrival = firstConn.arrival ? new Date(firstConn.arrival) : null;
  const departure = secondConn.departure ? new Date(secondConn.departure) : null;

  if (!arrival || !departure || isNaN(arrival.getTime()) || isNaN(departure.getTime())) {
    return null;
  }

  const waitMin = (departure - arrival) / 60000;
  return waitMin >= 0 ? waitMin : null;
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

// Major transport hubs with city keys for station lookup
const MAJOR_HUBS = [
  { name: 'Warszawa Centralna', cityKey: 'warszawa', lat: 52.2289, lon: 21.0034 },
  { name: 'Kraków Główny', cityKey: 'krakow', lat: 50.0680, lon: 19.9478 },
  { name: 'Wrocław Główny', cityKey: 'wroclaw', lat: 51.0988, lon: 17.0366 },
  { name: 'Poznań Główny', cityKey: 'poznan', lat: 52.4025, lon: 16.9118 },
  { name: 'Gdańsk Główny', cityKey: 'gdansk', lat: 54.3562, lon: 18.6440 },
  { name: 'Katowice', cityKey: 'katowice', lat: 50.2575, lon: 19.0180 },
  { name: 'Łódź Fabryczna', cityKey: 'lodz', lat: 51.7680, lon: 19.4700 },
  { name: 'Szczecin Główny', cityKey: 'szczecin', lat: 53.4300, lon: 14.5530 },
  { name: 'Bydgoszcz Główna', cityKey: 'bydgoszcz', lat: 53.1320, lon: 18.0010 },
  { name: 'Lublin', cityKey: 'lublin', lat: 51.2310, lon: 22.5650 },
  { name: 'Białystok', cityKey: 'bialystok', lat: 53.1325, lon: 23.1688 },
  { name: 'Rzeszów Główny', cityKey: 'rzeszow', lat: 50.0395, lon: 22.0031 },
  { name: 'Częstochowa', cityKey: 'czestochowa', lat: 50.8129, lon: 19.1040 },
  { name: 'Radom', cityKey: 'radom', lat: 51.3974, lon: 21.1549 },
  { name: 'Toruń Główny', cityKey: 'torun', lat: 53.0138, lon: 18.5984 },
  { name: 'Olsztyn Główny', cityKey: 'olsztyn', lat: 53.7784, lon: 20.4801 },
];

function findBestHubs(fromLat, fromLon, toLat, toLon, totalDist) {
  const midLat = (fromLat + toLat) / 2;
  const midLon = (fromLon + toLon) / 2;

  return MAJOR_HUBS
    .map(hub => ({
      ...hub,
      distFromStart: haversineKm(fromLat, fromLon, hub.lat, hub.lon),
      distToEnd: haversineKm(hub.lat, hub.lon, toLat, toLon),
      distFromMid: haversineKm(midLat, midLon, hub.lat, hub.lon),
    }))
    .filter(hub =>
      hub.distFromStart > 10 && hub.distToEnd > 10 &&
      (hub.distFromStart + hub.distToEnd) < totalDist * 1.6
    )
    .sort((a, b) => {
      // Prefer hubs that are "on the way" and close to midpoint
      const aScore = a.distFromMid + Math.abs(a.distFromStart - a.distToEnd) * 0.2;
      const bScore = b.distFromMid + Math.abs(b.distFromStart - b.distToEnd) * 0.2;
      return aScore - bScore;
    })
    .slice(0, 4);
}
