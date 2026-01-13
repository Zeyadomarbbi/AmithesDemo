import React, { useState } from 'react';

function SearchBar({ placeholder, onSearch, className }) {
  const [query, setQuery] = useState('');

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (onSearch) onSearch(value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && onSearch) onSearch(query);
  };

  return (
    <input
      type="text"
      className={className} // allow parent to pass styling
      placeholder={placeholder}
      value={query}
      onChange={handleChange}
      onKeyPress={handleKeyPress}
    />
  );
}

export default SearchBar;
