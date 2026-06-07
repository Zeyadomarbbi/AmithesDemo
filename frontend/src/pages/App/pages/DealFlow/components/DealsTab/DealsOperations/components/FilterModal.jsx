import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "/src/components/Icons/DirectionIcons";
import { CloseIcon } from "/src/components/Icons/InteractiveIcons";
import "./FilterModal.css";

const STATIC_SECTIONS = [
  {
    key: "stage",
    label: "Stage",
    options: ["Preliminary discussions", "Briefing", "IC 1", "IC 2"],
    defaultOpen: true,
  },
  {
    key: "fund",
    label: "Fund",
    options: ["Amethis MENA II", "Amethis Fund II", "Amethis Europe Expansion", "Amethis Fund III"],
    defaultOpen: true,
  },
];

function FilterModal({ onClose, onApply, sectorOptions = [], countryOptions = [] }) {
  const FILTER_SECTIONS = [
    ...STATIC_SECTIONS,
    { key: "sector",  label: "Sector",  options: sectorOptions,  defaultOpen: sectorOptions.length > 0 },
    { key: "country", label: "Country", options: countryOptions, defaultOpen: countryOptions.length > 0 },
  ];

  const [openSections, setOpenSections] = useState(
    Object.fromEntries(FILTER_SECTIONS.map((s) => [s.key, s.defaultOpen]))
  );
  const [selected, setSelected] = useState(
    Object.fromEntries(FILTER_SECTIONS.map((s) => [s.key, []]))
  );

  const toggleSection = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleOption = (sectionKey, option) => {
    setSelected((prev) => {
      const current = prev[sectionKey];
      return {
        ...prev,
        [sectionKey]: current.includes(option)
          ? current.filter((x) => x !== option)
          : [...current, option],
      };
    });
  };

  const toggleAll = (sectionKey, options) => {
    setSelected((prev) => {
      const allSelected = options.every((o) => prev[sectionKey].includes(o));
      return {
        ...prev,
        [sectionKey]: allSelected ? [] : [...options],
      };
    });
  };

  const clearAll = () =>
    setSelected(Object.fromEntries(FILTER_SECTIONS.map((s) => [s.key, []])));

  const hasAnySelected = FILTER_SECTIONS.some((s) => selected[s.key].length > 0);

  return (
    <div className="fm-overlay" onClick={onClose}>
      <div className="fm-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="fm-header">
          <span className="fm-title">Filter by</span>
          <button className="fm-close" onClick={onClose}><CloseIcon /></button>
        </div>

        {/* Sections */}
        <div className="fm-body">
          {FILTER_SECTIONS.map((section) => {
            const isOpen = openSections[section.key];
            const selectedOpts = selected[section.key];
            const allChecked =
              section.options.length > 0 &&
              section.options.every((o) => selectedOpts.includes(o));
            const someChecked = selectedOpts.length > 0 && !allChecked;

            return (
              <div key={section.key} className="fm-section">
                <div className="fm-section-header">
                  <button
                    className="fm-chevron"
                    onClick={() => toggleSection(section.key)}
                  >
                    {isOpen ? <ChevronDown /> : <ChevronRight />}
                  </button>
                  <input
                    type="checkbox"
                    className="fm-checkbox"
                    checked={allChecked}
                    ref={(el) => {
                      if (el) el.indeterminate = someChecked;
                    }}
                    onChange={() => toggleAll(section.key, section.options)}
                  />
                  <span className="fm-section-label">{section.label}</span>
                </div>

                {isOpen && section.options.length > 0 && (
                  <div className="fm-options">
                    {section.options.map((opt) => (
                      <label key={opt} className="fm-option">
                        <input
                          type="checkbox"
                          className="fm-checkbox"
                          checked={selectedOpts.includes(opt)}
                          onChange={() => toggleOption(section.key, opt)}
                        />
                        <span className="fm-option-label">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="fm-footer">
          {hasAnySelected && (
            <button className="fm-btn-clear" onClick={clearAll}>
              Clear Filters
            </button>
          )}
          <button className="fm-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="fm-btn-filter"
            onClick={() => { onApply?.(selected); onClose(); }}
          >
            Filter
          </button>
        </div>

      </div>
    </div>
  );
}

export default FilterModal;
