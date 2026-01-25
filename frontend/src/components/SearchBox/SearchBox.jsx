import React from "react";
import "./SearchBox.css";
import { SearchIcon } from "../Icons.jsx";

export default function SearchBox({
  value,
  onChange,
  placeholder = "Search",
}) {
  return (
    <div className="search-input-wrapper search-box">
      <span className="search-icon">
        <SearchIcon />
      </span>

      <input
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
