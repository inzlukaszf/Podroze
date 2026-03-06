import fetch from 'node-fetch';

const KOLEO_BASE = 'https://koleo.pl/api/v2/main';
const BILKOM_BASE = 'https://bilkom.pl/stacje/szukaj';

// PKP station search via Koleo API
export async function searchStations(query) {
  try {
    const url = `${KOLEO_BASE}/stations?query=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-KOLEO-Version': '1',
        'X-KOLEO-Client': 'webapp',
      }
    });
    if (!response.ok) throw new Error(`Station search failed: ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data.map(s => ({
      id: s.id,
      name: s.name,
      nameSlug: s.name_slug || s.slug,
      lat: s.latitude || s.lat,
      lon: s.longitude || s.lon || s.lng,
      region: s.region,
      ilupp: s.ilupp_code,
    })) : [];
  } catch (error) {
    console.error('PKP station search error:', error.message);
    return [];
  }
}

// Search train connections via Koleo
export async function searchConnections(fromStation, toStation, date, time) {
  try {
    const dateStr = date || new Date().toISOString().split('T')[0];
    const timeStr = time || new Date().toTimeString().slice(0, 5);

    const url = `${KOLEO_BASE}/connections?` +
      `query[start_station]=${encodeURIComponent(fromStation)}&` +
      `query[end_station]=${encodeURIComponent(toStation)}&` +
      `query[date]=${dateStr}&` +
      `query[time]=${timeStr}&` +
      `query[only_direct]=false`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-KOLEO-Version': '1',
        'X-KOLEO-Client': 'webapp',
      }
    });

    if (!response.ok) {
      console.error('Koleo API error:', response.status, await response.text().catch(() => ''));
      return [];
    }

    const data = await response.json();
    const connections = data.connections || data || [];

    return Array.isArray(connections) ? connections.map(c => ({
      provider: 'PKP',
      type: 'train',
      trainType: c.train_type || c.brand?.name || 'Pociąg',
      trainNumber: c.train_number || c.train_name || '',
      from: c.start_station_name || fromStation,
      to: c.end_station_name || toStation,
      departure: c.departure_time || c.start_date,
      arrival: c.arrival_time || c.end_date,
      duration: c.travel_time || c.duration,
      transfers: c.changes || c.transfers || 0,
      legs: (c.parts || c.legs || []).map(leg => ({
        trainType: leg.train_type || leg.brand?.name || '',
        trainNumber: leg.train_number || '',
        from: leg.start_station_name || leg.from,
        to: leg.end_station_name || leg.to,
        departure: leg.departure_time || leg.start_date,
        arrival: leg.arrival_time || leg.end_date,
      })),
      price: c.price ? { amount: c.price / 100, currency: 'PLN' } : null,
    })) : [];
  } catch (error) {
    console.error('PKP connection search error:', error.message);
    return [];
  }
}

// Alternative: search via rozklad-pkp.pl (Polish Railways official timetable)
export async function searchRozkladPKP(from, to, date, time) {
  try {
    const dateStr = date || new Date().toISOString().split('T')[0];
    const timeStr = time || new Date().toTimeString().slice(0, 5);
    const [year, month, day] = dateStr.split('-');

    const url = 'https://rozklad-pkp.pl/pl/tp?' +
      `queryPageDisplayed=yes&` +
      `REQ0JourneyStopsS0A=1&REQ0JourneyStopsS0G=${encodeURIComponent(from)}&` +
      `REQ0JourneyStopsZ0A=1&REQ0JourneyStopsZ0G=${encodeURIComponent(to)}&` +
      `REQ0JourneyDate=${day}.${month}.${year}&` +
      `REQ0JourneyTime=${timeStr}&` +
      `REQ0HafasSearchForw=1&start=start`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        'Accept': 'text/html',
      }
    });

    if (!response.ok) return [];

    // Return raw HTML for potential parsing
    return { url, status: 'redirect_available' };
  } catch (error) {
    console.error('Rozklad PKP error:', error.message);
    return [];
  }
}
