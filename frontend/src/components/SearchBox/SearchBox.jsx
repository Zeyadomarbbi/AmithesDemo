import React from "react";
import "./SearchBox.css";
import { SearchIcon } from '/src/components/Icons/InteractiveIcons';

export default function SearchBox({
  value,
  onChange,
  placeholder = "Search",
}) {
  return (
    <div className="search-input-wrapper search-box">
        <SearchIcon />
      <input
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
