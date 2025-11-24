// frontend/src/pages/App/pages/LPsStatement/components/CapitalFlows.jsx
import React, { useMemo, useState } from "react";
import "./CapitalFlows.css"; // We'll need to update this CSS file next!

// --------------------------------------------------------------------------
// UPDATED MOCK DATA TO REFLECT THE CAPITAL CALL TABLE STRUCTURE IN FIGMA
// --------------------------------------------------------------------------
const MOCK_CALLS = [
  {
    id: 1, // Capital call #1
    date: '19/05/2026',
    percentCalled: 1.00,
    calledAmount: 1000000,
    investment: 350000,
    managFees: 500000,
    dueDillFees: 500000,
    opex: 500000,
  },
  {
    id: 2, // Capital call #2
    date: '19/05/2026',
    percentCalled: 0.87,
    calledAmount: 600000, // Based on the Total row calculation
    investment: 265000,
    managFees: 100000,
    dueDillFees: 100000,
    opex: 100000,
  },
  {
    id: 3, // Capital call #3
    date: '19/05/2026',
    percentCalled: 0.97,
    calledAmount: 600000,
    investment: 0, // Shown as '-' in Figma
    managFees: 100000,
    dueDillFees: 50000,
    opex: 50000,
  },
];

// This object represents the FINAL Total Row in the Figma design.
const TOTAL_SUMMARY = {
  percentCalled: 2.84,
  calledAmount: 1600000,
  investment: 615000,
  managFees: 700000,
  dueDillFees: 650000,
  opex: 650000,
};

export default function CapitalFlows() {
  const [calls, setCalls] = useState(MOCK_CALLS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State for the new filters
  const [filterOperation, setFilterOperation] = useState("Capital call");
  const [filterBreakdown, setFilterBreakdown] = useState("Operations");
  const [filterSearch, setFilterSearch] = useState("");

  // Re-initialising the form state for a Capital Call, matching the old submission logic
  const [form, setForm] = useState({
    type: "Capital Call",
    lpId: 1, // Assuming LP Alpha for initial state
    amount: "",
    callDate: "",
    dueDate: "",
    status: "Pending",
    description: "",
  });

  // Simplified filtering for the new design (filtering based on search only for now)
  const filteredCalls = useMemo(() => {
    return calls.filter((c) => {
      // Logic for filtering by search on operation ID (e.g., Capital call #1)
      const operationName = `Capital call #${c.id}`;
      const matchSearch =
        filterSearch.trim() === ""
          ? true
          : operationName.toLowerCase().includes(filterSearch.toLowerCase());

      return matchSearch;
    });
  }, [calls, filterSearch]);


  function openModal() {
    setIsModalOpen(true);
  }
  function closeModal() {
    setIsModalOpen(false);
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // Simplified add logic for demonstration (no complex LP/Type logic needed here)

    const newCall = {
      id: calls.length + 1,
      date: form.callDate,
      percentCalled: 0, // Placeholder
      calledAmount: Number(form.amount || 0),
      investment: 0, // Placeholder
      managFees: 0, // Placeholder
      dueDillFees: 0, // Placeholder
      opex: 0, // Placeholder
    };

    setCalls((prev) => [newCall, ...prev]);

    // Reset form
    setForm({ /* reset state */ });
    closeModal();
  }

  return (
    <div className="cf-page">

      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HEADER: Search Bar and Breakdown Buttons */}
      {/* ------------------------------------------------------------- */}
      <div className="cf-header-row">
        <div className="cf-search-box">
          {/* Using a placeholder for the Search Icon (magnifying glass) */}
          <span className="search-icon">🔍</span> 
          <input 
            placeholder="Search by operation..." 
            value={filterSearch} 
            onChange={(e) => setFilterSearch(e.target.value)} 
          />
        </div>
        
        <div className="cf-breakdown-group">
          <span className="cf-breakdown-label">Breakdown :</span>
          <button 
            className={`cf-breakdown-btn ${filterBreakdown === 'Operations' ? 'active' : ''}`}
            onClick={() => setFilterBreakdown('Operations')}
          >
            Operations
          </button>
          <button 
            className={`cf-breakdown-btn ${filterBreakdown === 'LPs' ? 'active' : ''}`}
            onClick={() => setFilterBreakdown('LPs')}
          >
            LPs
          </button>
          <button 
            className={`cf-breakdown-btn ${filterBreakdown === 'Share Class' ? 'active' : ''}`}
            onClick={() => setFilterBreakdown('Share Class')}
          >
            Share Class
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. MIDDLE ROW: Operation Tabs and New Button */}
      {/* ------------------------------------------------------------- */}
      <div className="cf-tabs-row">
        <div className="cf-operation-tabs">
          <button 
            className={`cf-tab ${filterOperation === 'All operations' ? 'active' : ''}`}
            onClick={() => setFilterOperation('All operations')}
          >
            All operations
          </button>
          <button 
            className={`cf-tab ${filterOperation === 'Capital call' ? 'active' : ''}`}
            onClick={() => setFilterOperation('Capital call')}
          >
            Capital call
          </button>
          <button 
            className={`cf-tab ${filterOperation === 'Distribution' ? 'active' : ''}`}
            onClick={() => setFilterOperation('Distribution')}
          >
            Distribution
          </button>
        </div>
        
        <button className="cf-primary-btn new-call-btn" onClick={openModal}>
          + New capital call
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. TABLE: Complex Header and Data Rows */}
      {/* ------------------------------------------------------------- */}
      <div className="cf-table-wrap">
        <table className="cf-table">
          <thead>
            {/* FIRST HEADER ROW: Spans and Groups */}
            <tr>
              {/* These columns span two rows (rowSpan=2) */}
              <th rowSpan="2" style={{ width: '12%' }}>Operations</th>
              <th rowSpan="2" style={{ width: '8%' }}>Date</th>
              <th rowSpan="2" className="right">
                % Called 
                {/* Placeholder for sorting icon */}
                <span className="sort-icon">⇅</span>
              </th>
              <th rowSpan="2" className="right">
                Called Am. (€) 
                {/* Placeholder for sorting icon */}
                <span className="sort-icon">⇅</span>
              </th>
              {/* This group spans the next four columns (colSpan=4) */}
              <th colSpan="4" className="cf-cost-breakdown-header">
                Breakdown of Call (€)
              </th>
            </tr>
            {/* SECOND HEADER ROW: Detailed Breakdown Columns */}
            <tr>
              <th className="right">Investment <span className="sort-icon">⇅</span></th>
              <th className="right">Manag. fees <span className="sort-icon">⇅</span></th>
              <th className="right">Due dill. fees <span className="sort-icon">⇅</span></th>
              <th className="right">Opex <span className="sort-icon">⇅</span></th>
            </tr>
          </thead>

          <tbody>
            {filteredCalls.map((call, index) => (
              <tr key={call.id} className={index % 2 === 1 ? 'odd-row' : ''}>
                <td>{`Capital call #${call.id}`}</td>
                <td>{call.date}</td>
                <td className="right">{call.percentCalled.toFixed(2)}%</td>
                <td className="right bold">
                  {call.calledAmount ? call.calledAmount.toLocaleString('en-US') : '-'}
                </td>
                {/* Breakdown columns - Using toLocaleString for number formatting */}
                <td className="right">{call.investment.toLocaleString('en-US')}</td>
                <td className="right">{call.managFees.toLocaleString('en-US')}</td>
                <td className="right">{call.dueDillFees.toLocaleString('en-US')}</td>
                <td className="right">{call.opex.toLocaleString('en-US')}</td>
              </tr>
            ))}
            
            {/* TOTAL Row - Matches the blue row in the Figma design */}
            <tr className="cf-total-row">
              <td className="bold">Total</td>
              <td></td> {/* Empty cell */}
              <td className="right bold">{TOTAL_SUMMARY.percentCalled.toFixed(2)}%</td>
              <td className="right bold">{TOTAL_SUMMARY.calledAmount.toLocaleString('en-US')}</td>
              <td className="right bold">{TOTAL_SUMMARY.investment.toLocaleString('en-US')}</td>
              <td className="right bold">{TOTAL_SUMMARY.managFees.toLocaleString('en-US')}</td>
              <td className="right bold">{TOTAL_SUMMARY.dueDillFees.toLocaleString('en-US')}</td>
              <td className="right bold">{TOTAL_SUMMARY.opex.toLocaleString('en-US')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. MODAL (Kept the modal logic from your old code) */}
      {/* ------------------------------------------------------------- */}
      <div className={`cf-modal-backdrop ${isModalOpen ? "open" : ""}`}>
        <div className={`cf-modal ${isModalOpen ? "open" : ""}`}>
          <div className="cf-modal-header">
            <h3>Add new flow</h3>
            <button className="cf-icon-btn" onClick={closeModal}>✕</button>
          </div>

          <form onSubmit={handleSubmit} className="cf-modal-body">
            {/* ... Your form fields for Type, LP, Amount, Dates, Status, Description ... */}
            {/* Keeping the form elements simplified to focus on the table structure */}

             <div className="cf-form-row">
                <label>Type</label>
                <select name="type" value={form.type} onChange={handleFormChange} disabled>
                  <option>Capital Call</option>
                </select>
              </div>

              <div className="cf-form-row">
                <label>Amount</label>
                <input
                  name="amount"
                  type="number"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="cf-form-row">
                <label>Call Date</label>
                <input
                  name="callDate"
                  type="date"
                  value={form.callDate}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="cf-form-row">
                <label>Due Date</label>
                <input
                  name="dueDate"
                  type="date"
                  value={form.dueDate}
                  onChange={handleFormChange}
                  required
                />
              </div>
            
            <div className="cf-modal-footer">
              <button type="button" className="cf-secondary-btn" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" className="cf-primary-btn">Add</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}