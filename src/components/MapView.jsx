import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Small blue icon for train stations
const trainStationIcon = new L.DivIcon({
  html: '<div style="background:#2563eb;width:10px;height:10px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>',
  iconSize: [10, 10],
  iconAnchor: [5, 5],
  className: '',
});

// Small orange icon for bus stations
const busStationIcon = new L.DivIcon({
  html: '<div style="background:#ea580c;width:10px;height:10px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>',
  iconSize: [10, 10],
  iconAnchor: [5, 5],
  className: '',
});

// Component to fit map bounds when markers change
function FitBounds({ from, to }) {
  const map = useMap();

  useEffect(() => {
    if (from && to) {
      const bounds = L.latLngBounds([
        [from.lat, from.lon],
        [to.lat, to.lon],
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (from) {
      map.setView([from.lat, from.lon], 13);
    } else if (to) {
      map.setView([to.lat, to.lon], 13);
    }
  }, [from, to, map]);

  return null;
}

function MapClickHandler({ onMapClick }) {
  const map = useMap();

  useEffect(() => {
    if (!onMapClick) return;
    map.on('click', onMapClick);
    return () => map.off('click', onMapClick);
  }, [map, onMapClick]);

  return null;
}

// Fetch nearby stations from backend
async function fetchNearbyStations(lat, lon) {
  try {
    const res = await fetch(`/api/transit/stations/nearest?lat=${lat}&lon=${lon}&radius=3`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.stations || [];
  } catch {
    return [];
  }
}

export default function MapView({ from, to, onMapClick, selectingPoint }) {
  const defaultCenter = [52.0693, 19.4803];
  const defaultZoom = 6;

  const [fromStations, setFromStations] = useState([]);
  const [toStations, setToStations] = useState([]);

  // Fetch nearby stations when from/to coordinates change
  useEffect(() => {
    if (from?.lat && from?.lon) {
      fetchNearbyStations(from.lat, from.lon).then(setFromStations);
    } else {
      setFromStations([]);
    }
  }, [from?.lat, from?.lon]);

  useEffect(() => {
    if (to?.lat && to?.lon) {
      fetchNearbyStations(to.lat, to.lon).then(setToStations);
    } else {
      setToStations([]);
    }
  }, [to?.lat, to?.lon]);

  return (
    <div className={`map-view ${selectingPoint ? 'map-view--selecting' : ''}`}>
      {selectingPoint && (
        <div className="map-view__selecting-hint">
          Kliknij na mapę aby wybrać punkt {selectingPoint === 'from' ? 'startowy' : 'docelowy'}
        </div>
      )}
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="map-view__container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Start marker */}
        {from && (
          <Marker position={[from.lat, from.lon]} icon={startIcon}>
            <Popup>
              <strong>Start:</strong><br />
              {from.name}
            </Popup>
          </Marker>
        )}

        {/* End marker */}
        {to && (
          <Marker position={[to.lat, to.lon]} icon={endIcon}>
            <Popup>
              <strong>Cel:</strong><br />
              {to.name}
            </Popup>
          </Marker>
        )}

        {/* Route line */}
        {from && to && (
          <Polyline
            positions={[[from.lat, from.lon], [to.lat, to.lon]]}
            color="#3b82f6"
            weight={3}
            dashArray="10 6"
            opacity={0.7}
          />
        )}

        {/* Nearby stations at start point */}
        {fromStations.map(station => (
          <Marker
            key={`from-${station.id}`}
            position={[station.lat, station.lon]}
            icon={station.type === 'train' ? trainStationIcon : busStationIcon}
          >
            <Popup>
              <strong>{station.type === 'train' ? '🚂' : '🚌'} {station.name}</strong><br />
              {(station.distKm * 1000).toFixed(0)} m od punktu startowego
            </Popup>
          </Marker>
        ))}

        {/* Nearby stations at end point */}
        {toStations.map(station => (
          <Marker
            key={`to-${station.id}`}
            position={[station.lat, station.lon]}
            icon={station.type === 'train' ? trainStationIcon : busStationIcon}
          >
            <Popup>
              <strong>{station.type === 'train' ? '🚂' : '🚌'} {station.name}</strong><br />
              {(station.distKm * 1000).toFixed(0)} m od punktu docelowego
            </Popup>
          </Marker>
        ))}

        <FitBounds from={from} to={to} />
        <MapClickHandler onMapClick={onMapClick} />
      </MapContainer>

      {/* Station legend */}
      {(fromStations.length > 0 || toStations.length > 0) && (
        <div className="map-view__legend">
          <span className="map-view__legend-item map-view__legend-train">
            <span className="map-view__legend-dot map-view__legend-dot--train" /> Dworzec kolejowy
          </span>
          <span className="map-view__legend-item map-view__legend-bus">
            <span className="map-view__legend-dot map-view__legend-dot--bus" /> Dworzec autobusowy
          </span>
        </div>
      )}
    </div>
  );
}
