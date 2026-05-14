import React, { useState, useLayoutEffect, useRef } from "react";
import SearchBar from "/src/components/SearchBar/SearchBar";
import { PlusIcon, FileDownloadIcon } from "/src/components/Icons/InteractiveIcons";
import { MoreVerticalIcon } from "/src/components/Icons/MiscIcons";
import DateInputWithPicker from "/src/components/DateComponents/DateInput.jsx";
import NewEventModal from "./components/NewEventModal";
import "./EventsTab.css";

function AutoResizeTextarea({ value, onChange, className }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);
  return <textarea ref={ref} className={className} value={value} onChange={onChange} />;
}

const EVENTS_DATA = [
  {
    id: 1,
    date: "March 7, 2025",
    title: "Transaction closing",
    description:
      "An investment has been successfully completed in Medisis, securing 42.05% shareholding for a total amount of 15m€. The transaction, structured as a minority acquisition, follows extensive due diligence and strategic alignment with long-term growth objectives. This investment aims to support market expansion, innovation funding, operational scaling, etc, unlocking new opportunities for collaboration and business development while ensuring sustainable value creation.",
    documents: ["DD_pack.pdf"],
  },
  {
    id: 2,
    date: "February 22, 2025",
    title: "Legal doc",
    description:
      "A meeting was held today with the sponsor to finalize the signing of the Shareholders' Agreement (SHA) and Share Purchase Agreement (SPA), officially securing the terms of the transaction. This step confirms the equity transfer framework, governance provisions, and financial commitments, aligning all parties on the agreed structure. With the legal documentation now executed, the process transitions into the post-signing phase, where implementation strategies and operational adjustments will follow to ensure seamless integration and compliance.",
    documents: ["SPA.pdf", "SHA.pdf"],
  },
  {
    id: 3,
    date: "January 22, 2025",
    title: "Investment committee 2",
    description:
      "A meeting was held today with the sponsor to finalize the signing of the Shareholders' Agreement (SHA) and Share Purchase Agreement (SPA), officially securing the terms of the transaction. This step confirms the equity transfer framework, governance provisions, and financial commitments, aligning all parties on the agreed structure. With the legal documentation now executed, the process transitions into the post-signing phase, where implementation strategies and operational adjustments will follow to ensure seamless integration and compliance.",
    documents: ["IC2_memo.pdf", "IC2_minutes.pdf"],
  },
  {
    id: 4,
    date: "October 23, 2024",
    title: "Negotiations with the sponsor",
    description:
      "Negotiations with the sponsor are ongoing following the initial review by the investment committee, focusing on refining key terms, governance structure, and financial conditions. Discussions are progressing to align expectations on valuation, equity distribution, and operational commitments ahead of the second committee meeting, where final approvals and execution steps will be determined.",
    documents: ["Term_sheet.pdf"],
  },
  {
    id: 5,
    date: "July 20, 2024",
    title: "Investment committee 1",
    description:
      "The investment committee has conducted its first review of the transaction, assessing its strategic relevance, financial structure, and risk profile. Preliminary discussions have validated the capital deployment strategy and growth potential, allowing the process to move forward for further due diligence and detailed structuring. Next steps will focus on refining key terms and aligning all stakeholders before advancing to final approval. Further updates will follow as the evaluation progresses.",
    documents: ["IC1_memo.pdf", "IC1_minutes.pdf"],
  },
  {
    id: 6,
    date: "June 18, 2024",
    title: "Preliminary discussions",
    description:
      "The deal was sourced through a M&A boutique, facilitated by Josh Doe, who identified the opportunity within the medical equipment segment. Initial Information has been received on March 15, 2024, including a preliminary teaser document outlining the key parameters. Following an initial assessment, the opportunity was validated based on FY23 figures, leading to deeper exploration. As the sourcing phase concludes, preparations for due diligence and structuring are now underway to advance the process toward investment committee 1.",
    documents: ["Teaser.pdf"],
  },
];

export default function EventsTab() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [eventData, setEventData] = useState(
    Object.fromEntries(EVENTS_DATA.map((e) => [e.id, {
      title: e.title,
      description: e.description,
      date: new Date(e.date),
    }]))
  );

  const filtered = EVENTS_DATA.filter((e) =>
    (eventData[e.id]?.title ?? e.title).toLowerCase().includes(search.trim().toLowerCase())
  );

  const updateField = (id, field) => (ev) =>
    setEventData((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: ev.target.value } }));

  const updateDate = (id) => (d) =>
    setEventData((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), date: d } }));

  return (
    <div className="et-wrapper">
      {showModal && (
        <NewEventModal
          onClose={() => setShowModal(false)}
          onSubmit={(data) => { console.log(data); setShowModal(false); }}
        />
      )}
      {/* Toolbar */}
      <div className="et-toolbar">
        <SearchBar placeholder="Search an event..." onSearch={setSearch} />
        <div className="et-toolbar-right">
          <span className="et-count">{filtered.length} events</span>
          <button className="et-new-btn" onClick={() => setShowModal(true)}><PlusIcon /> New event</button>
        </div>
      </div>

      {/* Event list */}
      <div className="et-list">
        {filtered.map((event) => (
          <div key={event.id} className="et-card">
            {/* Left column */}
            <div className="et-left">
              <span className="et-meta-label">Date</span>
              <DateInputWithPicker
                initialDate={eventData[event.id]?.date ?? new Date(event.date)}
                onDateChange={updateDate(event.id)}
                isSingle={true}
                dateFormat="DD/MM/YYYY"
              />
              <span className="et-meta-label et-docs-label">Documents</span>
              <div className="et-docs">
                {event.documents.map((doc, i) => (
                  <div key={`${event.id}-${i}-${doc}`} className="et-doc-item">
                    <span className="et-doc-name">{doc}</span>
                    <span className="et-doc-icon"><FileDownloadIcon /></span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column */}
            <div className="et-right">
              <div className="et-right-header">
                <input
                  className="et-title-input"
                  value={eventData[event.id]?.title ?? event.title}
                  onChange={updateField(event.id, "title")}
                />
                <button className="et-more-btn"><MoreVerticalIcon /></button>
              </div>
              <AutoResizeTextarea
                className="et-description-input"
                value={eventData[event.id]?.description ?? event.description}
                onChange={updateField(event.id, "description")}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
