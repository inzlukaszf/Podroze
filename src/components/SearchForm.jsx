import { useState } from 'react';
import LocationSearch from './LocationSearch';
import { FaSearch, FaExchangeAlt, FaMapMarkerAlt, FaClock, FaBolt, FaMoneyBillWave, FaRoute, FaHourglass } from 'react-icons/fa';

const SORT_OPTIONS = [
  { value: 'departure', label: 'Czas odjazdu', icon: <FaClock /> },
  { value: 'fastest', label: 'Najszybsza', icon: <FaBolt /> },
  { value: 'cheapest', label: 'Najtańsza', icon: <FaMoneyBillWave /> },
  { value: 'fewest_transfers', label: 'Mniej przesiadek', icon: <FaRoute /> },
  { value: 'min_wait', label: 'Min. oczekiwanie', icon: <FaHourglass /> },
];

export default function SearchForm({ from, to, onFromChange, onToChange, onSearch, onSelectOnMap, loading }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [multiModal, setMultiModal] = useState(true);
  const [sortBy, setSortBy] = useState('departure');

  function handleSwap() {
    const temp = from;
    onFromChange(to);
    onToChange(temp);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!from || !to) return;
    onSearch({ date, time, multiModal, sortBy });
  }

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <h1 className="search-form__title">Podróże</h1>
      <p className="search-form__subtitle">Wyszukiwarka połączeń komunikacji publicznej w Polsce</p>

      <div className="search-form__locations">
        <div className="search-form__location-row">
          <LocationSearch
            label="Skąd"
            value={from}
            onChange={onFromChange}
            placeholder="Wpisz adres, miasto lub dworzec..."
          />
          <button
            type="button"
            className="search-form__map-btn"
            onClick={() => onSelectOnMap('from')}
            title="Wybierz na mapie"
          >
            <FaMapMarkerAlt />
          </button>
        </div>

        <button
          type="button"
          className="search-form__swap-btn"
          onClick={handleSwap}
          title="Zamień kierunek"
        >
          <FaExchangeAlt />
        </button>

        <div className="search-form__location-row">
          <LocationSearch
            label="Dokąd"
            value={to}
            onChange={onToChange}
            placeholder="Wpisz adres, miasto lub dworzec..."
          />
          <button
            type="button"
            className="search-form__map-btn"
            onClick={() => onSelectOnMap('to')}
            title="Wybierz na mapie"
          >
            <FaMapMarkerAlt />
          </button>
        </div>
      </div>

      <div className="search-form__options">
        <div className="search-form__date-time">
          <div className="search-form__field">
            <label>Data</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <div className="search-form__field">
            <label><FaClock /> Odjazd po</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
            />
          </div>
        </div>

        <div className="search-form__sort">
          <label className="search-form__sort-label">Sortuj wyniki:</label>
          <div className="search-form__sort-options">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                className={`search-form__sort-btn ${sortBy === opt.value ? 'search-form__sort-btn--active' : ''}`}
                onClick={() => setSortBy(opt.value)}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>

        <label className="search-form__checkbox">
          <input
            type="checkbox"
            checked={multiModal}
            onChange={e => setMultiModal(e.target.checked)}
          />
          Szukaj z przesiadkami (autobus ↔ pociąg ↔ komunikacja miejska)
        </label>
      </div>

      <button
        type="submit"
        className="search-form__submit"
        disabled={!from || !to || loading}
      >
        {loading ? (
          <>Szukam 5 najbliższych połączeń...</>
        ) : (
          <><FaSearch /> Szukaj 5 najbliższych połączeń</>
        )}
      </button>

      <div className="search-form__providers">
        <p>Źródła danych i przewoźnicy:</p>
        <div className="search-form__provider-tags">
          <span className="search-form__provider-tag--train">PKP / Koleje</span>
          <span className="search-form__provider-tag--bus">FlixBus</span>
          <span className="search-form__provider-tag--bus">RegioJet</span>
          <span className="search-form__provider-tag--bus">Sindbad</span>
          <span className="search-form__provider-tag--bus">e-Podróżnik</span>
          <span className="search-form__provider-tag--local">ZTM / MPK</span>
          <span className="search-form__provider-tag--local">jakdojade.pl</span>
        </div>
      </div>
    </form>
  );
}
