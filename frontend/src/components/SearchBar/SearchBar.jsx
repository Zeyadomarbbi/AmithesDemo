import React, { useState } from 'react';
import { SearchIcon } from '/src/components/Icons/InteractiveIcons';
import './SearchBar.css';

function SearchBar({ placeholder, onSearch, className, containerClassName }) {
  const [query, setQuery] = useState('');

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (onSearch) onSearch(value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSearch) onSearch(query);
  };

  return (
    <div className={`search-bar ${containerClassName || ''}`.trim()}>
      <div className="search-bar__icon-wrapper">
        <SearchIcon />
      </div>
      <input
        type="text"
        className={`search-bar__input${className ? ` ${className}` : ''}`}
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}

export default SearchBar;