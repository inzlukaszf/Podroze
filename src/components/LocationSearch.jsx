import { useState, useEffect, useRef } from 'react';
import { geocodeSearch } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';

export default function LocationSearch({ label, value, onChange, placeholder }) {
  const [query, setQuery] = useState(value?.name || '');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 400);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    geocodeSearch(debouncedQuery)
      .then(data => {
        setResults(data);
        setIsOpen(true);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value?.name && value.name !== query) {
      setQuery(value.name);
    }
  }, [value?.name]);

  function handleSelect(result) {
    setQuery(result.name.split(',')[0]);
    setIsOpen(false);
    onChange(result);
  }

  function handleInputChange(e) {
    setQuery(e.target.value);
    if (!e.target.value) {
      onChange(null);
    }
  }

  return (
    <div className="location-search" ref={wrapperRef}>
      <label className="location-search__label">{label}</label>
      <div className="location-search__input-wrapper">
        <input
          type="text"
          className="location-search__input"
          value={query}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder || 'Wpisz nazwę miejscowości...'}
        />
        {loading && <span className="location-search__spinner" />}
      </div>
      {isOpen && results.length > 0 && (
        <ul className="location-search__dropdown">
          {results.map((r, i) => (
            <li
              key={`${r.osmId}-${i}`}
              className="location-search__item"
              onClick={() => handleSelect(r)}
            >
              <span className="location-search__item-name">
                {r.name.split(',').slice(0, 2).join(',')}
              </span>
              <span className="location-search__item-detail">
                {r.name.split(',').slice(2).join(',').trim()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
