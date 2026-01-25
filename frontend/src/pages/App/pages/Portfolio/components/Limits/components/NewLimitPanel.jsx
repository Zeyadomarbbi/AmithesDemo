import React from "react";
import "../PortfolioLimitsTab.css";
import "../../Compare/PortfolioCompareTab.css";


const NewLimitPanel = ({ onClose }) => {
  return (
    <div className="sidepanel limit-panel quarter-width">
      {/* Header bar */}
      <div className="panel-header">
        <button className="back-btn" onClick={onClose}>
          &laquo;
        </button>
        <button className="close-btn" onClick={onClose}>
          &times;
        </button>
      </div>

      <h2>Adding a new limit</h2>

      <form className="limit-form">
        <div>
          <p className="limit-form-section-title">General informations</p>
        </div>

        <div>
          <label>Name*</label>
          <input type="text" placeholder="Enter the name of the limit" />
        </div>

        <div>
          <label>PPM reference</label>
          <input type="text" placeholder="Enter the page or the article of the PPM" />
        </div>

        <div>
          <label>Type of expense</label>
          <select>
            <option>Select a type of expense</option>
          </select>
        </div>

        <div>
          <label>Group of expense</label>
          <input type="text" placeholder="Name of the group" />
        </div>

        <div>
          <label>Min/Max*</label>
          <input type="text" placeholder="Minimum or Maximum" />
        </div>

        <div>
          <label>Rate*</label>
          <input type="text" placeholder="Please enter a percentage" />
        </div>

        <div>
          <p className="limit-form-section-title">Description</p>
          <label>Description as per PPM*</label>
          <textarea placeholder="Please type the description here..." rows={4} />
        </div>

        <div className="limit-form-actions">
          <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="save-btn">Save</button>
        </div>
      </form>
    </div>
  );
};

export default NewLimitPanel;
