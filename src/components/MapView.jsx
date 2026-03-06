import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
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
      map.setView([from.lat, from.lon], 12);
    } else if (to) {
      map.setView([to.lat, to.lon], 12);
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

export default function MapView({ from, to, onMapClick, selectingPoint }) {
  // Poland center
  const defaultCenter = [52.0693, 19.4803];
  const defaultZoom = 6;

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

        {from && (
          <Marker position={[from.lat, from.lon]} icon={startIcon}>
            <Popup>
              <strong>Start:</strong><br />
              {from.name}
            </Popup>
          </Marker>
        )}

        {to && (
          <Marker position={[to.lat, to.lon]} icon={endIcon}>
            <Popup>
              <strong>Cel:</strong><br />
              {to.name}
            </Popup>
          </Marker>
        )}

        {from && to && (
          <Polyline
            positions={[[from.lat, from.lon], [to.lat, to.lon]]}
            color="#3b82f6"
            weight={3}
            dashArray="10 6"
            opacity={0.7}
          />
        )}

        <FitBounds from={from} to={to} />
        <MapClickHandler onMapClick={onMapClick} />
      </MapContainer>
    </div>
  );
}
