// Polish train and bus stations database with coordinates
// Cities can have multiple stations (train + bus)

const TRAIN_STATIONS = [
  // Warszawa - multiple train stations
  { id: 'warszawa-centralna', city: 'warszawa', name: 'Warszawa Centralna', lat: 52.2289, lon: 21.0034, type: 'train', main: true },
  { id: 'warszawa-zachodnia', city: 'warszawa', name: 'Warszawa Zachodnia', lat: 52.2206, lon: 20.9656, type: 'train', main: false },
  { id: 'warszawa-wschodnia', city: 'warszawa', name: 'Warszawa Wschodnia', lat: 52.2516, lon: 21.0436, type: 'train', main: false },
  { id: 'warszawa-gdanska', city: 'warszawa', name: 'Warszawa Gdańska', lat: 52.2630, lon: 20.9940, type: 'train', main: false },
  { id: 'warszawa-wola', city: 'warszawa', name: 'Warszawa Wola', lat: 52.2337, lon: 20.9605, type: 'train', main: false },

  // Kraków - multiple train stations
  { id: 'krakow-glowny', city: 'krakow', name: 'Kraków Główny', lat: 50.0680, lon: 19.9478, type: 'train', main: true },
  { id: 'krakow-plaszow', city: 'krakow', name: 'Kraków Płaszów', lat: 50.0391, lon: 19.9918, type: 'train', main: false },
  { id: 'krakow-lobzow', city: 'krakow', name: 'Kraków Łobzów', lat: 50.0726, lon: 19.9206, type: 'train', main: false },

  // Wrocław - multiple stations
  { id: 'wroclaw-glowny', city: 'wroclaw', name: 'Wrocław Główny', lat: 51.0988, lon: 17.0366, type: 'train', main: true },
  { id: 'wroclaw-mikolin', city: 'wroclaw', name: 'Wrocław Mikołajów', lat: 51.0985, lon: 17.0497, type: 'train', main: false },
  { id: 'wroclaw-nadodrze', city: 'wroclaw', name: 'Wrocław Nadodrze', lat: 51.1256, lon: 17.0296, type: 'train', main: false },

  // Poznań
  { id: 'poznan-glowny', city: 'poznan', name: 'Poznań Główny', lat: 52.4025, lon: 16.9118, type: 'train', main: true },
  { id: 'poznan-deczno', city: 'poznan', name: 'Poznań Dębiec', lat: 52.3789, lon: 16.9127, type: 'train', main: false },

  // Gdańsk - multiple stations
  { id: 'gdansk-glowny', city: 'gdansk', name: 'Gdańsk Główny', lat: 54.3562, lon: 18.6440, type: 'train', main: true },
  { id: 'gdansk-oliwa', city: 'gdansk', name: 'Gdańsk Oliwa', lat: 54.4042, lon: 18.5608, type: 'train', main: false },
  { id: 'gdansk-wrzeszcz', city: 'gdansk', name: 'Gdańsk Wrzeszcz', lat: 54.3768, lon: 18.6046, type: 'train', main: false },
  { id: 'gdynia-glowna', city: 'gdansk', name: 'Gdynia Główna', lat: 54.5235, lon: 18.5310, type: 'train', main: false },
  { id: 'sopot', city: 'gdansk', name: 'Sopot', lat: 54.4454, lon: 18.5626, type: 'train', main: false },

  // Łódź - multiple stations
  { id: 'lodz-fabryczna', city: 'lodz', name: 'Łódź Fabryczna', lat: 51.7680, lon: 19.4700, type: 'train', main: true },
  { id: 'lodz-kaliska', city: 'lodz', name: 'Łódź Kaliska', lat: 51.7607, lon: 19.4384, type: 'train', main: false },
  { id: 'lodz-widzew', city: 'lodz', name: 'Łódź Widzew', lat: 51.7718, lon: 19.5113, type: 'train', main: false },
  { id: 'lodz-chojny', city: 'lodz', name: 'Łódź Chojny', lat: 51.7266, lon: 19.4785, type: 'train', main: false },

  // Katowice
  { id: 'katowice', city: 'katowice', name: 'Katowice', lat: 50.2575, lon: 19.0180, type: 'train', main: true },
  { id: 'sosnowiec-glowny', city: 'katowice', name: 'Sosnowiec Główny', lat: 50.2876, lon: 19.1202, type: 'train', main: false },
  { id: 'gliwice', city: 'katowice', name: 'Gliwice', lat: 50.2989, lon: 18.6711, type: 'train', main: false },
  { id: 'chorzow-batory', city: 'katowice', name: 'Chorzów Batory', lat: 50.2850, lon: 18.9483, type: 'train', main: false },

  // Szczecin
  { id: 'szczecin-glowny', city: 'szczecin', name: 'Szczecin Główny', lat: 53.4300, lon: 14.5530, type: 'train', main: true },
  { id: 'szczecin-dabie', city: 'szczecin', name: 'Szczecin Dąbie', lat: 53.4087, lon: 14.5832, type: 'train', main: false },
  { id: 'szczecin-niebuszewo', city: 'szczecin', name: 'Szczecin Niebuszewo', lat: 53.4451, lon: 14.5391, type: 'train', main: false },

  // Bydgoszcz
  { id: 'bydgoszcz-glowna', city: 'bydgoszcz', name: 'Bydgoszcz Główna', lat: 53.1320, lon: 18.0010, type: 'train', main: true },
  { id: 'bydgoszcz-wschodnia', city: 'bydgoszcz', name: 'Bydgoszcz Wschodnia', lat: 53.1222, lon: 18.0501, type: 'train', main: false },

  // Lublin
  { id: 'lublin', city: 'lublin', name: 'Lublin', lat: 51.2310, lon: 22.5650, type: 'train', main: true },

  // Białystok
  { id: 'bialystok', city: 'bialystok', name: 'Białystok', lat: 53.1299, lon: 23.1491, type: 'train', main: true },

  // Rzeszów
  { id: 'rzeszow-glowny', city: 'rzeszow', name: 'Rzeszów Główny', lat: 50.0395, lon: 22.0031, type: 'train', main: true },

  // Toruń - multiple stations
  { id: 'torun-glowny', city: 'torun', name: 'Toruń Główny', lat: 53.0138, lon: 18.5984, type: 'train', main: true },
  { id: 'torun-miasto', city: 'torun', name: 'Toruń Miasto', lat: 53.0124, lon: 18.6047, type: 'train', main: false },

  // Olsztyn
  { id: 'olsztyn-glowny', city: 'olsztyn', name: 'Olsztyn Główny', lat: 53.7784, lon: 20.4801, type: 'train', main: true },

  // Opole
  { id: 'opole-glowne', city: 'opole', name: 'Opole Główne', lat: 50.6751, lon: 17.9213, type: 'train', main: true },

  // Kielce
  { id: 'kielce', city: 'kielce', name: 'Kielce', lat: 50.8661, lon: 20.6286, type: 'train', main: true },

  // Radom
  { id: 'radom', city: 'radom', name: 'Radom', lat: 51.3974, lon: 21.1549, type: 'train', main: true },

  // Częstochowa
  { id: 'czestochowa', city: 'czestochowa', name: 'Częstochowa', lat: 50.8129, lon: 19.1040, type: 'train', main: true },

  // Zakopane
  { id: 'zakopane', city: 'zakopane', name: 'Zakopane', lat: 49.2985, lon: 19.9558, type: 'train', main: true },
];

const BUS_STATIONS = [
  // Warszawa - multiple bus stations
  { id: 'warszawa-zachodnia-bus', city: 'warszawa', name: 'Warszawa Zachodnia (Dw. autobusowy)', lat: 52.2206, lon: 20.9656, type: 'bus', main: true },
  { id: 'warszawa-wileenska', city: 'warszawa', name: 'Warszawa Wileńska (Dw. autobusowy)', lat: 52.2529, lon: 21.0444, type: 'bus', main: false },
  { id: 'warszawa-mlociny', city: 'warszawa', name: 'Warszawa Młociny (Dw. autobusowy)', lat: 52.2975, lon: 20.9398, type: 'bus', main: false },

  // Kraków
  { id: 'krakow-bus', city: 'krakow', name: 'Kraków MDA (Dw. autobusowy)', lat: 50.0676, lon: 19.9476, type: 'bus', main: true },

  // Wrocław
  { id: 'wroclaw-bus', city: 'wroclaw', name: 'Wrocław (Dw. autobusowy)', lat: 51.0988, lon: 17.0366, type: 'bus', main: true },

  // Poznań - multiple bus stations
  { id: 'poznan-glogowska', city: 'poznan', name: 'Poznań Głogowska (Dw. autobusowy)', lat: 52.3951, lon: 16.9115, type: 'bus', main: true },
  { id: 'poznan-rataje', city: 'poznan', name: 'Poznań Rataje (Dw. autobusowy)', lat: 52.4081, lon: 16.9736, type: 'bus', main: false },

  // Gdańsk
  { id: 'gdansk-bus', city: 'gdansk', name: 'Gdańsk (Dw. autobusowy PKS)', lat: 54.3562, lon: 18.6440, type: 'bus', main: true },

  // Łódź
  { id: 'lodz-bus', city: 'lodz', name: 'Łódź Fabryczna (Dw. autobusowy)', lat: 51.7680, lon: 19.4700, type: 'bus', main: true },

  // Katowice - multiple bus stations
  { id: 'katowice-bus', city: 'katowice', name: 'Katowice (Dw. autobusowy PKS)', lat: 50.2584, lon: 19.0199, type: 'bus', main: true },
  { id: 'katowice-srodmiescie', city: 'katowice', name: 'Katowice Śródmieście (Dw. autobusowy)', lat: 50.2530, lon: 19.0216, type: 'bus', main: false },

  // Szczecin
  { id: 'szczecin-bus', city: 'szczecin', name: 'Szczecin (Dw. autobusowy)', lat: 53.4300, lon: 14.5530, type: 'bus', main: true },

  // Bydgoszcz
  { id: 'bydgoszcz-bus', city: 'bydgoszcz', name: 'Bydgoszcz (Dw. autobusowy PKS)', lat: 53.1320, lon: 18.0010, type: 'bus', main: true },

  // Lublin - multiple bus stations
  { id: 'lublin-bus', city: 'lublin', name: 'Lublin (Dw. autobusowy PKS)', lat: 51.2377, lon: 22.5625, type: 'bus', main: true },
  { id: 'lublin-bus2', city: 'lublin', name: 'Lublin al. Tysiąclecia (Dw. autobusowy)', lat: 51.2270, lon: 22.5735, type: 'bus', main: false },

  // Białystok
  { id: 'bialystok-bus', city: 'bialystok', name: 'Białystok (Dw. autobusowy PKS)', lat: 53.1325, lon: 23.1688, type: 'bus', main: true },

  // Rzeszów
  { id: 'rzeszow-bus', city: 'rzeszow', name: 'Rzeszów (Dw. autobusowy PKS)', lat: 50.0412, lon: 21.9991, type: 'bus', main: true },

  // Toruń
  { id: 'torun-bus', city: 'torun', name: 'Toruń (Dw. autobusowy PKS)', lat: 53.0138, lon: 18.5984, type: 'bus', main: true },

  // Olsztyn
  { id: 'olsztyn-bus', city: 'olsztyn', name: 'Olsztyn (Dw. autobusowy PKS)', lat: 53.7784, lon: 20.4801, type: 'bus', main: true },

  // Opole
  { id: 'opole-bus', city: 'opole', name: 'Opole (Dw. autobusowy PKS)', lat: 50.6751, lon: 17.9213, type: 'bus', main: true },

  // Kielce
  { id: 'kielce-bus', city: 'kielce', name: 'Kielce (Dw. autobusowy PKS)', lat: 50.8661, lon: 20.6286, type: 'bus', main: true },

  // Radom
  { id: 'radom-bus', city: 'radom', name: 'Radom (Dw. autobusowy PKS)', lat: 51.3974, lon: 21.1549, type: 'bus', main: true },

  // Częstochowa
  { id: 'czestochowa-bus', city: 'czestochowa', name: 'Częstochowa (Dw. autobusowy PKS)', lat: 50.8129, lon: 19.1040, type: 'bus', main: true },

  // Zakopane
  { id: 'zakopane-bus', city: 'zakopane', name: 'Zakopane (Dw. autobusowy PKS)', lat: 49.2985, lon: 19.9558, type: 'bus', main: true },

  // Zielona Góra
  { id: 'zielona-gora-bus', city: 'zielona_gora', name: 'Zielona Góra (Dw. autobusowy PKS)', lat: 51.9356, lon: 15.5062, type: 'bus', main: true },

  // Gorzów Wlkp.
  { id: 'gorzow-bus', city: 'gorzow', name: 'Gorzów Wlkp. (Dw. autobusowy PKS)', lat: 52.7325, lon: 15.2369, type: 'bus', main: true },
];

const ALL_STATIONS = [...TRAIN_STATIONS, ...BUS_STATIONS];

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Get all stations for a city (by city key)
export function getStationsForCity(cityKey) {
  return ALL_STATIONS.filter(s => s.city === cityKey);
}

// Get all train stations for a city
export function getTrainStationsForCity(cityKey) {
  return ALL_STATIONS.filter(s => s.city === cityKey && s.type === 'train');
}

// Get all bus stations for a city
export function getBusStationsForCity(cityKey) {
  return ALL_STATIONS.filter(s => s.city === cityKey && s.type === 'bus');
}

// Find the nearest station (any type) to given coordinates
export function findNearestStation(lat, lon, maxDistKm = 5) {
  let best = null;
  let bestDist = Infinity;

  for (const station of ALL_STATIONS) {
    const dist = haversineKm(lat, lon, station.lat, station.lon);
    if (dist < bestDist && dist <= maxDistKm) {
      bestDist = dist;
      best = { ...station, distKm: dist };
    }
  }

  return best;
}

// Find nearest train station to coordinates
export function findNearestTrainStation(lat, lon, maxDistKm = 10) {
  let best = null;
  let bestDist = Infinity;

  for (const station of TRAIN_STATIONS) {
    const dist = haversineKm(lat, lon, station.lat, station.lon);
    if (dist < bestDist && dist <= maxDistKm) {
      bestDist = dist;
      best = { ...station, distKm: dist };
    }
  }

  return best;
}

// Find nearest bus station to coordinates
export function findNearestBusStation(lat, lon, maxDistKm = 10) {
  let best = null;
  let bestDist = Infinity;

  for (const station of BUS_STATIONS) {
    const dist = haversineKm(lat, lon, station.lat, station.lon);
    if (dist < bestDist && dist <= maxDistKm) {
      bestDist = dist;
      best = { ...station, distKm: dist };
    }
  }

  return best;
}

// Find all stations within radius
export function findStationsWithinRadius(lat, lon, radiusKm = 5) {
  return ALL_STATIONS
    .map(s => ({ ...s, distKm: haversineKm(lat, lon, s.lat, s.lon) }))
    .filter(s => s.distKm <= radiusKm)
    .sort((a, b) => a.distKm - b.distKm);
}

// Find nearest stations of each type
export function findNearestStations(lat, lon, maxDistKm = 15) {
  const trainStation = findNearestTrainStation(lat, lon, maxDistKm);
  const busStation = findNearestBusStation(lat, lon, maxDistKm);

  return {
    train: trainStation,
    bus: busStation,
    nearest: trainStation && busStation
      ? (trainStation.distKm <= busStation.distKm ? trainStation : busStation)
      : (trainStation || busStation),
  };
}

// Detect which city a station belongs to
export function detectCityFromStation(stationName) {
  const name = stationName.toLowerCase();
  for (const station of ALL_STATIONS) {
    if (name.includes(station.name.toLowerCase().split(' ')[0].toLowerCase())) {
      return station.city;
    }
  }
  return null;
}

// Get all station names for a given city name
export function getStationNamesForCityName(cityName) {
  const nameLower = cityName.toLowerCase();
  const stations = ALL_STATIONS.filter(s =>
    s.name.toLowerCase().includes(nameLower) ||
    s.city.toLowerCase().includes(nameLower)
  );
  return stations.map(s => s.name);
}

// Get main station for a city
export function getMainStationForCity(cityKey, type = 'train') {
  return ALL_STATIONS.find(s => s.city === cityKey && s.type === type && s.main) || null;
}

export { ALL_STATIONS, TRAIN_STATIONS, BUS_STATIONS };
