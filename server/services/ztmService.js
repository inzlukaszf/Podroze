import fetch from 'node-fetch';

// Polish cities with public transit, ticket pricing, and vehicle types
const CITY_TRANSIT = {
  warszawa: {
    name: 'ZTM Warszawa',
    operator: 'ZTM Warszawa',
    gtfsUrl: 'https://mkuran.pl/gtfs/warsaw.zip',
    hasMetro: true,
    hasTram: true,
    tickets: {
      single20min: { name: 'Bilet 20-minutowy', price: 3.40, minutes: 20 },
      single75min: { name: 'Bilet 75-minutowy', price: 4.40, minutes: 75 },
      single90min: { name: 'Bilet 90-minutowy (strefa 1+2)', price: 7.00, minutes: 90 },
      daily: { name: 'Bilet dobowy', price: 15.00, minutes: 1440 },
    },
    zones: ['1', '2'],
    vehicleTypes: ['autobus', 'tramwaj', 'metro', 'SKM', 'KM'],
    lat: 52.2297, lon: 21.0122, radius: 30,
  },
  krakow: {
    name: 'MPK Kraków',
    operator: 'MPK Kraków / ZTP',
    gtfsUrl: 'https://gtfs.ztp.krakow.pl/GTFS_KRK_T.zip',
    hasMetro: false,
    hasTram: true,
    tickets: {
      single20min: { name: 'Bilet 20-minutowy', price: 4.00, minutes: 20 },
      single50min: { name: 'Bilet 50-minutowy', price: 5.00, minutes: 50 },
      single90min: { name: 'Bilet 90-minutowy', price: 7.00, minutes: 90 },
      daily: { name: 'Bilet dobowy', price: 17.00, minutes: 1440 },
    },
    zones: ['I', 'II', 'III'],
    vehicleTypes: ['autobus', 'tramwaj'],
    lat: 50.0647, lon: 19.9450, radius: 20,
  },
  wroclaw: {
    name: 'MPK Wrocław',
    operator: 'MPK Wrocław',
    gtfsUrl: 'https://www.wroclaw.pl/open-data/opendata/its/data/gtfs.zip',
    hasMetro: false,
    hasTram: true,
    tickets: {
      single15min: { name: 'Bilet 15-minutowy', price: 2.40, minutes: 15 },
      single30min: { name: 'Bilet 30-minutowy', price: 3.40, minutes: 30 },
      single60min: { name: 'Bilet 60-minutowy', price: 4.60, minutes: 60 },
      single90min: { name: 'Bilet 90-minutowy', price: 5.40, minutes: 90 },
      daily: { name: 'Bilet dobowy', price: 13.00, minutes: 1440 },
    },
    zones: ['A', 'B', 'C'],
    vehicleTypes: ['autobus', 'tramwaj'],
    lat: 51.1079, lon: 17.0385, radius: 20,
  },
  poznan: {
    name: 'ZTM Poznań',
    operator: 'ZTM Poznań',
    gtfsUrl: 'https://www.ztm.poznan.pl/pl/dla-deweloperow/getGTFSFile',
    hasMetro: false,
    hasTram: true,
    tickets: {
      single15min: { name: 'Bilet 15-minutowy', price: 3.00, minutes: 15 },
      single40min: { name: 'Bilet 40-minutowy', price: 5.00, minutes: 40 },
      single60min: { name: 'Bilet 60-minutowy', price: 5.80, minutes: 60 },
      daily: { name: 'Bilet dobowy', price: 16.00, minutes: 1440 },
    },
    zones: ['A', 'B', 'C'],
    vehicleTypes: ['autobus', 'tramwaj'],
    lat: 52.4064, lon: 16.9252, radius: 20,
  },
  gdansk: {
    name: 'ZTM Gdańsk',
    operator: 'ZTM Gdańsk / ZKM Gdynia',
    gtfsUrl: 'https://ckan.multimediagdansk.pl/dataset/c24aa637-3619-4dc2-a171-a23eec8f2172/resource/30e783e4-2bec-4a7d-bb22-ee3e3b26ca96/download/gtfsgoogle.zip',
    hasMetro: false,
    hasTram: true,
    tickets: {
      single30min: { name: 'Bilet 30-minutowy', price: 3.20, minutes: 30 },
      single60min: { name: 'Bilet 60-minutowy', price: 4.80, minutes: 60 },
      daily: { name: 'Bilet 24-godzinny', price: 14.00, minutes: 1440 },
    },
    zones: ['1', '2'],
    vehicleTypes: ['autobus', 'tramwaj', 'SKM'],
    lat: 54.3520, lon: 18.6466, radius: 25,
  },
  lodz: {
    name: 'MPK Łódź',
    operator: 'MPK Łódź',
    gtfsUrl: 'https://otwartedane.lodz.pl/dataset/gtfs',
    hasMetro: false,
    hasTram: true,
    tickets: {
      single20min: { name: 'Bilet 20-minutowy', price: 3.00, minutes: 20 },
      single40min: { name: 'Bilet 40-minutowy', price: 3.80, minutes: 40 },
      single60min: { name: 'Bilet 60-minutowy', price: 4.60, minutes: 60 },
      daily: { name: 'Bilet dobowy', price: 14.00, minutes: 1440 },
    },
    zones: ['I', 'II'],
    vehicleTypes: ['autobus', 'tramwaj'],
    lat: 51.7592, lon: 19.4560, radius: 20,
  },
  katowice: {
    name: 'ZTM GZM (Metropolia)',
    operator: 'ZTM Metropolia GZM',
    gtfsUrl: 'https://otwartedane.metropoliagzm.pl/dataset/gtfs',
    hasMetro: false,
    hasTram: true,
    tickets: {
      single20min: { name: 'Bilet 20-minutowy', price: 3.00, minutes: 20 },
      single40min: { name: 'Bilet 40-minutowy', price: 4.00, minutes: 40 },
      single90min: { name: 'Bilet 90-minutowy', price: 5.60, minutes: 90 },
      daily: { name: 'Bilet dobowy', price: 16.00, minutes: 1440 },
    },
    zones: ['M', 'A', 'B', 'C', 'D'],
    vehicleTypes: ['autobus', 'tramwaj'],
    lat: 50.2649, lon: 19.0238, radius: 30,
  },
  szczecin: {
    name: 'ZDiTM Szczecin',
    operator: 'ZDiTM Szczecin',
    hasMetro: false,
    hasTram: true,
    tickets: {
      single30min: { name: 'Bilet 30-minutowy', price: 3.00, minutes: 30 },
      single60min: { name: 'Bilet 60-minutowy', price: 4.60, minutes: 60 },
      daily: { name: 'Bilet dobowy', price: 12.00, minutes: 1440 },
    },
    vehicleTypes: ['autobus', 'tramwaj'],
    lat: 53.4285, lon: 14.5528, radius: 20,
  },
  bydgoszcz: {
    name: 'ZDMiKP Bydgoszcz',
    operator: 'ZDMiKP Bydgoszcz',
    hasMetro: false,
    hasTram: true,
    tickets: {
      single15min: { name: 'Bilet 15-minutowy', price: 2.40, minutes: 15 },
      single30min: { name: 'Bilet 30-minutowy', price: 3.40, minutes: 30 },
      single60min: { name: 'Bilet 60-minutowy', price: 4.40, minutes: 60 },
      daily: { name: 'Bilet dobowy', price: 12.00, minutes: 1440 },
    },
    vehicleTypes: ['autobus', 'tramwaj'],
    lat: 53.1235, lon: 18.0084, radius: 15,
  },
  lublin: {
    name: 'ZTM Lublin',
    operator: 'ZTM Lublin',
    gtfsUrl: 'https://www.ztm.lublin.eu/inc/gtfs/google_transit.zip',
    hasMetro: false,
    hasTram: false,
    tickets: {
      single30min: { name: 'Bilet 30-minutowy', price: 3.40, minutes: 30 },
      single60min: { name: 'Bilet 60-minutowy', price: 4.40, minutes: 60 },
      daily: { name: 'Bilet dobowy', price: 12.00, minutes: 1440 },
    },
    vehicleTypes: ['autobus', 'trolejbus'],
    lat: 51.2465, lon: 22.5684, radius: 15,
  },
  bialystok: {
    name: 'BKM Białystok',
    operator: 'BKM Białystok',
    hasMetro: false,
    hasTram: false,
    tickets: {
      single30min: { name: 'Bilet 30-minutowy', price: 3.00, minutes: 30 },
      single60min: { name: 'Bilet 60-minutowy', price: 4.00, minutes: 60 },
      daily: { name: 'Bilet dobowy', price: 10.00, minutes: 1440 },
    },
    vehicleTypes: ['autobus'],
    lat: 53.1325, lon: 23.1688, radius: 15,
  },
  rzeszow: {
    name: 'ZTM Rzeszów',
    operator: 'ZTM Rzeszów',
    hasMetro: false,
    hasTram: false,
    tickets: {
      single30min: { name: 'Bilet 30-minutowy', price: 2.80, minutes: 30 },
      single60min: { name: 'Bilet 60-minutowy', price: 3.80, minutes: 60 },
      daily: { name: 'Bilet dobowy', price: 10.00, minutes: 1440 },
    },
    vehicleTypes: ['autobus'],
    lat: 50.0412, lon: 21.9991, radius: 15,
  },
  torun: {
    name: 'MZK Toruń',
    operator: 'MZK Toruń',
    hasMetro: false,
    hasTram: false,
    tickets: {
      single30min: { name: 'Bilet 30-minutowy', price: 2.60, minutes: 30 },
      single60min: { name: 'Bilet 60-minutowy', price: 3.60, minutes: 60 },
      daily: { name: 'Bilet dobowy', price: 11.00, minutes: 1440 },
    },
    vehicleTypes: ['autobus'],
    lat: 53.0138, lon: 18.5984, radius: 15,
  },
  olsztyn: {
    name: 'ZKM Olsztyn',
    operator: 'ZKM Olsztyn',
    hasMetro: false,
    hasTram: true,
    tickets: {
      single30min: { name: 'Bilet 30-minutowy', price: 2.80, minutes: 30 },
      single60min: { name: 'Bilet 60-minutowy', price: 3.80, minutes: 60 },
      daily: { name: 'Bilet dobowy', price: 11.00, minutes: 1440 },
    },
    vehicleTypes: ['autobus', 'tramwaj'],
    lat: 53.7784, lon: 20.4801, radius: 15,
  },
  opole: {
    name: 'MZK Opole',
    operator: 'MZK Opole',
    hasMetro: false,
    hasTram: false,
    tickets: {
      single30min: { name: 'Bilet 30-minutowy', price: 2.60, minutes: 30 },
      single60min: { name: 'Bilet 60-minutowy', price: 3.60, minutes: 60 },
      daily: { name: 'Bilet dobowy', price: 10.00, minutes: 1440 },
    },
    vehicleTypes: ['autobus'],
    lat: 50.6751, lon: 17.9213, radius: 15,
  },
  kielce: {
    name: 'ZTM Kielce',
    operator: 'ZTM Kielce',
    hasMetro: false,
    hasTram: false,
    tickets: {
      single30min: { name: 'Bilet 30-minutowy', price: 2.80, minutes: 30 },
      single60min: { name: 'Bilet 60-minutowy', price: 3.80, minutes: 60 },
      daily: { name: 'Bilet dobowy', price: 10.00, minutes: 1440 },
    },
    vehicleTypes: ['autobus'],
    lat: 50.8661, lon: 20.6286, radius: 15,
  },
  zielona_gora: {
    name: 'MZK Zielona Góra',
    operator: 'MZK Zielona Góra',
    hasMetro: false,
    hasTram: false,
    tickets: {
      single30min: { name: 'Bilet 30-minutowy', price: 2.60, minutes: 30 },
      single60min: { name: 'Bilet 60-minutowy', price: 3.40, minutes: 60 },
      daily: { name: 'Bilet dobowy', price: 9.00, minutes: 1440 },
    },
    vehicleTypes: ['autobus'],
    lat: 51.9356, lon: 15.5062, radius: 15,
  },
  gorzow: {
    name: 'MZK Gorzów Wlkp.',
    operator: 'MZK Gorzów Wlkp.',
    hasMetro: false,
    hasTram: false,
    tickets: {
      single30min: { name: 'Bilet 30-minutowy', price: 2.40, minutes: 30 },
      single60min: { name: 'Bilet 60-minutowy', price: 3.20, minutes: 60 },
      daily: { name: 'Bilet dobowy', price: 9.00, minutes: 1440 },
    },
    vehicleTypes: ['autobus'],
    lat: 52.7325, lon: 15.2369, radius: 15,
  },
};

// Detect which city a location belongs to based on coordinates
export function detectCity(lat, lon) {
  for (const [key, city] of Object.entries(CITY_TRANSIT)) {
    const dist = haversineKm(lat, lon, city.lat, city.lon);
    if (dist <= city.radius) return key;
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
  return CITY_TRANSIT[cityKey] || null;
}

// Estimate ticket price for a local transit journey based on duration
export function estimateLocalTicketPrice(cityKey, durationMinutes) {
  const city = CITY_TRANSIT[cityKey];
  if (!city || !city.tickets) return null;

  const sortedNonDaily = Object.values(city.tickets)
    .filter(t => t.minutes < 1440)
    .sort((a, b) => a.minutes - b.minutes);

  const cheapest = sortedNonDaily.find(t => t.minutes >= durationMinutes);
  const daily = city.tickets.daily;

  return {
    cheapest: cheapest || sortedNonDaily[sortedNonDaily.length - 1] || daily,
    daily,
    allOptions: Object.values(city.tickets),
    currency: 'PLN',
  };
}

// Map jakdojade/GTFS mode names to Polish vehicle types
function mapVehicleType(mode) {
  const map = {
    bus: 'autobus', BUS: 'autobus',
    tram: 'tramwaj', TRAM: 'tramwaj',
    metro: 'metro', METRO: 'metro',
    rail: 'kolej', RAIL: 'kolej',
    subway: 'metro', SUBWAY: 'metro',
    trolleybus: 'trolejbus', TROLLEYBUS: 'trolejbus',
    walk: 'pieszo', WALK: 'pieszo', walking: 'pieszo',
  };
  return map[mode] || mode || 'autobus';
}

// Vehicle type to icon hint
export function getVehicleIcon(vehicleType) {
  const icons = {
    autobus: 'bus',
    tramwaj: 'tram',
    metro: 'metro',
    kolej: 'train',
    SKM: 'train',
    KM: 'train',
    trolejbus: 'trolleybus',
    pieszo: 'walk',
  };
  return icons[vehicleType] || 'bus';
}

// Search jakdojade.pl - the main Polish local transit route planner
// Returns detailed legs with line numbers, vehicle types, stops, and estimated prices
export async function searchJakDojade(fromLat, fromLon, toLat, toLon, city, date, time) {
  try {
    const citySlug = city || 'warszawa';
    const dateStr = date || new Date().toISOString().split('T')[0];
    const timeStr = time || new Date().toTimeString().slice(0, 5);

    const url = `https://jakdojade.pl/api/v1/journey?` +
      `from_lat=${fromLat}&from_lon=${fromLon}&` +
      `to_lat=${toLat}&to_lon=${toLon}&` +
      `city=${citySlug}&` +
      `time_type=departure&` +
      `date=${dateStr}&` +
      `time=${timeStr}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      }
    });

    if (!response.ok) return [];
    const data = await response.json();

    const cityInfo = CITY_TRANSIT[citySlug];
    const journeys = data.journeys || data.routes || [];

    return journeys.map(j => {
      const legs = (j.legs || j.parts || []).map(l => {
        const vehicleType = mapVehicleType(l.mode || l.type);
        return {
          mode: vehicleType,
          modeIcon: getVehicleIcon(vehicleType),
          line: l.line || l.route || l.shortName || '',
          lineDirection: l.headsign || l.direction || '',
          from: l.from || l.startName || '',
          fromStop: l.startName || l.from_stop || l.from || '',
          to: l.to || l.endName || '',
          toStop: l.endName || l.to_stop || l.to || '',
          departure: l.departure || l.startTime,
          arrival: l.arrival || l.endTime,
          stops: l.stops || l.intermediateStops || [],
          stopsCount: (l.stops || l.intermediateStops || []).length,
          durationMinutes: l.duration ? Math.ceil(l.duration / 60) : null,
        };
      });

      // Calculate total duration in minutes
      let totalDuration = j.duration;
      if (typeof totalDuration === 'number' && totalDuration > 300) {
        totalDuration = Math.ceil(totalDuration / 60);
      }

      // Estimate ticket price
      const ticketEstimate = cityInfo
        ? estimateLocalTicketPrice(citySlug, totalDuration || 30)
        : null;

      // Line summary (e.g., "M1 -> 175 -> tramwaj 7")
      const linesSummary = legs
        .filter(l => l.mode !== 'pieszo')
        .map(l => {
          if (l.mode === 'metro') return `M${l.line || ''}`;
          return l.line || l.mode;
        })
        .join(' \u2192 ');

      return {
        provider: cityInfo?.operator || `Komunikacja miejska (${citySlug})`,
        type: 'local_transit',
        from: j.from || legs[0]?.from || 'Start',
        to: j.to || legs[legs.length - 1]?.to || 'Cel',
        departure: j.departure || legs[0]?.departure,
        arrival: j.arrival || legs[legs.length - 1]?.arrival,
        duration: totalDuration,
        durationMinutes: totalDuration,
        legs,
        linesSummary,
        transfers: Math.max(0, legs.filter(l => l.mode !== 'pieszo').length - 1),
        price: ticketEstimate?.cheapest
          ? { amount: ticketEstimate.cheapest.price, currency: 'PLN', ticketName: ticketEstimate.cheapest.name }
          : null,
        ticketOptions: ticketEstimate?.allOptions || [],
        cityKey: citySlug,
        cityName: cityInfo?.name || citySlug,
      };
    });
  } catch (error) {
    console.error('jakdojade search error:', error.message);
    return [];
  }
}

// Get GTFS download URL for a city
export function getGtfsUrl(cityKey) {
  return CITY_TRANSIT[cityKey]?.gtfsUrl || null;
}

// List all supported cities
export function listSupportedCities() {
  return Object.entries(CITY_TRANSIT).map(([key, val]) => ({
    key,
    name: val.name,
    operator: val.operator,
    hasGtfs: !!val.gtfsUrl,
    hasMetro: val.hasMetro,
    hasTram: val.hasTram,
    vehicleTypes: val.vehicleTypes,
    tickets: val.tickets,
  }));
}
