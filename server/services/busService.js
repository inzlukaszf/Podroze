import fetch from 'node-fetch';

// Search intercity bus connections via e-podroznik.pl API
export async function searchEPodroznik(from, to, date) {
  try {
    const dateStr = date || new Date().toISOString().split('T')[0];

    // e-podroznik.pl is a government-supported transit aggregator
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
      provider: c.carrier || 'Bus',
      type: 'bus',
      busType: 'intercity',
      from: c.from || from,
      to: c.to || to,
      departure: c.departure || c.departureTime,
      arrival: c.arrival || c.arrivalTime,
      duration: c.duration || c.travelTime,
      carrier: c.carrier || c.operator,
      price: c.price ? { amount: c.price, currency: 'PLN' } : null,
    }));
  } catch (error) {
    console.error('e-podroznik search error:', error.message);
    return [];
  }
}

// Search FlixBus connections (operates extensively in Poland)
export async function searchFlixBus(fromCity, toCity, date) {
  try {
    const dateStr = date || new Date().toISOString().split('T')[0];

    // First, search for city IDs
    const fromSearch = await fetch(
      `https://global.api.flixbus.com/search/autocomplete/cities?q=${encodeURIComponent(fromCity)}&lang=pl&country=PL`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const toSearch = await fetch(
      `https://global.api.flixbus.com/search/autocomplete/cities?q=${encodeURIComponent(toCity)}&lang=pl&country=PL`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );

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
        duration: r.duration?.hours ? `${r.duration.hours}h ${r.duration.minutes || 0}m` : r.duration,
        carrier: 'FlixBus',
        price: r.price?.total ? { amount: r.price.total, currency: 'PLN' } : null,
        transfers: r.transfers || 0,
      }))
    );
  } catch (error) {
    console.error('FlixBus search error:', error.message);
    return [];
  }
}

// Search via PolskiBus / other carriers through global search
export async function searchBusConnections(from, to, date) {
  const [epResults, flixResults] = await Promise.all([
    searchEPodroznik(from, to, date),
    searchFlixBus(from, to, date),
  ]);

  return [...epResults, ...flixResults];
}
