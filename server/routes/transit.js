import { Router } from 'express';
import { findRoutes, findMultiModalRoute } from '../services/routePlanner.js';
import { searchStations } from '../services/pkpService.js';
import { listSupportedCities, detectCity, getCityTransitInfo } from '../services/ztmService.js';

const router = Router();

// Search for routes between two points
router.get('/search', async (req, res) => {
  try {
    const { from, to, date, time, fromLat, fromLon, toLat, toLon, multiModal } = req.query;

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

// Get supported cities with local transit
router.get('/cities', (req, res) => {
  res.json(listSupportedCities());
});

// Detect city from coordinates
router.get('/detect-city', (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });

  const cityKey = detectCity(parseFloat(lat), parseFloat(lon));
  const cityInfo = cityKey ? getCityTransitInfo(cityKey) : null;

  res.json({
    cityKey,
    cityInfo,
    detected: cityKey !== null,
  });
});

export default router;
