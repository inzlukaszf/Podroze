import { FaTrain, FaBus, FaSubway, FaClock, FaExchangeAlt, FaMoneyBillWave, FaWalking, FaTag, FaBolt, FaRoute, FaTram, FaTicketAlt } from 'react-icons/fa';
import { useState } from 'react';

function getModeIcon(mode) {
  switch (mode) {
    case 'metro': return <FaSubway />;
    case 'tramwaj': return <FaTram />;
    case 'autobus': return <FaBus />;
    case 'trolejbus': return <FaBus />;
    case 'kolej': case 'SKM': case 'KM': return <FaTrain />;
    case 'pieszo': return <FaWalking />;
    default: return <FaBus />;
  }
}

function getTypeIcon(type) {
  switch (type) {
    case 'train': return <FaTrain />;
    case 'bus': return <FaBus />;
    case 'local_transit': return <FaSubway />;
    default: return <FaBus />;
  }
}

function formatTime(dateStr) {
  if (!dateStr) return '\u2014';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.slice(0, 5);
    return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
}

function formatDuration(duration) {
  if (!duration) return '';
  if (typeof duration === 'string') return duration;
  if (typeof duration === 'number') {
    if (duration > 300) duration = Math.ceil(duration / 60);
    const h = Math.floor(duration / 60);
    const m = duration % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  }
  return '';
}

function TagBadge({ tag }) {
  const config = {
    'najszybsza': { icon: <FaBolt />, className: 'tag--fastest' },
    'najtańsza': { icon: <FaMoneyBillWave />, className: 'tag--cheapest' },
    'najmniej przesiadek': { icon: <FaRoute />, className: 'tag--fewest' },
  };
  const c = config[tag] || { icon: <FaTag />, className: '' };
  return (
    <span className={`connection-card__tag ${c.className}`}>
      {c.icon} {tag}
    </span>
  );
}

function LegDetail({ leg, isLocal }) {
  const isWalk = leg.mode === 'pieszo' || leg.mode === 'walk';

  return (
    <div className={`leg-detail ${isWalk ? 'leg-detail--walk' : ''}`}>
      <div className="leg-detail__icon">
        {getModeIcon(leg.mode || leg.trainType || 'autobus')}
      </div>
      <div className="leg-detail__content">
        <div className="leg-detail__header">
          {!isWalk && (
            <span className="leg-detail__line">
              {leg.mode === 'metro' && 'M'}{leg.line || leg.trainNumber || ''}
            </span>
          )}
          {!isWalk && leg.mode && (
            <span className="leg-detail__mode">{leg.mode}</span>
          )}
          {leg.lineDirection && (
            <span className="leg-detail__direction">kier. {leg.lineDirection}</span>
          )}
          {isWalk && <span className="leg-detail__mode">pieszo</span>}
        </div>
        <div className="leg-detail__times">
          <span>{formatTime(leg.departure)}</span>
          <span className="leg-detail__stop">{leg.fromStop || leg.from}</span>
          <span className="leg-detail__arrow">\u2192</span>
          <span>{formatTime(leg.arrival)}</span>
          <span className="leg-detail__stop">{leg.toStop || leg.to}</span>
        </div>
        {leg.stopsCount > 0 && (
          <span className="leg-detail__stops">{leg.stopsCount} przystanków</span>
        )}
        {leg.durationMinutes && (
          <span className="leg-detail__duration">{leg.durationMinutes} min</span>
        )}
      </div>
    </div>
  );
}

function TicketOptions({ ticketOptions, recommended }) {
  const [expanded, setExpanded] = useState(false);

  if (!ticketOptions || ticketOptions.length === 0) return null;

  return (
    <div className="ticket-options">
      <button
        className="ticket-options__toggle"
        onClick={() => setExpanded(!expanded)}
      >
        <FaTicketAlt /> {expanded ? 'Ukryj bilety' : 'Pokaż dostępne bilety'}
      </button>
      {expanded && (
        <div className="ticket-options__list">
          {ticketOptions.map((t, i) => (
            <div
              key={i}
              className={`ticket-options__item ${recommended && t.price === recommended.amount ? 'ticket-options__item--recommended' : ''}`}
            >
              <span className="ticket-options__name">{t.name}</span>
              <span className="ticket-options__price">{t.price.toFixed(2)} PLN</span>
              {recommended && t.price === recommended.amount && (
                <span className="ticket-options__badge">zalecany</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ConnectionCard({ connection }) {
  const typeLabel = {
    train: 'Pociąg',
    bus: 'Autobus',
    local_transit: 'Komunikacja miejska',
  };

  const isLocal = connection.type === 'local_transit';

  return (
    <div className={`connection-card connection-card--${connection.type}`}>
      {/* Tags (fastest, cheapest, etc.) */}
      {connection.tags && connection.tags.length > 0 && (
        <div className="connection-card__tags">
          {connection.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
        </div>
      )}

      <div className="connection-card__header">
        <span className="connection-card__icon">{getTypeIcon(connection.type)}</span>
        <span className="connection-card__type">
          {connection.trainType || typeLabel[connection.type] || connection.provider}
        </span>
        {connection.trainNumber && (
          <span className="connection-card__number">{connection.trainNumber}</span>
        )}
        {connection.linesSummary && (
          <span className="connection-card__lines-summary">{connection.linesSummary}</span>
        )}
        {connection.carrier && (
          <span className={`connection-card__carrier ${connection.carrierType === 'private' ? 'connection-card__carrier--private' : ''}`}>
            {connection.carrier}
          </span>
        )}
      </div>

      <div className="connection-card__times">
        <div className="connection-card__departure">
          <span className="connection-card__time-label">Odjazd</span>
          <span className="connection-card__time-value">{formatTime(connection.departure)}</span>
          <span className="connection-card__station">{connection.from}</span>
        </div>
        <div className="connection-card__arrow">\u2192</div>
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
            <FaMoneyBillWave />
            {typeof connection.price.amount === 'number'
              ? `${connection.price.amount.toFixed(2)} ${connection.price.currency}`
              : `${connection.price.amount} ${connection.price.currency}`}
            {connection.price.estimated && <span className="connection-card__estimated"> (szacunek)</span>}
          </span>
        )}
        {connection.price?.ticketName && (
          <span className="connection-card__detail connection-card__ticket-name">
            <FaTicketAlt /> {connection.price.ticketName}
          </span>
        )}
      </div>

      {/* Price range for estimated bus prices */}
      {connection.priceRange && (
        <div className="connection-card__price-range">
          <span>Zakres cen: </span>
          <span className="connection-card__price-range-cheap">
            od {connection.priceRange.cheapest.amount.toFixed(2)} PLN
          </span>
          <span> do </span>
          <span className="connection-card__price-range-exp">
            {connection.priceRange.expensive.amount.toFixed(2)} PLN
          </span>
        </div>
      )}

      {/* Detailed legs with line numbers and vehicle types */}
      {connection.legs && connection.legs.length > 0 && (
        <div className="connection-card__legs">
          <details>
            <summary>
              Szczegóły trasy ({connection.legs.filter(l => l.mode !== 'pieszo' && l.mode !== 'walk').length} odcinków
              {isLocal && connection.linesSummary ? ` \u2014 ${connection.linesSummary}` : ''})
            </summary>
            <div className="connection-card__legs-list">
              {connection.legs.map((leg, i) => (
                <LegDetail key={i} leg={leg} isLocal={isLocal} />
              ))}
            </div>
          </details>
        </div>
      )}

      {/* Ticket options for local transit */}
      {isLocal && connection.ticketOptions && connection.ticketOptions.length > 0 && (
        <TicketOptions
          ticketOptions={connection.ticketOptions}
          recommended={connection.price}
        />
      )}
    </div>
  );
}

export default function RouteResults({ results, loading, error }) {
  if (loading) {
    return (
      <div className="route-results route-results--loading">
        <div className="spinner" />
        <p>Szukam połączeń u wszystkich przewoźników...</p>
        <p className="route-results__loading-sub">PKP, FlixBus, RegioJet, Sindbad, ZTM/MPK...</p>
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

  const { connections, multiModal, from, to, fromCity, toCity, sameCity, sortedBy } = results;

  const sortLabel = {
    departure: 'czasu odjazdu',
    fastest: 'najkrótszego czasu podróży',
    cheapest: 'najniższej ceny',
    fewest_transfers: 'najmniejszej liczby przesiadek',
  };

  return (
    <div className="route-results">
      <div className="route-results__header">
        <h2>{from} \u2192 {to}</h2>
        {fromCity && <p className="route-results__city-info">Miasto startowe: {fromCity}</p>}
        {toCity && <p className="route-results__city-info">Miasto docelowe: {toCity}</p>}
        {sameCity && <p className="route-results__same-city">Oba punkty w tym samym mieście — szukam komunikacji miejskiej</p>}
        <p className="route-results__count">
          Znaleziono {connections.length} połączeń
          {sortedBy && ` (wg ${sortLabel[sortedBy] || sortedBy})`}
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
              {route.totalPrice && (
                <p className="route-results__multimodal-price">
                  <FaMoneyBillWave /> Łączny koszt: {route.totalPrice.amount.toFixed(2)} PLN
                </p>
              )}
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
