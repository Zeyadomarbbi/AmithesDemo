import React, { useState } from "react";
import { useTableSort, SortableHeaderRenderer } from "/src/components/Sort/TableSort";
import { PlusIcon, TrashIcon, EditLineIcon, DoneIcon, CloseIcon } from "/src/components/Icons/InteractiveIcons";
import "./SetupTab.css";

const COLOR_PALETTE = [
  "#c4b5fd", "#a7f3d0", "#bae6fd", "#fde68a",
  "#fca5a5", "#fdba74", "#67e8f9", "#f9a8d4",
];

const INITIAL_DATA = {
  status: [
    { id: 1, name: "Live" },
    { id: 2, name: "Invested" },
    { id: 3, name: "Dropped" },
    { id: 4, name: "Exited" },
  ],
  stage: [
    { id: 1, name: "Sourcing", color: "#c4b5fd" },
    { id: 2, name: "Briefing", color: "#a7f3d0" },
    { id: 3, name: "IC 1",     color: "#fde68a" },
    { id: 4, name: "IC 2",     color: "#bae6fd" },
    { id: 5, name: "Invested", color: "#fca5a5" },
  ],
  source: [
    { id: 1, name: "Proprietary" },
    { id: 2, name: "M&A" },
    { id: 3, name: "Co-Invest" },
  ],
  doctype: [
    { id: 1, name: "Legal",      color: "#fca5a5" },
    { id: 2, name: "Financial",  color: "#c4b5fd" },
    { id: 3, name: "Valuation",  color: "#a7f3d0" },
    { id: 4, name: "KYC",        color: "#fde68a" },
    { id: 5, name: "Agreements", color: "#c4b5fd" },
    { id: 6, name: "IC Process", color: "#bae6fd" },
  ],
  sector: [
    { id: 1, name: "Healthcare" },
    { id: 2, name: "Software" },
    { id: 3, name: "Energy" },
    { id: 4, name: "Materials" },
    { id: 5, name: "Defense" },
    { id: 6, name: "Industry" },
    { id: 7, name: "Real Estate" },
    { id: 8, name: "Utilities" },
  ],
};

const CATEGORIES = [
  { key: "status",  label: "Status",           itemLabel: "status",           hasColor: false },
  { key: "stage",   label: "Stage",            itemLabel: "stage",            hasColor: true  },
  { key: "source",  label: "Source",           itemLabel: "source type",      hasColor: false },
  { key: "doctype", label: "Type of document", itemLabel: "type of document", hasColor: true  },
  { key: "sector",  label: "Sector",           itemLabel: "sector",           hasColor: false },
];

function ColorPicker({ value, onChange }) {
  return (
    <div className="setup-color-picker">
      {COLOR_PALETTE.map((c) => (
        <button
          key={c}
          type="button"
          className={`setup-color-dot${value === c ? " setup-color-dot--active" : ""}`}
          style={{ backgroundColor: c }}
          onClick={() => onChange(c)}
          aria-label={`Pick color ${c}`}
        />
      ))}
    </div>
  );
}

function CategoryPanel({ category, items, onChange }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ name: "", color: COLOR_PALETTE[0] });
  const sort = useTableSort(items, "name");

  const startEdit = (row) => {
    setEditingId(row.id);
    setDraft({ name: row.name, color: row.color || COLOR_PALETTE[0] });
  };
  const cancelEdit = () => {
    setEditingId(null);
    setDraft({ name: "", color: COLOR_PALETTE[0] });
  };
  const saveEdit = (id) => {
    const trimmed = draft.name.trim();
    if (!trimmed) return;
    if (id === "__new__") {
      const nextId = items.reduce((m, r) => Math.max(m, r.id), 0) + 1;
      const newRow = category.hasColor
        ? { id: nextId, name: trimmed, color: draft.color }
        : { id: nextId, name: trimmed };
      onChange([newRow, ...items]);
    } else {
      onChange(
        items.map((r) =>
          r.id === id
            ? (category.hasColor ? { ...r, name: trimmed, color: draft.color } : { ...r, name: trimmed })
            : r
        )
      );
    }
    cancelEdit();
  };
  const remove = (id) => onChange(items.filter((r) => r.id !== id));
  const addNew = () => {
    setEditingId("__new__");
    setDraft({ name: "", color: COLOR_PALETTE[0] });
  };

  const isAddingNew = editingId === "__new__";

  return (
    <div className="setup-panel">
      <div className="setup-panel-header">
        <h2 className="setup-panel-title">{category.label}</h2>
        <button className="setup-add-btn" onClick={addNew} disabled={isAddingNew}>
          <PlusIcon /> New {category.itemLabel}
        </button>
      </div>

      <div className="setup-table-wrap">
        <table className="setup-table">
          <thead>
            <tr>
              <th className="setup-th setup-th--name">
                <SortableHeaderRenderer
                  label="Name"
                  columnKey="name"
                  currentSortKey={sort.sortKey}
                  toggleSort={sort.toggleSort}
                  center={false}
                />
              </th>
              {category.hasColor && <th className="setup-th setup-th--color">Color</th>}
              <th className="setup-th setup-th--actions" />
            </tr>
          </thead>
          <tbody>
            {isAddingNew && (
              <tr className="setup-row setup-row--editing">
                <td className="setup-td setup-td--name">
                  <input
                    autoFocus
                    className="setup-input"
                    placeholder={`New ${category.itemLabel}`}
                    value={draft.name}
                    onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit("__new__");
                      if (e.key === "Escape") cancelEdit();
                    }}
                  />
                </td>
                {category.hasColor && (
                  <td className="setup-td setup-td--color">
                    <ColorPicker value={draft.color} onChange={(c) => setDraft((p) => ({ ...p, color: c }))} />
                  </td>
                )}
                <td className="setup-td setup-td--actions">
                  <div className="setup-actions">
                    <button className="setup-icon-btn setup-icon-btn--save" onClick={() => saveEdit("__new__")}><DoneIcon /></button>
                    <button className="setup-icon-btn setup-icon-btn--cancel" onClick={cancelEdit}><CloseIcon /></button>
                  </div>
                </td>
              </tr>
            )}

            {sort.sorted.map((row) => {
              const isEditing = editingId === row.id;
              return (
                <tr key={row.id} className={`setup-row${isEditing ? " setup-row--editing" : ""}`}>
                  <td className="setup-td setup-td--name">
                    {isEditing ? (
                      <input
                        autoFocus
                        className="setup-input"
                        value={draft.name}
                        onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(row.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                    ) : row.name}
                  </td>
                  {category.hasColor && (
                    <td className="setup-td setup-td--color">
                      {isEditing ? (
                        <ColorPicker value={draft.color} onChange={(c) => setDraft((p) => ({ ...p, color: c }))} />
                      ) : (
                        <span className="setup-color-swatch" style={{ backgroundColor: row.color }} />
                      )}
                    </td>
                  )}
                  <td className="setup-td setup-td--actions">
                    <div className="setup-actions">
                      {isEditing ? (
                        <>
                          <button className="setup-icon-btn setup-icon-btn--save" onClick={() => saveEdit(row.id)}><DoneIcon /></button>
                          <button className="setup-icon-btn setup-icon-btn--cancel" onClick={cancelEdit}><CloseIcon /></button>
                        </>
                      ) : (
                        <>
                          <button className="setup-icon-btn" onClick={() => startEdit(row)} aria-label="Edit"><EditLineIcon /></button>
                          <button className="setup-icon-btn setup-icon-btn--danger" onClick={() => remove(row.id)} aria-label="Delete"><TrashIcon /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {!isAddingNew && sort.sorted.length === 0 && (
              <tr>
                <td className="setup-empty" colSpan={category.hasColor ? 3 : 2}>
                  No {category.itemLabel} yet. Click “New {category.itemLabel}” to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SetupTab() {
  const [activeKey, setActiveKey] = useState(CATEGORIES[0].key);
  const [data, setData] = useState(INITIAL_DATA);

  const activeCategory = CATEGORIES.find((c) => c.key === activeKey);
  const items = data[activeKey];

  return (
    <div className="setup-wrapper">
      <div className="setup-subtabs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={`setup-subtab${activeKey === cat.key ? " active" : ""}`}
            onClick={() => setActiveKey(cat.key)}
          >
            {cat.label}
            <span className="setup-subtab-count">{data[cat.key].length}</span>
          </button>
        ))}
      </div>

      <CategoryPanel
        category={activeCategory}
        items={items}
        onChange={(next) => setData((prev) => ({ ...prev, [activeKey]: next }))}
      />
    </div>
  );
}
