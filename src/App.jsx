import { useState, useCallback } from 'react';
import SearchForm from './components/SearchForm';
import MapView from './components/MapView';
import RouteResults from './components/RouteResults';
import { searchRoutes, reverseGeocode } from './services/api';
import './App.css';

export default function App() {
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectingPoint, setSelectingPoint] = useState(null);

  const handleSearch = useCallback(async (options) => {
    if (!from || !to) return;

    setLoading(true);
    setError(null);

    try {
      const fromName = from.name.split(',')[0].trim();
      const toName = to.name.split(',')[0].trim();

      const data = await searchRoutes(fromName, toName, {
        date: options.date,
        time: options.time,
        fromLat: from.lat,
        fromLon: from.lon,
        toLat: to.lat,
        toLon: to.lon,
        multiModal: options.multiModal,
        sortBy: options.sortBy,
      });

      setResults(data);
    } catch (err) {
      setError(err.message || 'Nie udało się znaleźć połączeń');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  const handleMapClick = useCallback(async (e) => {
    if (!selectingPoint) return;

    const { lat, lng: lon } = e.latlng;

    try {
      const location = await reverseGeocode(lat, lon);
      const point = { name: location.name, lat, lon };

      if (selectingPoint === 'from') {
        setFrom(point);
      } else {
        setTo(point);
      }
    } catch {
      const point = {
        name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        lat,
        lon,
      };
      if (selectingPoint === 'from') {
        setFrom(point);
      } else {
        setTo(point);
      }
    }

    setSelectingPoint(null);
  }, [selectingPoint]);

  const handleSelectOnMap = useCallback((which) => {
    setSelectingPoint(prev => prev === which ? null : which);
  }, []);

  return (
    <div className="app">
      <div className="app__sidebar">
        <SearchForm
          from={from}
          to={to}
          onFromChange={setFrom}
          onToChange={setTo}
          onSearch={handleSearch}
          onSelectOnMap={handleSelectOnMap}
          loading={loading}
        />
        <RouteResults results={results} loading={loading} error={error} />
      </div>
      <div className="app__map">
        <MapView
          from={from}
          to={to}
          onMapClick={handleMapClick}
          selectingPoint={selectingPoint}
        />
      </div>
    </div>
  );
}
