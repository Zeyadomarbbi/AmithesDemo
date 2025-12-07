import React, { useState } from "react";
import "./SettingsPage.css";

const TABS = [
  "Fund Identity",
  "Share Classes",
  "Waterfall Structure",
  "Management fees",
];

const CURRENCIES = ["EUR", "USD", "GBP", "CHF"];
const PHASES = ["Fundraising", "Investment period", "Harvesting", "Closed"];

const SHARE_CLASSES = [
  {
    id: "A",
    name: "Class A",
    nominalValue: "€1,000",
    shareIssuance: {
      label: "Pro rata capital called",
      variant: "green",
    },
    distributionMethod: {
      label: "Dividend",
      variant: "blue",
    },
    isinCode: "FR0000120271",
    descriptionTitle: "Description as per PPM",
    description:
      "This share class is reserved for institutional investors with a minimum commitment of €25M. Capital is called on a pro-rata basis depending on deal flow and fund phase. No redemption is allowed before fund maturity. Carried interest applies after a preferred return of 8%.",
    ppmFileName: "class-A.pdf",
  },
  {
    id: "B",
    name: "Class B",
    nominalValue: "€1,000",
    shareIssuance: {
      label: "Upfront",
      variant: "blue",
    },
    distributionMethod: {
      label: "Redemption of share",
      variant: "purple",
    },
    isinCode: "FR0000120272",
    descriptionTitle: "Description as per PPM",
    description:
      "This share class is reserved for institutional investors with a minimum commitment of €25M. Capital is called on a pro-rata basis depending on deal flow and fund phase. No redemption is allowed before fund maturity. Carried interest applies after a preferred return of 8%.",
    ppmFileName: "class-A.pdf",
  },
];

const MANAGEMENT_PHASES = [
  {
    id: 1,
    phaseTitle: "Phase 1",
    name: "Commitment",
    fields: [
      { label: "From", value: "15/07/2021" },
      { label: "Until", value: "15/07/2026" },
      { label: "Shares A1", value: "1.00%" },
      { label: "Shares A2", value: "1.50%" },
      { label: "Shares A3", value: "2.00%" },
      { label: "Shares B", value: "1.00%" },
    ],
  },
  {
    id: 2,
    phaseTitle: "Phase 2",
    name: "Cost",
    fields: [
      { label: "From", value: "16/07/2026" },
      { label: "Until", value: "Last deal exited" },
      { label: "Rate", value: "2.00%" },
    ],
  },
];

const monthNamesShort = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const weekdayShort = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("Fund Identity");

  const [formData, setFormData] = useState({
    legalName: "Asterium Fund I",
    shortName: "",
    formationDate: "",
    fundCurrency: "",
    legalForm: "",
    managementCompany: "",
    fundStrategy: "",
    fundPhase: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const [isNewShareOpen, setIsNewShareOpen] = useState(false);
  const [issuanceMethod, setIssuanceMethod] = useState("pro-rata");
  const [distributionMethod, setDistributionMethod] = useState("dividend");

  const filteredShareClasses = SHARE_CLASSES.filter((cls) =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const formatDisplayDate = (date) => {
    if (!date) return "";
    const d = date.getDate();
    const m = monthNamesShort[date.getMonth()];
    const y = date.getFullYear();
    return `${m} ${d}, ${y}`;
  };

  const getCalendarDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const jsDay = firstDay.getDay(); // 0..6, Sun..Sat
    const offset = (jsDay + 6) % 7; // 0..6, Mon..Sun

    const days = [];
    for (let i = 0; i < offset; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const today = new Date();
  const calendarDays = getCalendarDays(viewDate);

  const handleDayClick = (day) => {
    if (!day) return;
    setSelectedDate(day);
    setFormData((prev) => ({
      ...prev,
      formationDate: formatDisplayDate(day),
    }));
    setIsDatePickerOpen(false);
  };

  const handleToday = () => {
    const t = new Date();
    setViewDate(t);
    setSelectedDate(t);
    setFormData((prev) => ({
      ...prev,
      formationDate: formatDisplayDate(t),
    }));
    setIsDatePickerOpen(false);
  };

  const handlePrevMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1 className="settings-title">Fund Setup</h1>

        {/* Tabs */}
        <div className="settings-tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={
                "settings-tab" +
                (tab === activeTab ? " settings-tab--active" : "")
              }
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Fund Identity tab */}
        {activeTab === "Fund Identity" && (
          <form className="settings-form">
            <div className="form-field">
              <label className="field-label">
                Legal name<span className="required">*</span>
              </label>
              <input
                type="text"
                className="field-input"
                value={formData.legalName}
                onChange={handleChange("legalName")}
              />
            </div>

            <div className="form-field">
              <label className="field-label">
                Short name<span className="required">*</span>
              </label>
              <input
                type="text"
                className="field-input"
                placeholder="Please enter the acronym…"
                value={formData.shortName}
                onChange={handleChange("shortName")}
              />
            </div>

            <div className="form-field form-field--date">
              <label className="field-label">
                Formation date<span className="required">*</span>
              </label>
              <div
                className="field-input field-input--with-icon"
                onClick={() => setIsDatePickerOpen(true)}
              >
                <input
                  type="text"
                  className="field-input-inner"
                  placeholder="00/00/00"
                  value={formData.formationDate}
                  readOnly
                />
                <span className="field-icon" aria-hidden="true">
                  📅
                </span>
              </div>

              {isDatePickerOpen && (
                <div className="date-picker-popover">
                  <div className="date-picker-header">
                    <button
                      type="button"
                      className="date-picker-nav"
                      onClick={handlePrevMonth}
                    >
                      ‹
                    </button>
                    <div className="date-picker-month-label">
                      {monthNamesShort[viewDate.getMonth()]}{" "}
                      {viewDate.getFullYear()}
                    </div>
                    <button
                      type="button"
                      className="date-picker-nav"
                      onClick={handleNextMonth}
                    >
                      ›
                    </button>
                  </div>

                  <div className="date-picker-input-row">
                    <input
                      type="text"
                      className="date-picker-display-input"
                      value={
                        selectedDate ? formatDisplayDate(selectedDate) : ""
                      }
                      readOnly
                      placeholder="Select a date"
                    />
                    <button
                      type="button"
                      className="date-picker-today-btn"
                      onClick={handleToday}
                    >
                      Today
                    </button>
                  </div>

                  <div className="date-picker-weekdays">
                    {weekdayShort.map((d) => (
                      <div key={d} className="date-picker-weekday">
                        {d}
                      </div>
                    ))}
                  </div>

                  <div className="date-picker-grid">
                    {calendarDays.map((day, idx) => {
                      if (!day) {
                        return (
                          <div
                            key={`empty-${idx}`}
                            className="date-picker-cell date-picker-cell--empty"
                          />
                        );
                      }

                      const isToday =
                        day.getFullYear() === today.getFullYear() &&
                        day.getMonth() === today.getMonth() &&
                        day.getDate() === today.getDate();

                      const isSelected =
                        selectedDate &&
                        day.getFullYear() === selectedDate.getFullYear() &&
                        day.getMonth() === selectedDate.getMonth() &&
                        day.getDate() === selectedDate.getDate();

                      const cellClass =
                        "date-picker-cell" +
                        (isSelected ? " date-picker-cell--selected" : "") +
                        (!isSelected && isToday
                          ? " date-picker-cell--today"
                          : "");

                      return (
                        <button
                          type="button"
                          key={day.toISOString()}
                          className={cellClass}
                          onClick={() => handleDayClick(day)}
                        >
                          {day.getDate()}
                        </button>
                      );
                    })}
                  </div>

                  <div className="date-picker-footer">
                    <button
                      type="button"
                      className="date-picker-footer-btn date-picker-footer-btn--ghost"
                      onClick={() => setIsDatePickerOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="date-picker-footer-btn date-picker-footer-btn--primary"
                      onClick={() => setIsDatePickerOpen(false)}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="form-field">
              <label className="field-label">
                Fund currency<span className="required">*</span>
              </label>
              <div className="field-input field-input--with-icon">
                <select
                  className="field-input-inner field-select"
                  value={formData.fundCurrency}
                  onChange={handleChange("fundCurrency")}
                >
                  <option value="">Please select a currency</option>
                  {CURRENCIES.map((cur) => (
                    <option key={cur} value={cur}>
                      {cur}
                    </option>
                  ))}
                </select>
                <span className="field-icon" aria-hidden="true">
                  ▾
                </span>
              </div>
            </div>

            <div className="form-field">
              <label className="field-label">Legal form</label>
              <input
                type="text"
                className="field-input"
                placeholder="e.g SICAV, RAIF, SIF, FPCI…"
                value={formData.legalForm}
                onChange={handleChange("legalForm")}
              />
            </div>

            <div className="form-field">
              <label className="field-label">Management company</label>
              <input
                type="text"
                className="field-input"
                placeholder="Please enter the management company…"
                value={formData.managementCompany}
                onChange={handleChange("managementCompany")}
              />
            </div>

            <div className="form-field form-field--full">
              <label className="field-label">
                Fund strategy<span className="required">*</span>
              </label>
              <input
                type="text"
                className="field-input"
                placeholder="Please enter a strategy"
                value={formData.fundStrategy}
                onChange={handleChange("fundStrategy")}
              />
            </div>

            <div className="form-field">
              <label className="field-label">
                Fund&apos;s phase<span className="required">*</span>
              </label>
              <div className="field-input field-input--with-icon">
                <select
                  className="field-input-inner field-select"
                  value={formData.fundPhase}
                  onChange={handleChange("fundPhase")}
                >
                  <option value="">Please select a phase</option>
                  {PHASES.map((phase) => (
                    <option key={phase} value={phase}>
                      {phase}
                    </option>
                  ))}
                </select>
                <span className="field-icon" aria-hidden="true">
                  ▾
                </span>
              </div>
            </div>
          </form>
        )}

        {/* Share Classes tab */}
        {activeTab === "Share Classes" && (
          <div className="share-classes-wrap">
            <div className="share-search">
              <span className="share-search-icon">🔍</span>
              <input
                type="text"
                className="share-search-input"
                placeholder="Search by share class..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="share-list">
              {filteredShareClasses.map((cls) => (
                <div key={cls.id} className="share-card">
                  <div className="share-card-header">
                    <div className="share-card-title">{cls.name}</div>
                    <button
                      type="button"
                      className="share-card-menu-btn"
                      aria-label="More actions"
                    >
                      ⋮
                    </button>
                  </div>

                  <div className="share-card-meta">
                    <div className="share-meta-column">
                      <div className="share-meta-label">Nominal value</div>
                      <div className="share-meta-value">
                        {cls.nominalValue}
                      </div>
                    </div>

                    <div className="share-meta-column">
                      <div className="share-meta-label">Share issuance</div>
                      <span
                        className={
                          "share-badge share-badge--" +
                          cls.shareIssuance.variant
                        }
                      >
                        {cls.shareIssuance.label}
                      </span>
                    </div>

                    <div className="share-meta-column">
                      <div className="share-meta-label">
                        Distribution method
                      </div>
                      <span
                        className={
                          "share-badge share-badge--" +
                          cls.distributionMethod.variant
                        }
                      >
                        {cls.distributionMethod.label}
                      </span>
                    </div>

                    <div className="share-meta-column">
                      <div className="share-meta-label">ISIN Code</div>
                      <div className="share-meta-value">{cls.isinCode}</div>
                    </div>
                  </div>

                  <div className="share-description-block">
                    <div className="share-desc-title">
                      {cls.descriptionTitle}
                    </div>
                    <p className="share-desc-text">{cls.description}</p>
                  </div>

                  <button type="button" className="share-file-btn">
                    <span className="share-file-icon">📄</span>
                    <span>{cls.ppmFileName}</span>
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="share-new-btn"
              onClick={() => setIsNewShareOpen(true)}
            >
              <span className="share-new-icon">＋</span>
              <span>New share class</span>
            </button>

            {isNewShareOpen && (
              <div className="share-drawer-overlay">
                <div className="share-drawer">
                  <div className="share-drawer-header">
                    <button
                      type="button"
                      className="share-drawer-back"
                      onClick={() => setIsNewShareOpen(false)}
                    >
                      ‹
                    </button>
                    <div className="share-drawer-title">New share class</div>
                    <button
                      type="button"
                      className="share-drawer-close"
                      onClick={() => setIsNewShareOpen(false)}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="share-drawer-body">
                    {/* Nominal + ISIN */}
                    <div className="share-drawer-row share-drawer-row--two">
                      <div className="share-drawer-field">
                        <div className="field-label">
                          Nominal value<span className="required">*</span>
                        </div>
                        <input
                          type="text"
                          className="field-input"
                          placeholder="Please enter the share class name"
                        />
                      </div>

                      <div className="share-drawer-field">
                        <div className="field-label">ISIN code</div>
                        <input
                          type="text"
                          className="field-input"
                          placeholder="ex : FR0000120271"
                        />
                      </div>
                    </div>

                    {/* Share value */}
                    <div className="share-drawer-field">
                      <div className="field-label">
                        Share value<span className="required">*</span>
                      </div>
                      <div className="field-input field-input--with-icon">
                        <input
                          type="text"
                          className="field-input-inner"
                          placeholder="0,000.00"
                        />
                        <span className="field-icon">€</span>
                      </div>
                      <div className="share-drawer-help">
                        Please enter the full amount in €...
                      </div>
                    </div>

                    {/* Share issuance method */}
                    <div className="share-drawer-section">
                      <div className="field-label">Share issuance method</div>
                      <div className="share-toggle-group">
                        <button
                          type="button"
                          className={
                            "share-toggle-btn" +
                            (issuanceMethod === "upfront"
                              ? " share-toggle-btn--active"
                              : "")
                          }
                          onClick={() => setIssuanceMethod("upfront")}
                        >
                          £ Upfront
                        </button>
                        <button
                          type="button"
                          className={
                            "share-toggle-btn" +
                            (issuanceMethod === "pro-rata"
                              ? " share-toggle-btn--active"
                              : "")
                          }
                          onClick={() => setIssuanceMethod("pro-rata")}
                        >
                          ⏱ Pro rata capital called
                        </button>
                      </div>
                    </div>

                    {/* Distribution method */}
                    <div className="share-drawer-section">
                      <div className="field-label">Distribution method</div>
                      <div className="share-toggle-group">
                        <button
                          type="button"
                          className={
                            "share-toggle-btn" +
                            (distributionMethod === "redemption"
                              ? " share-toggle-btn--active"
                              : "")
                          }
                          onClick={() => setDistributionMethod("redemption")}
                        >
                          ⬇ Redemption of share
                        </button>
                        <button
                          type="button"
                          className={
                            "share-toggle-btn" +
                            (distributionMethod === "dividend"
                              ? " share-toggle-btn--active"
                              : "")
                          }
                          onClick={() => setDistributionMethod("dividend")}
                        >
                          ☰ Dividend
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="share-drawer-field">
                      <div className="field-label">Description as per PPM</div>
                      <textarea
                        className="share-drawer-textarea"
                        placeholder="Please type the description here..."
                      />
                    </div>

                    {/* Files upload */}
                    <div className="share-drawer-section">
                      <div className="field-label">Files</div>
                      <div className="share-upload-box">
                        <div className="share-upload-icon">⬆</div>
                        <div className="share-upload-text">
                          Click to upload or drag and drop
                        </div>
                        <div className="share-upload-hint">
                          SVG, PNG, JPG or GIF (max. 800×400px)
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="share-drawer-footer">
                    <button
                      type="button"
                      className="share-drawer-footer-btn share-drawer-footer-btn--ghost"
                      onClick={() => setIsNewShareOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="share-drawer-footer-btn share-drawer-footer-btn--primary"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Waterfall Structure tab */}
        {activeTab === "Waterfall Structure" && (
          <div className="waterfall-wrap">
            {/* Step 1 */}
            <div className="waterfall-step-card">
              <div className="waterfall-step-header">
                <div className="waterfall-step-title">Step 1</div>
              </div>
              <div className="waterfall-step-body">
                <div className="waterfall-row">
                  <div className="waterfall-column-name">
                    <div className="field-label">
                      Name<span className="required">*</span>
                    </div>
                    <input
                      type="text"
                      className="field-input"
                      defaultValue="Nominal repayment"
                    />
                  </div>

                  <div className="waterfall-column-shares">
                    <div className="waterfall-shares-header">Shares A1</div>
                    <div className="waterfall-shares-value">Pro Rata</div>
                  </div>
                  <div className="waterfall-column-shares">
                    <div className="waterfall-shares-header">Shares A2</div>
                    <div className="waterfall-shares-value">Pro Rata</div>
                  </div>
                  <div className="waterfall-column-shares">
                    <div className="waterfall-shares-header">Shares B</div>
                    <div className="waterfall-shares-value">Pro Rata</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="waterfall-step-card">
              <div className="waterfall-step-header">
                <div className="waterfall-step-title">Step 2</div>
              </div>
              <div className="waterfall-step-body">
                <div className="waterfall-row waterfall-row--dense">
                  <div className="waterfall-column-name">
                    <div className="field-label">
                      Name<span className="required">*</span>
                    </div>
                    <input
                      type="text"
                      className="field-input"
                      placeholder="Hurdle"
                    />
                  </div>

                  <div className="waterfall-column-rate">
                    <div className="field-label">
                      Rate<span className="required">*</span>
                    </div>
                    <div className="wf-input-with-suffix">
                      <input
                        type="text"
                        className="wf-input"
                        placeholder="Ex: 8"
                      />
                      <span className="wf-suffix">%</span>
                    </div>
                  </div>

                  <div className="waterfall-column-check">
                    <div className="waterfall-shares-header">Shares A1</div>
                    <input type="checkbox" className="waterfall-checkbox" />
                  </div>
                  <div className="waterfall-column-check">
                    <div className="waterfall-shares-header">Shares A2</div>
                    <input type="checkbox" className="waterfall-checkbox" />
                  </div>
                  <div className="waterfall-column-check">
                    <div className="waterfall-shares-header">Shares B</div>
                    <input type="checkbox" className="waterfall-checkbox" />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="waterfall-step-card">
              <div className="waterfall-step-header">
                <div className="waterfall-step-title">Step 3</div>
              </div>
              <div className="waterfall-step-body">
                <div className="waterfall-row waterfall-row--dense">
                  <div className="waterfall-column-name">
                    <div className="field-label">
                      Name<span className="required">*</span>
                    </div>
                    <input
                      type="text"
                      className="field-input"
                      placeholder="Catch-up"
                    />
                  </div>

                  <div className="waterfall-column-rate">
                    <div className="field-label">
                      % Hurdle<span className="required">*</span>
                    </div>
                    <div className="wf-input-with-suffix">
                      <input
                        type="text"
                        className="wf-input"
                        placeholder="Ex: 8"
                      />
                      <span className="wf-suffix">%</span>
                    </div>
                  </div>

                  <div className="waterfall-column-check">
                    <div className="waterfall-shares-header">Shares A1</div>
                    <input type="checkbox" className="waterfall-checkbox" />
                  </div>
                  <div className="waterfall-column-check">
                    <div className="waterfall-shares-header">Shares A2</div>
                    <input type="checkbox" className="waterfall-checkbox" />
                  </div>
                  <div className="waterfall-column-check">
                    <div className="waterfall-shares-header">Shares B</div>
                    <input type="checkbox" className="waterfall-checkbox" />
                  </div>
                </div>

                {/* Enveloppe 1 */}
                <div className="waterfall-envelope-block">
                  <div className="waterfall-envelope-row">
                    <div className="waterfall-envelope-label">
                      Enveloppe 1<span className="required">*</span>
                    </div>

                    <div className="waterfall-envelope-rate">
                      <div className="field-label">Rate</div>
                      <div className="wf-input-with-suffix">
                        <input
                          type="text"
                          className="wf-input"
                          placeholder="Ex: 8"
                        />
                        <span className="wf-suffix">%</span>
                      </div>
                    </div>

                    <div className="waterfall-envelope-share">
                      <div className="waterfall-shares-header">Shares A1</div>
                      <div className="wf-input-with-suffix wf-input-with-suffix--compact">
                        <input type="text" className="wf-input" defaultValue="0" />
                        <span className="wf-suffix">%</span>
                      </div>
                    </div>

                    <div className="waterfall-envelope-share">
                      <div className="waterfall-shares-header">Shares A2</div>
                      <div className="wf-input-with-suffix wf-input-with-suffix--compact">
                        <input type="text" className="wf-input" defaultValue="0" />
                        <span className="wf-suffix">%</span>
                      </div>
                    </div>

                    <div className="waterfall-envelope-share">
                      <div className="waterfall-shares-header">Shares B</div>
                      <div className="wf-input-with-suffix wf-input-with-suffix--compact">
                        <input type="text" className="wf-input" defaultValue="0" />
                        <span className="wf-suffix">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="waterfall-pro-rata-row">
                    <label className="waterfall-pro-rata">
                      <input type="checkbox" defaultChecked />
                      <span>Pro rata</span>
                    </label>
                    <label className="waterfall-pro-rata">
                      <input type="checkbox" className="waterfall-checkbox" />
                      <span>Pro rata</span>
                    </label>
                    <label className="waterfall-pro-rata">
                      <input type="checkbox" className="waterfall-checkbox" />
                      <span>Pro rata</span>
                    </label>
                  </div>
                </div>

                {/* Enveloppe 2 */}
                <div className="waterfall-envelope-block">
                  <div className="waterfall-envelope-row">
                    <div className="waterfall-envelope-label">
                      Enveloppe 2<span className="required">*</span>
                    </div>

                    <div className="waterfall-envelope-rate">
                      <div className="field-label">Rate</div>
                      <div className="wf-input-with-suffix">
                        <input
                          type="text"
                          className="wf-input"
                          placeholder="Ex: 8"
                        />
                        <span className="wf-suffix">%</span>
                      </div>
                    </div>

                    <div className="waterfall-envelope-share">
                      <div className="waterfall-shares-header">Shares A1</div>
                      <div className="wf-input-with-suffix wf-input-with-suffix--compact">
                        <input type="text" className="wf-input" defaultValue="0" />
                        <span className="wf-suffix">%</span>
                      </div>
                    </div>

                    <div className="waterfall-envelope-share">
                      <div className="waterfall-shares-header">Shares A2</div>
                      <div className="wf-input-with-suffix wf-input-with-suffix--compact">
                        <input type="text" className="wf-input" defaultValue="0" />
                        <span className="wf-suffix">%</span>
                      </div>
                    </div>

                    <div className="waterfall-envelope-share">
                      <div className="waterfall-shares-header">Shares B</div>
                      <div className="wf-input-with-suffix wf-input-with-suffix--compact">
                        <input type="text" className="wf-input" defaultValue="0" />
                        <span className="wf-suffix">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="waterfall-pro-rata-row">
                    <label className="waterfall-pro-rata">
                      <input type="checkbox" defaultChecked />
                      <span>Pro rata</span>
                    </label>
                    <label className="waterfall-pro-rata">
                      <input type="checkbox" className="waterfall-checkbox" />
                      <span>Pro rata</span>
                    </label>
                    <label className="waterfall-pro-rata">
                      <input type="checkbox" className="waterfall-checkbox" />
                      <span>Pro rata</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="waterfall-step-card">
              <div className="waterfall-step-header">
                <div className="waterfall-step-title">Step 4</div>
              </div>
              <div className="waterfall-step-body">
                <div className="waterfall-row waterfall-row--dense">
                  <div className="waterfall-column-name">
                    <div className="field-label">
                      Name<span className="required">*</span>
                    </div>
                    <input
                      type="text"
                      className="field-input"
                      placeholder="Special return"
                    />
                  </div>
                </div>

                {/* Enveloppe 1 */}
                <div className="waterfall-envelope-block">
                  <div className="waterfall-envelope-row">
                    <div className="waterfall-envelope-label">
                      Enveloppe 1<span className="required">*</span>
                    </div>

                    <div className="waterfall-envelope-rate">
                      <div className="field-label">Rate</div>
                      <div className="wf-input-with-suffix">
                        <input
                          type="text"
                          className="wf-input"
                          placeholder="Ex: 8"
                        />
                        <span className="wf-suffix">%</span>
                      </div>
                    </div>

                    <div className="waterfall-envelope-share">
                      <div className="waterfall-shares-header">Shares A1</div>
                      <div className="wf-input-with-suffix wf-input-with-suffix--compact">
                        <input type="text" className="wf-input" defaultValue="0" />
                        <span className="wf-suffix">%</span>
                      </div>
                    </div>

                    <div className="waterfall-envelope-share">
                      <div className="waterfall-shares-header">Shares A2</div>
                      <div className="wf-input-with-suffix wf-input-with-suffix--compact">
                        <input type="text" className="wf-input" defaultValue="0" />
                        <span className="wf-suffix">%</span>
                      </div>
                    </div>

                    <div className="waterfall-envelope-share">
                      <div className="waterfall-shares-header">Shares B</div>
                      <div className="wf-input-with-suffix wf-input-with-suffix--compact">
                        <input type="text" className="wf-input" defaultValue="0" />
                        <span className="wf-suffix">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="waterfall-pro-rata-row">
                    <label className="waterfall-pro-rata">
                      <input type="checkbox" defaultChecked />
                      <span>Pro rata</span>
                    </label>
                    <label className="waterfall-pro-rata">
                      <input type="checkbox" className="waterfall-checkbox" />
                      <span>Pro rata</span>
                    </label>
                    <label className="waterfall-pro-rata">
                      <input type="checkbox" className="waterfall-checkbox" />
                      <span>Pro rata</span>
                    </label>
                  </div>
                </div>

                {/* Enveloppe 2 */}
                <div className="waterfall-envelope-block">
                  <div className="waterfall-envelope-row">
                    <div className="waterfall-envelope-label">
                      Enveloppe 2<span className="required">*</span>
                    </div>

                    <div className="waterfall-envelope-rate">
                      <div className="field-label">Rate</div>
                      <div className="wf-input-with-suffix">
                        <input
                          type="text"
                          className="wf-input"
                          placeholder="Ex: 8"
                        />
                        <span className="wf-suffix">%</span>
                      </div>
                    </div>

                    <div className="waterfall-envelope-share">
                      <div className="waterfall-shares-header">Shares A1</div>
                      <div className="wf-input-with-suffix wf-input-with-suffix--compact">
                        <input type="text" className="wf-input" defaultValue="0" />
                        <span className="wf-suffix">%</span>
                      </div>
                    </div>

                    <div className="waterfall-envelope-share">
                      <div className="waterfall-shares-header">Shares A2</div>
                      <div className="wf-input-with-suffix wf-input-with-suffix--compact">
                        <input type="text" className="wf-input" defaultValue="0" />
                        <span className="wf-suffix">%</span>
                      </div>
                    </div>

                    <div className="waterfall-envelope-share">
                      <div className="waterfall-shares-header">Shares B</div>
                      <div className="wf-input-with-suffix wf-input-with-suffix--compact">
                        <input type="text" className="wf-input" defaultValue="0" />
                        <span className="wf-suffix">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="waterfall-pro-rata-row">
                    <label className="waterfall-pro-rata">
                      <input type="checkbox" defaultChecked />
                      <span>Pro rata</span>
                    </label>
                    <label className="waterfall-pro-rata">
                      <input type="checkbox" className="waterfall-checkbox" />
                      <span>Pro rata</span>
                    </label>
                    <label className="waterfall-pro-rata">
                      <input type="checkbox" className="waterfall-checkbox" />
                      <span>Pro rata</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Management fees tab */}
        {activeTab === "Management fees" && (
          <div className="mgmt-wrap">
            {MANAGEMENT_PHASES.map((phase) => (
              <div key={phase.id} className="mgmt-card">
                <div className="mgmt-phase-title">{phase.phaseTitle}</div>

                <div className="mgmt-phase-body">
                  <div className="mgmt-name-col">
                    <div className="field-label">
                      Name<span className="required">*</span>
                    </div>
                    <input
                      type="text"
                      className="field-input"
                      defaultValue={phase.name}
                    />
                  </div>

                  <div className="mgmt-meta-row">
                    {phase.fields.map((item) => (
                      <div key={item.label} className="mgmt-meta-item">
                        <div className="mgmt-meta-label">{item.label}</div>
                        <div className="mgmt-meta-value">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
