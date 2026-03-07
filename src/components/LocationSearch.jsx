import { useState, useEffect, useRef, useCallback } from 'react';
import { geocodeSearch } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';

export default function LocationSearch({ label, value, onChange, placeholder }) {
  const [query, setQuery] = useState(value?.name || '');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 400);
  const wrapperRef = useRef(null);
  const lastSearchRef = useRef('');

  // When debounced query changes, search and auto-select if single result
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    // Don't re-search if already selected this exact query
    if (value?.name && debouncedQuery === value.name.split(',')[0]) return;

    setLoading(true);
    lastSearchRef.current = debouncedQuery;

    geocodeSearch(debouncedQuery)
      .then(data => {
        // Only update if this is still the latest search
        if (lastSearchRef.current !== debouncedQuery) return;
        setResults(data);

        if (data.length === 1) {
          // Auto-select if only one result
          handleSelect(data[0]);
        } else if (data.length > 1) {
          setIsOpen(true);
        }
      })
      .catch(() => {
        if (lastSearchRef.current === debouncedQuery) setResults([]);
      })
      .finally(() => {
        if (lastSearchRef.current === debouncedQuery) setLoading(false);
      });
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
      setQuery(value.name.split(',')[0]);
    }
  }, [value?.name]);

  const handleSelect = useCallback((result) => {
    setQuery(result.name.split(',')[0]);
    setIsOpen(false);
    setResults([]);
    onChange(result);
  }, [onChange]);

  function handleInputChange(e) {
    const val = e.target.value;
    setQuery(val);
    if (!val) {
      onChange(null);
      setResults([]);
      setIsOpen(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0) {
        // Select first result on Enter
        handleSelect(results[0]);
      } else if (query.length >= 2) {
        // Force search and select first result
        setLoading(true);
        geocodeSearch(query)
          .then(data => {
            setResults(data);
            if (data.length > 0) {
              handleSelect(data[0]);
            } else {
              setIsOpen(false);
            }
          })
          .catch(() => setResults([]))
          .finally(() => setLoading(false));
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown' && results.length > 0) {
      setIsOpen(true);
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
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder || 'Wpisz adres lub nazwę miejscowości...'}
          autoComplete="off"
        />
        {loading && <span className="location-search__spinner" />}
        {value && !loading && (
          <span className="location-search__selected-indicator" title="Lokalizacja wybrana" />
        )}
      </div>
      {isOpen && results.length > 0 && (
        <ul className="location-search__dropdown">
          {results.map((r, i) => (
            <li
              key={`${r.osmId}-${i}`}
              className="location-search__item"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(r);
              }}
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
