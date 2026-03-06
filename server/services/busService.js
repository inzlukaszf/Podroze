import fetch from 'node-fetch';

// ==========================================
// Private and public bus carrier integrations
// ==========================================

// Search intercity bus connections via e-podroznik.pl API (government aggregator)
export async function searchEPodroznik(from, to, date) {
  try {
    const dateStr = date || new Date().toISOString().split('T')[0];

    const searchUrl = 'https://e-podroznik.pl/public/api/search?' +
      `from=${encodeURIComponent(from)}&` +
      `to=${encodeURIComponent(to)}&` +
      `date=${dateStr}&` +
      `means=BUS`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });

    if (!response.ok) return [];
    const data = await response.json();

    return (data.connections || data.results || []).map(c => ({
      provider: c.carrier || 'e-Podróżnik',
      type: 'bus',
      busType: 'intercity',
      from: c.from || from,
      to: c.to || to,
      departure: c.departure || c.departureTime,
      arrival: c.arrival || c.arrivalTime,
      duration: c.duration || c.travelTime,
      carrier: c.carrier || c.operator || 'Przewoźnik autobusowy',
      carrierType: 'public',
      price: c.price ? { amount: c.price, currency: 'PLN' } : null,
      legs: c.legs || c.parts || [],
    }));
  } catch (error) {
    console.error('e-podroznik search error:', error.message);
    return [];
  }
}

// FlixBus (largest private carrier in Poland)
export async function searchFlixBus(fromCity, toCity, date) {
  try {
    const dateStr = date || new Date().toISOString().split('T')[0];

    const [fromSearch, toSearch] = await Promise.all([
      fetch(
        `https://global.api.flixbus.com/search/autocomplete/cities?q=${encodeURIComponent(fromCity)}&lang=pl&country=PL`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      ),
      fetch(
        `https://global.api.flixbus.com/search/autocomplete/cities?q=${encodeURIComponent(toCity)}&lang=pl&country=PL`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      ),
    ]);

    if (!fromSearch.ok || !toSearch.ok) return [];

    const fromCities = await fromSearch.json();
    const toCities = await toSearch.json();

    if (!fromCities.length || !toCities.length) return [];

    const fromId = fromCities[0].id || fromCities[0].legacy?.id;
    const toId = toCities[0].id || toCities[0].legacy?.id;

    if (!fromId || !toId) return [];

    const searchUrl = `https://global.api.flixbus.com/search/service/v4/search?` +
      `from_city_id=${fromId}&to_city_id=${toId}&` +
      `departure_date=${dateStr}&` +
      `products=%7B%22adult%22%3A1%7D&currency=PLN&locale=pl&search_by=cities`;

    const searchResponse = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (!searchResponse.ok) return [];

    const searchData = await searchResponse.json();
    const trips = searchData.trips || [];

    return trips.flatMap(trip =>
      (trip.results || []).map(r => ({
        provider: 'FlixBus',
        type: 'bus',
        busType: 'intercity',
        from: fromCity,
        to: toCity,
        departure: r.departure?.date_time || r.departure,
        arrival: r.arrival?.date_time || r.arrival,
        duration: r.duration?.hours ? `${r.duration.hours}h ${r.duration.minutes || 0}min` : r.duration,
        carrier: 'FlixBus',
        carrierType: 'private',
        price: r.price?.total ? { amount: r.price.total, currency: 'PLN' } : null,
        transfers: r.transfers || 0,
        legs: (r.legs || []).map(leg => ({
          from: leg.departure?.name || leg.from,
          to: leg.arrival?.name || leg.to,
          departure: leg.departure?.date_time || leg.departure,
          arrival: leg.arrival?.date_time || leg.arrival,
          line: leg.line_direction || '',
          operator: 'FlixBus',
        })),
      }))
    );
  } catch (error) {
    console.error('FlixBus search error:', error.message);
    return [];
  }
}

// RegioJet (Leo Express / RegioJet - Czech carrier operating in Poland)
export async function searchRegioJet(from, to, date) {
  try {
    const dateStr = date || new Date().toISOString().split('T')[0];

    // RegioJet city search
    const fromRes = await fetch(
      `https://brn-ybus-pubapi.sa.cz/restapi/consts/locations?lang=pl&filterByType=CITY&filterByName=${encodeURIComponent(from)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }
    );

    const toRes = await fetch(
      `https://brn-ybus-pubapi.sa.cz/restapi/consts/locations?lang=pl&filterByType=CITY&filterByName=${encodeURIComponent(to)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }
    );

    if (!fromRes.ok || !toRes.ok) return [];

    const fromData = await fromRes.json();
    const toData = await toRes.json();

    if (!fromData.length || !toData.length) return [];

    const fromId = fromData[0].id;
    const toId = toData[0].id;

    const searchRes = await fetch(
      `https://brn-ybus-pubapi.sa.cz/restapi/routes/search/simple?` +
      `fromLocationId=${fromId}&toLocationId=${toId}&` +
      `departureDate=${dateStr}&locale=pl`,
      { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }
    );

    if (!searchRes.ok) return [];

    const routes = await searchRes.json();

    return (routes.routes || routes || []).slice(0, 10).map(r => ({
      provider: 'RegioJet',
      type: 'bus',
      busType: 'intercity',
      from,
      to,
      departure: r.departureTime || r.departure,
      arrival: r.arrivalTime || r.arrival,
      duration: r.travelTime || r.duration,
      carrier: 'RegioJet',
      carrierType: 'private',
      price: r.priceFrom ? { amount: r.priceFrom, currency: 'PLN' } : null,
      transfers: r.transfersCount || 0,
      vehicleTypes: r.vehicleTypes || [],
      legs: [],
    }));
  } catch (error) {
    console.error('RegioJet search error:', error.message);
    return [];
  }
}

// Sindbad / Eurolines (international carrier, domestic routes too)
export async function searchSindbad(from, to, date) {
  try {
    const dateStr = date || new Date().toISOString().split('T')[0];

    const searchUrl = `https://sindbad.pl/api/search?` +
      `from=${encodeURIComponent(from)}&` +
      `to=${encodeURIComponent(to)}&` +
      `date=${dateStr}&passengers=1`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      }
    });

    if (!response.ok) return [];
    const data = await response.json();

    return (data.routes || data.connections || []).map(r => ({
      provider: 'Sindbad / Eurolines',
      type: 'bus',
      busType: 'intercity',
      from: r.from || from,
      to: r.to || to,
      departure: r.departure,
      arrival: r.arrival,
      duration: r.duration,
      carrier: 'Sindbad',
      carrierType: 'private',
      price: r.price ? { amount: r.price, currency: 'PLN' } : null,
      transfers: r.transfers || 0,
      legs: [],
    }));
  } catch (error) {
    console.error('Sindbad search error:', error.message);
    return [];
  }
}

// PolskiBus (now part of FlixBus but some routes still branded separately)
// Handled via FlixBus API above

// Estimate intercity bus price based on distance if no API price available
export function estimateBusPrice(distanceKm) {
  if (!distanceKm || distanceKm <= 0) return null;

  // Average PLN per km for different carrier types
  const pricePerKm = {
    flixbus: 0.18,
    regiojet: 0.15,
    pksBus: 0.22,
    sindbad: 0.25,
    average: 0.20,
  };

  return {
    cheapest: {
      amount: Math.round(distanceKm * pricePerKm.regiojet * 100) / 100,
      carrier: 'RegioJet (szacunek)',
    },
    average: {
      amount: Math.round(distanceKm * pricePerKm.average * 100) / 100,
      carrier: 'Średnia cena',
    },
    expensive: {
      amount: Math.round(distanceKm * pricePerKm.sindbad * 100) / 100,
      carrier: 'Sindbad/PKS (szacunek)',
    },
    currency: 'PLN',
  };
}

// Combined search across all bus carriers
export async function searchBusConnections(from, to, date) {
  const [epResults, flixResults, regiojetResults, sindbadResults] = await Promise.all([
    searchEPodroznik(from, to, date),
    searchFlixBus(from, to, date),
    searchRegioJet(from, to, date),
    searchSindbad(from, to, date),
  ]);

  const all = [...epResults, ...flixResults, ...regiojetResults, ...sindbadResults];

  // Deduplicate similar departures (same carrier, same departure time)
  const seen = new Set();
  return all.filter(conn => {
    const key = `${conn.carrier}-${conn.departure}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
