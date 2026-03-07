import { Router } from 'express';
import { findRoutes, findMultiModalRoute } from '../services/routePlanner.js';
import { searchStations } from '../services/pkpService.js';
import { listSupportedCities, detectCity, getCityTransitInfo } from '../services/ztmService.js';
import {
  ALL_STATIONS,
  findNearestStations,
  findStationsWithinRadius,
  getStationsForCity,
} from '../services/stationsService.js';

const router = Router();

// Search for routes between two points
router.get('/search', async (req, res) => {
  try {
    const {
      from, to, date, time,
      fromLat, fromLon, toLat, toLon,
      multiModal, sortBy,
      count,
    } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: 'Parameters "from" and "to" are required' });
    }

    const options = {
      date,
      time,
      fromLat: fromLat ? parseFloat(fromLat) : undefined,
      fromLon: fromLon ? parseFloat(fromLon) : undefined,
      toLat: toLat ? parseFloat(toLat) : undefined,
      toLon: toLon ? parseFloat(toLon) : undefined,
      sortBy: sortBy || 'departure',
      count: count ? parseInt(count) : 5,
    };

    const results = multiModal === 'true'
      ? await findMultiModalRoute(from, to, options)
      : await findRoutes(from, to, options);

    res.json(results);
  } catch (error) {
    console.error('Transit search error:', error);
    res.status(500).json({ error: 'Route search failed' });
  }
});

// Search for train stations
router.get('/stations', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });

    const stations = await searchStations(q);
    res.json(stations);
  } catch (error) {
    console.error('Station search error:', error);
    res.status(500).json({ error: 'Station search failed' });
  }
});

// Get all stations (train + bus) from local database
router.get('/stations/all', (req, res) => {
  const { type, city } = req.query;
  let stations = ALL_STATIONS;

  if (type) stations = stations.filter(s => s.type === type);
  if (city) stations = stations.filter(s => s.city === city);

  res.json(stations);
});

// Find nearest stations to coordinates
router.get('/stations/nearest', (req, res) => {
  const { lat, lon, radius } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });

  const radiusKm = radius ? parseFloat(radius) : 5;
  const nearby = findStationsWithinRadius(parseFloat(lat), parseFloat(lon), radiusKm);

  res.json({
    lat: parseFloat(lat),
    lon: parseFloat(lon),
    radiusKm,
    stations: nearby,
    nearest: findNearestStations(parseFloat(lat), parseFloat(lon), radiusKm * 3),
  });
});

// Get stations for a specific city
router.get('/stations/city/:cityKey', (req, res) => {
  const { cityKey } = req.params;
  const stations = getStationsForCity(cityKey);
  res.json({ cityKey, stations });
});

// Get supported cities with local transit
router.get('/cities', (req, res) => {
  res.json(listSupportedCities());
});

// Detect city from coordinates
router.get('/detect-city', (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });

  const parsedLat = parseFloat(lat);
  const parsedLon = parseFloat(lon);

  const cityKey = detectCity(parsedLat, parsedLon);
  const cityInfo = cityKey ? getCityTransitInfo(cityKey) : null;
  const nearbyStations = findStationsWithinRadius(parsedLat, parsedLon, 3);

  res.json({
    cityKey,
    cityInfo,
    detected: cityKey !== null,
    nearbyStations,
  });
});

export default router;
