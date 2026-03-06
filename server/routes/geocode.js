import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();

// Geocode using OpenStreetMap Nominatim (free, no key required)
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });

    const url = `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(q + ', Polska')}&format=json&limit=8&countrycodes=pl&accept-language=pl`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'PodrozeApp/1.0' }
    });
    const data = await response.json();

    const results = data.map(item => ({
      name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      type: item.type,
      osmId: item.osm_id,
    }));

    res.json(results);
  } catch (error) {
    console.error('Geocode error:', error);
    res.status(500).json({ error: 'Geocoding failed' });
  }
});

// Reverse geocode
router.get('/reverse', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=pl`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'PodrozeApp/1.0' }
    });
    const data = await response.json();
    res.json({
      name: data.display_name,
      lat: parseFloat(data.lat),
      lon: parseFloat(data.lon),
    });
  } catch (error) {
    console.error('Reverse geocode error:', error);
    res.status(500).json({ error: 'Reverse geocoding failed' });
  }
});

export default router;
