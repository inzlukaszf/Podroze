import { FaTrain, FaBus, FaSubway, FaClock, FaExchangeAlt, FaMoneyBillWave } from 'react-icons/fa';

function getIcon(type) {
  switch (type) {
    case 'train': return <FaTrain />;
    case 'bus': return <FaBus />;
    case 'local_transit': return <FaSubway />;
    default: return <FaBus />;
  }
}

function formatTime(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      // Maybe it's already HH:MM format
      return dateStr.slice(0, 5);
    }
    return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
}

function formatDuration(duration) {
  if (!duration) return '';
  if (typeof duration === 'string') return duration;
  if (typeof duration === 'number') {
    const h = Math.floor(duration / 3600);
    const m = Math.floor((duration % 3600) / 60);
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  }
  return '';
}

function ConnectionCard({ connection }) {
  const typeLabel = {
    train: 'Pociąg',
    bus: 'Autobus',
    local_transit: 'Komunikacja miejska',
  };

  return (
    <div className={`connection-card connection-card--${connection.type}`}>
      <div className="connection-card__header">
        <span className="connection-card__icon">{getIcon(connection.type)}</span>
        <span className="connection-card__type">
          {connection.trainType || typeLabel[connection.type] || connection.provider}
        </span>
        {connection.trainNumber && (
          <span className="connection-card__number">{connection.trainNumber}</span>
        )}
        {connection.carrier && (
          <span className="connection-card__carrier">{connection.carrier}</span>
        )}
      </div>

      <div className="connection-card__times">
        <div className="connection-card__departure">
          <span className="connection-card__time-label">Odjazd</span>
          <span className="connection-card__time-value">{formatTime(connection.departure)}</span>
          <span className="connection-card__station">{connection.from}</span>
        </div>
        <div className="connection-card__arrow">→</div>
        <div className="connection-card__arrival">
          <span className="connection-card__time-label">Przyjazd</span>
          <span className="connection-card__time-value">{formatTime(connection.arrival)}</span>
          <span className="connection-card__station">{connection.to}</span>
        </div>
      </div>

      <div className="connection-card__details">
        {connection.duration && (
          <span className="connection-card__detail">
            <FaClock /> {formatDuration(connection.duration)}
          </span>
        )}
        {connection.transfers > 0 && (
          <span className="connection-card__detail">
            <FaExchangeAlt /> {connection.transfers} {connection.transfers === 1 ? 'przesiadka' : 'przesiadki'}
          </span>
        )}
        {connection.price && (
          <span className="connection-card__detail connection-card__price">
            <FaMoneyBillWave /> {connection.price.amount} {connection.price.currency}
          </span>
        )}
      </div>

      {connection.legs && connection.legs.length > 0 && (
        <div className="connection-card__legs">
          <details>
            <summary>Szczegóły trasy ({connection.legs.length} odcinków)</summary>
            {connection.legs.map((leg, i) => (
              <div key={i} className="connection-card__leg">
                <span className="connection-card__leg-icon">
                  {leg.mode === 'walk' ? '🚶' : getIcon(connection.type)}
                </span>
                <div className="connection-card__leg-info">
                  <div>
                    {leg.trainType || leg.line || ''} {leg.trainNumber || ''}
                  </div>
                  <div>
                    {formatTime(leg.departure)} {leg.from} → {formatTime(leg.arrival)} {leg.to}
                  </div>
                </div>
              </div>
            ))}
          </details>
        </div>
      )}
    </div>
  );
}

export default function RouteResults({ results, loading, error }) {
  if (loading) {
    return (
      <div className="route-results route-results--loading">
        <div className="spinner" />
        <p>Szukam połączeń...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="route-results route-results--error">
        <p>Błąd: {error}</p>
      </div>
    );
  }

  if (!results) return null;

  const { connections, multiModal, from, to, fromCity, toCity, sameCity } = results;

  return (
    <div className="route-results">
      <div className="route-results__header">
        <h2>
          {from} → {to}
        </h2>
        {fromCity && <p className="route-results__city-info">Miasto startowe: {fromCity}</p>}
        {toCity && <p className="route-results__city-info">Miasto docelowe: {toCity}</p>}
        {sameCity && <p className="route-results__same-city">Oba punkty w tym samym mieście — szukam komunikacji miejskiej</p>}
        <p className="route-results__count">
          Znaleziono {connections.length} połączeń
        </p>
      </div>

      {connections.length === 0 && (
        <div className="route-results__empty">
          <p>Nie znaleziono bezpośrednich połączeń.</p>
          <p>Spróbuj zmienić datę lub wyszukaj połączenia z przesiadkami.</p>
        </div>
      )}

      <div className="route-results__list">
        {connections.map((conn, i) => (
          <ConnectionCard key={i} connection={conn} />
        ))}
      </div>

      {multiModal && multiModal.length > 0 && (
        <div className="route-results__multimodal">
          <h3>Połączenia z przesiadką w dużym mieście</h3>
          {multiModal.map((route, i) => (
            <div key={i} className="route-results__multimodal-route">
              <h4>Przez: {route.via}</h4>
              <ConnectionCard connection={route.firstLeg} />
              <div className="route-results__transfer-indicator">
                <FaExchangeAlt /> Przesiadka w {route.via}
              </div>
              <ConnectionCard connection={route.secondLeg} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
