import React from 'react';
import './Portfolio.css';

function Portfolio() {
  // Mock Data
  const investedAssets = [
    { id: 1, name: "Asterium", date: "12/2020", cost: "5.0M", value: "8.2M", moic: "1.6x" },
    { id: 2, name: "Lynx", date: "03/2021", cost: "3.5M", value: "4.1M", moic: "1.2x" },
    { id: 3, name: "Vortex", date: "06/2021", cost: "2.0M", value: "1.8M", moic: "0.9x" },
  ];

  return (
    <div className="portfolio-tab-container">
      
      {/* SECTION 1: INVESTED PORTFOLIO */}
      <div className="portfolio-section">
        <h3 className="section-title">Invested Portfolio</h3>
        <div className="portfolio-table-wrapper">
          <table className="clean-table">
            <thead>
              <tr>
                <th className="t-left">Company</th>
                <th>Inv. Date</th>
                <th className="t-right">Total Cost (€)</th>
                <th className="t-right">Fair Value (€)</th>
                <th className="t-right">MOIC</th>
              </tr>
            </thead>
            <tbody>
              {investedAssets.map(asset => (
                <tr key={asset.id}>
                  <td className="t-left font-medium">{asset.name}</td>
                  <td>{asset.date}</td>
                  <td className="t-right">{asset.cost}</td>
                  <td className="t-right">{asset.value}</td>
                  <td className="t-right">
                    <span className={`badge ${parseFloat(asset.moic) >= 1 ? 'green' : 'red'}`}>
                      {asset.moic}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: REALIZED (Placeholder for now) */}
      <div className="portfolio-section">
        <h3 className="section-title">Realized Portfolio</h3>
        <div className="empty-state">
          No realized assets in this scenario yet.
        </div>
      </div>

    </div>
  );
}

export default Portfolio;