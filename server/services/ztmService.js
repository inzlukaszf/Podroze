import fetch from 'node-fetch';

// Polish cities with known public GTFS/API endpoints
const CITY_TRANSIT_APIS = {
  warszawa: {
    name: 'ZTM Warszawa',
    apiBase: 'https://api.um.warszawa.pl/api/action',
    apiKey: '', // Free API key from api.um.warszawa.pl
    routeSearchUrl: 'https://www.ztm.waw.pl',
    gtfsUrl: 'https://mkuran.pl/gtfs/warsaw.zip',
  },
  krakow: {
    name: 'MPK Kraków',
    apiBase: 'http://ttss.mpk.krakow.pl',
    routeSearchUrl: 'https://mpk.krakow.pl',
    gtfsUrl: 'https://gtfs.ztp.krakow.pl/GTFS_KRK_T.zip',
  },
  wroclaw: {
    name: 'MPK Wrocław',
    apiBase: 'https://www.wroclaw.pl/open-data',
    routeSearchUrl: 'https://mpk.wroc.pl',
    gtfsUrl: 'https://www.wroclaw.pl/open-data/opendata/its/data/gtfs.zip',
  },
  poznan: {
    name: 'ZTM Poznań',
    routeSearchUrl: 'https://www.ztm.poznan.pl',
    gtfsUrl: 'https://www.ztm.poznan.pl/pl/dla-deweloperow/getGTFSFile',
  },
  gdansk: {
    name: 'ZTM Gdańsk',
    apiBase: 'https://ckan.multimediagdansk.pl/dataset',
    routeSearchUrl: 'https://ztm.gda.pl',
    gtfsUrl: 'https://ckan.multimediagdansk.pl/dataset/c24aa637-3619-4dc2-a171-a23eec8f2172/resource/30e783e4-2bec-4a7d-bb22-ee3e3b26ca96/download/gtfsgoogle.zip',
  },
  lodz: {
    name: 'MPK Łódź',
    routeSearchUrl: 'https://www.mpk.lodz.pl',
    gtfsUrl: 'https://otwartedane.lodz.pl/dataset/gtfs',
  },
  katowice: {
    name: 'ZTM Katowice (GZM)',
    routeSearchUrl: 'https://rj.metropoliaztm.pl',
    gtfsUrl: 'https://otwartedane.metropoliagzm.pl/dataset/gtfs',
  },
  szczecin: {
    name: 'ZDiTM Szczecin',
    routeSearchUrl: 'https://www.zditm.szczecin.pl',
  },
  bydgoszcz: {
    name: 'ZDMiKP Bydgoszcz',
    routeSearchUrl: 'https://www.zdmikp.bydgoszcz.pl',
  },
  lublin: {
    name: 'ZTM Lublin',
    routeSearchUrl: 'https://www.ztm.lublin.eu',
    gtfsUrl: 'https://www.ztm.lublin.eu/inc/gtfs/google_transit.zip',
  },
  bialystok: {
    name: 'BKM Białystok',
    routeSearchUrl: 'https://www.komunikacja.bialystok.pl',
  },
  rzeszow: {
    name: 'ZTM Rzeszów',
    routeSearchUrl: 'https://ztm.rzeszow.pl',
  },
  torun: {
    name: 'MZK Toruń',
    routeSearchUrl: 'https://www.mzk-torun.pl',
  },
  olsztyn: {
    name: 'ZKM Olsztyn',
    routeSearchUrl: 'https://www.zkm.olsztyn.eu',
  },
  opole: {
    name: 'MZK Opole',
    routeSearchUrl: 'https://www.mzkopole.pl',
  },
  kielce: {
    name: 'ZTM Kielce',
    routeSearchUrl: 'https://ztm.kielce.pl',
  },
  zielona_gora: {
    name: 'MZK Zielona Góra',
    routeSearchUrl: 'https://www.mzk.zgora.pl',
  },
  gorzow: {
    name: 'MZK Gorzów Wlkp.',
    routeSearchUrl: 'https://www.mzk-gorzow.com.pl',
  },
};

// Detect which city a location belongs to based on coordinates
export function detectCity(lat, lon) {
  const cities = [
    { key: 'warszawa', lat: 52.2297, lon: 21.0122, radius: 30 },
    { key: 'krakow', lat: 50.0647, lon: 19.9450, radius: 20 },
    { key: 'wroclaw', lat: 51.1079, lon: 17.0385, radius: 20 },
    { key: 'poznan', lat: 52.4064, lon: 16.9252, radius: 20 },
    { key: 'gdansk', lat: 54.3520, lon: 18.6466, radius: 25 },
    { key: 'lodz', lat: 51.7592, lon: 19.4560, radius: 20 },
    { key: 'katowice', lat: 50.2649, lon: 19.0238, radius: 30 },
    { key: 'szczecin', lat: 53.4285, lon: 14.5528, radius: 20 },
    { key: 'bydgoszcz', lat: 53.1235, lon: 18.0084, radius: 15 },
    { key: 'lublin', lat: 51.2465, lon: 22.5684, radius: 15 },
    { key: 'bialystok', lat: 53.1325, lon: 23.1688, radius: 15 },
    { key: 'rzeszow', lat: 50.0412, lon: 21.9991, radius: 15 },
    { key: 'torun', lat: 53.0138, lon: 18.5984, radius: 15 },
    { key: 'olsztyn', lat: 53.7784, lon: 20.4801, radius: 15 },
    { key: 'opole', lat: 50.6751, lon: 17.9213, radius: 15 },
    { key: 'kielce', lat: 50.8661, lon: 20.6286, radius: 15 },
    { key: 'zielona_gora', lat: 51.9356, lon: 15.5062, radius: 15 },
    { key: 'gorzow', lat: 52.7325, lon: 15.2369, radius: 15 },
  ];

  for (const city of cities) {
    const dist = haversineKm(lat, lon, city.lat, city.lon);
    if (dist <= city.radius) return city.key;
  }
  return null;
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

// Get city transit info
export function getCityTransitInfo(cityKey) {
  return CITY_TRANSIT_APIS[cityKey] || null;
}

// Search Warsaw ZTM routes (example of city-specific integration)
export async function searchWarsawZTM(from, to) {
  try {
    // Warsaw has a public timetable API at api.um.warszawa.pl
    // For route planning, we redirect to jakdojade.pl which aggregates local transit
    return {
      provider: 'ZTM Warszawa',
      redirectUrl: `https://jakdojade.pl/warszawa/trasa/?fn=${encodeURIComponent(from)}&tn=${encodeURIComponent(to)}`,
      type: 'local_transit',
    };
  } catch (error) {
    console.error('Warsaw ZTM error:', error.message);
    return null;
  }
}

// Search jakdojade.pl - the main Polish local transit route planner
// Covers ALL Polish cities with public transport
export async function searchJakDojade(fromLat, fromLon, toLat, toLon, city) {
  try {
    const citySlug = city || 'warszawa';
    // jakdojade.pl API endpoint for route planning
    const url = `https://jakdojade.pl/api/v1/journey?` +
      `from_lat=${fromLat}&from_lon=${fromLon}&` +
      `to_lat=${toLat}&to_lon=${toLon}&` +
      `city=${citySlug}&` +
      `time_type=departure&` +
      `date=${new Date().toISOString().split('T')[0]}&` +
      `time=${new Date().toTimeString().slice(0, 5)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      }
    });

    if (!response.ok) return [];
    const data = await response.json();

    return (data.journeys || data.routes || []).map(j => ({
      provider: `Komunikacja miejska (${citySlug})`,
      type: 'local_transit',
      from: j.from || 'Start',
      to: j.to || 'Cel',
      departure: j.departure,
      arrival: j.arrival,
      duration: j.duration,
      legs: (j.legs || j.parts || []).map(l => ({
        mode: l.mode || l.type,
        line: l.line || l.route,
        from: l.from,
        to: l.to,
        departure: l.departure,
        arrival: l.arrival,
        stops: l.stops || l.intermediateStops,
      })),
    }));
  } catch (error) {
    console.error('jakdojade search error:', error.message);
    return [];
  }
}

// Get GTFS download URL for a city
export function getGtfsUrl(cityKey) {
  const city = CITY_TRANSIT_APIS[cityKey];
  return city?.gtfsUrl || null;
}

// List all supported cities
export function listSupportedCities() {
  return Object.entries(CITY_TRANSIT_APIS).map(([key, val]) => ({
    key,
    name: val.name,
    hasGtfs: !!val.gtfsUrl,
    hasApi: !!val.apiBase,
    routeSearchUrl: val.routeSearchUrl,
  }));
}
