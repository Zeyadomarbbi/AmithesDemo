import React, { useState, useEffect } from "react";
import { CloseIcon, PlusIcon } from "/src/components/Icons/InteractiveIcons";
import { ChevronDownIcon, ChevronDoubleLeftIcon } from "/src/components/Icons/DirectionIcons";
import { useTableSort, SortableHeaderRenderer } from "/src/components/Sort/TableSort";
import { useCountries } from "../../../../../../hooks/Reference/useCountries";
import { useCurrencies } from "../../../../../../hooks/Reference/useCurrencies";
import SimpleDropdown from "/src/components/SearchBar/SimpleDropdown/SimpleDropdown.jsx";
import EventsTab from "../EventsTab/EventsTab";
import CapTable from "../CapTab/CapTable";
import Dataroom from "../DataroomTab/Dataroom";
import KPIsTab from "../KPIsTab/KPIsTab";
import OtherTab from "../OtherTab/OtherTab";
import "./InfoTab.css";

const TABS = ["Information", "Events", "Cap table", "Dataroom", "KPIs", "Other"];

const TEAM_DATA = [
  { id: 1, initials: "AR", color: "#E8734A", name: "Alice Right",  position: "Partner"   },
  { id: 2, initials: "JD", color: "#375A89", name: "Jean Dupont",  position: "Director"  },
  { id: 3, initials: "VD", color: "#7B6FC6", name: "Vasco Durand", position: "Associate" },
  { id: 4, initials: "VD", color: "#7B6FC6", name: "Vasco Durand", position: "Analyst"   },
  { id: 5, initials: "AR", color: "#E8734A", name: "Alice Right",  position: "Support 1" },
  { id: 6, initials: "JD", color: "#375A89", name: "Jean Dupont",  position: "Support 2" },
];

function SelectWrap({ children }) {
  return (
    <div className="it-select-wrap">
      {children}
      <span className="it-select-chevron"><ChevronDownIcon /></span>
    </div>
  );
}

function SectionHeader({ label }) {
  return (
    <div className="it-section-header">
      <span className="it-section-label">{label}</span>
    </div>
  );
}

function InfoTab({ deal, onClose }) {
  const [activeTab, setActiveTab] = useState("Information");
  const [isExpanded, setIsExpanded] = useState(false);
  const teamSort = useTableSort(TEAM_DATA, "name");
  const { countries = [] } = useCountries();
  const { currencies = [] } = useCurrencies();

  const countryOptions = countries.map((c) => ({
    id: c.id,
    name: c.name || c.country_name || "",
  }));

  const currencyOptions = currencies.map((c) => ({
    id: c.id,
    name: `${c.currency_name || c.name || ""} (${c.currency_code || c.code || ""})`,
  }));

  const [form, setForm] = useState({
    dealName:               deal?.name     || "",
    codeName:               deal?.code     || "",
    sector:                 deal?.sector   || "",
    businessDescription:    "",
    status:                 deal?.status   || "",
    stage:                  deal?.stage    || "",
    fund:                   deal?.fund     || "",
    ticket:                 deal?.ticket   || "",
    currency:               "",
    legalForm:              "",
    countryOfIncorporation: "",
    countryOfMainOperation: "",
    sourceType:             "",
    contact:                "",
    sponsors:               "",
    sourcingRelevantInfo:   "",
    exitType:               "",
    exitRelevantInfo:       "",
    website:                "",
    registrationNumber:     "",
    address:                "",
    zipCode:                "",
    city:                   "",
    country:                "",
  });

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    if (!deal) return;
    setForm({
      dealName:               deal.name     || "",
      codeName:               deal.code     || "",
      sector:                 deal.sector   || "",
      businessDescription:    "",
      status:                 deal.status   || "",
      stage:                  deal.stage    || "",
      fund:                   deal.fund     || "",
      ticket:                 deal.ticket   || "",
      currency:               "",
      legalForm:              "",
      countryOfIncorporation: "",
      countryOfMainOperation: "",
      sourceType:             "",
      contact:                "",
      sponsors:               "",
      sourcingRelevantInfo:   "",
      exitType:               "",
      exitRelevantInfo:       "",
      website:                "",
      registrationNumber:     "",
      address:                "",
      zipCode:                "",
      city:                   "",
      country:                "",
    });
  }, [deal?.id]);

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const updateDirect = (key) => (val) => setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="it-overlay" onClick={onClose}>
      <aside className={`it-drawer${isExpanded ? " it-drawer--expanded" : ""}`} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="it-header">
          <button
            className="it-expand-btn"
            onClick={() => setIsExpanded(prev => !prev)}
            style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.3s ease" }}
          >
            <ChevronDoubleLeftIcon />
          </button>
          <h2 className="it-company-name">{deal?.name}</h2>
          <button className="it-close-btn" onClick={onClose}><CloseIcon /></button>
        </div>

        {/* Tabs */}
        <div className="it-tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`it-tab${activeTab === tab ? " active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="it-body">
          {activeTab === "Events" && <EventsTab />}
          {activeTab === "Cap table" && <CapTable />}
          {activeTab === "Dataroom" && <Dataroom />}
          {activeTab === "KPIs" && <KPIsTab />}
          {activeTab === "Other" && <OtherTab />}
          {activeTab === "Information" && (
            <>
              <SectionHeader label="General information" />

              <div className="it-grid-3">
                <div className="it-field">
                  <label className="it-label">Deal Name</label>
                  <input className="it-input" value={form.dealName} onChange={update("dealName")} placeholder="Deal name" />
                </div>
                <div className="it-field">
                  <label className="it-label">Code Name</label>
                  <input className="it-input" value={form.codeName} onChange={update("codeName")} placeholder="Code name" />
                </div>
                <div className="it-field">
                  <label className="it-label">Sector</label>
                  <SelectWrap>
                    <select className="it-select" value={form.sector} onChange={update("sector")}>
                      <option value="" disabled hidden>Please select a sector</option>
                      <option>Healthcare</option>
                      <option>Software</option>
                      <option>Energy</option>
                      <option>Materials</option>
                      <option>Defense</option>
                      <option>Industry</option>
                      <option>Real Estate</option>
                      <option>Utilities</option>
                    </select>
                  </SelectWrap>
                </div>
              </div>

              <div className="it-field">
                <label className="it-label">Business description</label>
                <textarea className="it-textarea" value={form.businessDescription} onChange={update("businessDescription")} placeholder="Please describe the business activity" />
              </div>

              <div className="it-grid-3">
                <div className="it-field">
                  <label className="it-label">Status</label>
                  <SelectWrap>
                    <select className="it-select" value={form.status} onChange={update("status")}>
                      <option value="" disabled hidden>Please select a status</option>
                      <option>Live</option>
                      <option>Invested</option>
                      <option>Dropped</option>
                      <option>Exited</option>
                    </select>
                  </SelectWrap>
                </div>
                <div className="it-field">
                  <label className="it-label">Stage</label>
                  <SelectWrap>
                    <select className="it-select" value={form.stage} onChange={update("stage")}>
                      <option value="" disabled hidden>Please select a stage</option>
                      <option>Sourcing</option>
                      <option>Briefing</option>
                      <option>IC 1</option>
                      <option>IC 2</option>
                      <option>Invested</option>
                    </select>
                  </SelectWrap>
                </div>
                <div className="it-field">
                  <label className="it-label">Fund</label>
                  <input className="it-input" value={form.fund} onChange={update("fund")} placeholder="Please enter a fund" />
                </div>
              </div>

              <div className="it-grid-2">
                <div className="it-field">
                  <label className="it-label">Ticket</label>
                  <input className="it-input" value={form.ticket} onChange={update("ticket")} placeholder="Please enter a ticket amount" />
                </div>
                <div className="it-field">
                  <label className="it-label">Currency</label>
                  <SimpleDropdown
                    options={currencyOptions}
                    value={form.currency}
                    onChange={updateDirect("currency")}
                    placeholder="Please select a currency"
                    labelKey="name"
                    valueKey="id"
                  />
                </div>
              </div>

              <div className="it-grid-3">
                <div className="it-field">
                  <label className="it-label">Legal form</label>
                  <input className="it-input" value={form.legalForm} onChange={update("legalForm")} placeholder="Please enter a legal form" />
                </div>
                <div className="it-field">
                  <label className="it-label">Country of incorporation</label>
                  <SimpleDropdown
                    options={countryOptions}
                    value={form.countryOfIncorporation}
                    onChange={updateDirect("countryOfIncorporation")}
                    placeholder="Please select a country"
                    labelKey="name"
                    valueKey="id"
                  />
                </div>
                <div className="it-field">
                  <label className="it-label">Country of main operation</label>
                  <SimpleDropdown
                    options={countryOptions}
                    value={form.countryOfMainOperation}
                    onChange={updateDirect("countryOfMainOperation")}
                    placeholder="Please select a country"
                    labelKey="name"
                    valueKey="id"
                  />
                </div>
              </div>

              <SectionHeader label="Sourcing" />

              <div className="it-grid-2">
                <div className="it-field">
                  <label className="it-label">Source type</label>
                  <SelectWrap>
                    <select className="it-select" value={form.sourceType} onChange={update("sourceType")}>
                      <option value="" disabled hidden>Please select a source type</option>
                      <option>Proprietary</option>
                      <option>M&A</option>
                      <option>Co-Invest</option>
                    </select>
                  </SelectWrap>
                </div>
                <div className="it-field">
                  <label className="it-label">Contact</label>
                  <input className="it-input" value={form.contact} onChange={update("contact")} placeholder="Please enter a contact" />
                </div>
              </div>

              <div className="it-field">
                <label className="it-label">Sponsor(s)</label>
                <input className="it-input" value={form.sponsors} onChange={update("sponsors")} placeholder="Please enter a sponsor" />
              </div>

              <div className="it-field">
                <label className="it-label">Relevant information</label>
                <textarea className="it-textarea" value={form.sourcingRelevantInfo} onChange={update("sourcingRelevantInfo")} placeholder="Please enter any relevant information regarding the sourcing" />
              </div>

              <SectionHeader label="Exit details" />

              <div className="it-field">
                <label className="it-label">Exit type</label>
                <input className="it-input" value={form.exitType} onChange={update("exitType")} placeholder="Please enter an exit type" />
              </div>

              <div className="it-field">
                <label className="it-label">Relevant information</label>
                <textarea className="it-textarea" value={form.exitRelevantInfo} onChange={update("exitRelevantInfo")} placeholder="Please enter any relevant information regarding the sourcing" />
              </div>

              <SectionHeader label="Additional information" />

              <div className="it-grid-2">
                <div className="it-field">
                  <label className="it-label">Website</label>
                  <input className="it-input" value={form.website} onChange={update("website")} placeholder="Please enter a website" />
                </div>
                <div className="it-field">
                  <label className="it-label">Registration number</label>
                  <input className="it-input" value={form.registrationNumber} onChange={update("registrationNumber")} placeholder="Please enter a registration number" />
                </div>
              </div>

              <div className="it-grid-4">
                <div className="it-field">
                  <label className="it-label">Address</label>
                  <input className="it-input" value={form.address} onChange={update("address")} placeholder="Please enter an address" />
                </div>
                <div className="it-field">
                  <label className="it-label">Zip Code</label>
                  <input className="it-input" value={form.zipCode} onChange={update("zipCode")} placeholder="Please enter a zip code" />
                </div>
                <div className="it-field">
                  <label className="it-label">City</label>
                  <input className="it-input" value={form.city} onChange={update("city")} placeholder="Please enter a city" />
                </div>
                <div className="it-field">
                  <label className="it-label">Country</label>
                  <SimpleDropdown
                    options={countryOptions}
                    value={form.country}
                    onChange={updateDirect("country")}
                    placeholder="Please select a country"
                    labelKey="name"
                    valueKey="id"
                  />
                </div>
              </div>

              <SectionHeader label="Deal team & support" />

              <div className="it-team-container">
                <table className="it-team-table">
                  <thead>
                    <tr>
                      <th className="it-team-th">
                        <SortableHeaderRenderer label="User" columnKey="name" currentSortKey={teamSort.sortKey} toggleSort={teamSort.toggleSort} center={false} />
                      </th>
                      <th className="it-team-th">
                        <SortableHeaderRenderer label="Position" columnKey="position" currentSortKey={teamSort.sortKey} toggleSort={teamSort.toggleSort} center={false} />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamSort.sorted.map((member) => (
                      <tr key={member.id} className="it-team-row">
                        <td className="it-team-td">
                          <div className="it-user-cell">
                            <span className="it-user-avatar">{member.initials}</span>
                            <span className="it-user-name">{member.name}</span>
                          </div>
                        </td>
                        <td className="it-team-td">{member.position}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="it-team-footer-row"><td colSpan={2} /></tr></tfoot>
                </table>
                <button className="it-new-user-btn"><PlusIcon /> New user</button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="it-footer">
          <button className="it-save-btn">Save</button>
        </div>

      </aside>
    </div>
  );
}

export default InfoTab;
