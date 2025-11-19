import React from 'react';
import { Link } from 'react-router-dom';

// Props are passed from SynthesisList
function SynthesisCard({ title, author, createdDate, links = [] }) {
  return (
    // We make this a link to its own detail page (later)
    <Link to="#" className="synthesis-card-link">
      <div className="synthesis-card">
        {/* Checkbox and ... menu */}
        <h3>{title}</h3>
        <p>Created on: {createdDate}</p>
        <p>By: {author}</p>

        {/* The list of blue links at the bottom */}
        <div className="synthesis-card-links">
          {links.map((link, index) => (
            <span key={index} className="synthesis-link">
              {link}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export default SynthesisCard;