import { useState } from 'react';
import LocationSearch from './LocationSearch';
import { FaSearch, FaExchangeAlt, FaMapMarkerAlt, FaClock } from 'react-icons/fa';

export default function SearchForm({ from, to, onFromChange, onToChange, onSearch, onSelectOnMap, loading }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [multiModal, setMultiModal] = useState(true);

  function handleSwap() {
    const temp = from;
    onFromChange(to);
    onToChange(temp);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!from || !to) return;
    onSearch({ date, time, multiModal });
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
            placeholder="Np. Warszawa, Kraków Główny..."
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
            placeholder="Np. Gdańsk, Wrocław..."
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
            <label><FaClock /> Godzina</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
            />
          </div>
        </div>

        <label className="search-form__checkbox">
          <input
            type="checkbox"
            checked={multiModal}
            onChange={e => setMultiModal(e.target.checked)}
          />
          Szukaj z przesiadkami w dużych miastach
        </label>
      </div>

      <button
        type="submit"
        className="search-form__submit"
        disabled={!from || !to || loading}
      >
        {loading ? (
          <>Szukam...</>
        ) : (
          <><FaSearch /> Szukaj połączeń</>
        )}
      </button>

      <div className="search-form__providers">
        <p>Źródła danych:</p>
        <div className="search-form__provider-tags">
          <span>PKP / Koleje</span>
          <span>FlixBus</span>
          <span>e-Podróżnik</span>
          <span>ZTM / MPK</span>
          <span>jakdojade.pl</span>
        </div>
      </div>
    </form>
  );
}
