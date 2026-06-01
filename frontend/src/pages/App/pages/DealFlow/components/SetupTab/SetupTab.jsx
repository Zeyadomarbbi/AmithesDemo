import React, { useEffect, useMemo, useState } from "react";
import SearchBar from "/src/components/SearchBar/SearchBar";
import {
  PlusIcon,
  EditLineIcon,
  DoneIcon,
  CloseIcon,
} from "/src/components/Icons/InteractiveIcons";
import Toast from "../../../../components/Toast/Toast";
import { useToast } from "../../../../components/Toast/useToast";
import { SETUP_CATEGORIES, DEAL_TEAM_KEY, buildSetupCode, useSetupBackend, useDealTeamBackend } from "./setupbackend.jsx";
import "./SetupTab.css";

const COLOR_PALETTE = [
  "#c4b5fd", "#a7f3d0", "#bae6fd", "#fde68a",
  "#fca5a5", "#fdba74", "#67e8f9", "#f9a8d4",
];

function createEmptyDraft() {
  return {
    name: "",
    code: "",
    color: COLOR_PALETTE[0],
    displayOrder: "",
    isActive: true,
  };
}

function ColorPicker({ value, onChange }) {
  return (
    <div className="setup-color-picker">
      {COLOR_PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          className={`setup-color-dot${value === color ? " setup-color-dot--active" : ""}`}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
          aria-label={`Pick color ${color}`}
        />
      ))}
    </div>
  );
}

function SetupStatusBadge({ isActive }) {
  return (
    <span className={`setup-status-badge${isActive ? "" : " setup-status-badge--inactive"}`}>
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function CategoryPanel({ category, items, isLoading, isSaving, onCreate, onUpdate, onToggleActive, onErrorToast, searchQuery }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(createEmptyDraft());

  useEffect(() => {
    setEditingId(null);
    setDraft(createEmptyDraft());
  }, [category.key]);

  const filteredItems = useMemo(() => {
    const query = String(searchQuery || "").trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      [item.name, item.code]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [items, searchQuery]);

  const startCreate = () => {
    setEditingId("__new__");
    setDraft(createEmptyDraft());
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setDraft({
      name: item.name || "",
      code: item.code || "",
      color: item.color || COLOR_PALETTE[0],
      displayOrder: item.displayOrder ?? "",
      isActive: item.isActive !== false,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(createEmptyDraft());
  };

  const handleDraftNameChange = (value) => {
    setDraft((prev) => {
      const nextName = value;
      const shouldAutofillCode = !prev.code || prev.code === buildSetupCode(prev.name);
      return {
        ...prev,
        name: nextName,
        code: shouldAutofillCode ? buildSetupCode(nextName) : prev.code,
      };
    });
  };

  const saveDraft = async (itemId) => {
    const payload = {
      ...draft,
      name: String(draft.name || "").trim(),
      code: String(draft.code || "").trim().toUpperCase(),
      color: category.hasColor ? draft.color : "",
    };

    if (!payload.name) {
      onErrorToast("Name is required.");
      return;
    }
    if (!payload.code) {
      onErrorToast("Code is required.");
      return;
    }

    try {
      if (itemId === "__new__") {
        await onCreate(payload);
      } else {
        await onUpdate(itemId, payload);
      }
      cancelEdit();
    } catch {
      // Error toast already handled by caller.
    }
  };

  return (
    <div className="setup-panel">
      <div className="setup-panel-header">
        <h2 className="setup-panel-title">{category.label}</h2>
        <button className="setup-add-btn" onClick={startCreate} disabled={editingId === "__new__" || isSaving}>
          <PlusIcon /> New {category.itemLabel}
        </button>
      </div>

      <div className="setup-table-wrap">
        <table className="setup-table">
          <thead>
            <tr>
              <th className="setup-th setup-th--name">Name</th>
              <th className="setup-th setup-th--code">Code</th>
              {category.hasColor && <th className="setup-th setup-th--color">Color</th>}
              <th className="setup-th setup-th--order">Display order</th>
              <th className="setup-th setup-th--status">Status</th>
              <th className="setup-th setup-th--actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {editingId === "__new__" && (
              <tr className="setup-row setup-row--editing">
                <td className="setup-td">
                  <input
                    autoFocus
                    className="setup-input"
                    placeholder={`New ${category.itemLabel}`}
                    value={draft.name}
                    onChange={(e) => handleDraftNameChange(e.target.value)}
                  />
                </td>
                <td className="setup-td">
                  <input
                    className="setup-input"
                    placeholder="CODE_NAME"
                    value={draft.code}
                    onChange={(e) => setDraft((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  />
                </td>
                {category.hasColor && (
                  <td className="setup-td">
                    <ColorPicker value={draft.color} onChange={(color) => setDraft((prev) => ({ ...prev, color }))} />
                  </td>
                )}
                <td className="setup-td">
                  <input
                    className="setup-input"
                    placeholder="Order"
                    value={draft.displayOrder}
                    onChange={(e) => setDraft((prev) => ({ ...prev, displayOrder: e.target.value.replace(/[^\d-]/g, "") }))}
                  />
                </td>
                <td className="setup-td">
                  <SetupStatusBadge isActive={draft.isActive} />
                </td>
                <td className="setup-td setup-td--actions">
                  <div className="setup-actions">
                    <button className="setup-icon-btn setup-icon-btn--save" onClick={() => saveDraft("__new__")}><DoneIcon /></button>
                    <button className="setup-icon-btn setup-icon-btn--cancel" onClick={cancelEdit}><CloseIcon /></button>
                  </div>
                </td>
              </tr>
            )}

            {isLoading && (
              <tr>
                <td className="setup-empty" colSpan={category.hasColor ? 6 : 5}>Loading {category.itemLabel}s...</td>
              </tr>
            )}

            {!isLoading && filteredItems.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <tr key={item.id} className={`setup-row${isEditing ? " setup-row--editing" : ""}${item.isActive ? "" : " setup-row--inactive"}`}>
                  <td className="setup-td">
                    {isEditing ? (
                      <input
                        autoFocus
                        className="setup-input"
                        value={draft.name}
                        onChange={(e) => handleDraftNameChange(e.target.value)}
                      />
                    ) : (
                      item.name
                    )}
                  </td>
                  <td className="setup-td">
                    {isEditing ? (
                      <input
                        className="setup-input"
                        value={draft.code}
                        onChange={(e) => setDraft((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      />
                    ) : (
                      <code className="setup-code">{item.code}</code>
                    )}
                  </td>
                  {category.hasColor && (
                    <td className="setup-td">
                      {isEditing ? (
                        <ColorPicker value={draft.color} onChange={(color) => setDraft((prev) => ({ ...prev, color }))} />
                      ) : item.color ? (
                        <span className="setup-color-swatch" style={{ backgroundColor: item.color }} />
                      ) : (
                        "-"
                      )}
                    </td>
                  )}
                  <td className="setup-td">
                    {isEditing ? (
                      <input
                        className="setup-input"
                        value={draft.displayOrder}
                        onChange={(e) => setDraft((prev) => ({ ...prev, displayOrder: e.target.value.replace(/[^\d-]/g, "") }))}
                      />
                    ) : (
                      item.displayOrder === "" || item.displayOrder === null ? "-" : item.displayOrder
                    )}
                  </td>
                  <td className="setup-td">
                    <SetupStatusBadge isActive={isEditing ? draft.isActive : item.isActive} />
                  </td>
                  <td className="setup-td setup-td--actions">
                    <div className="setup-actions">
                      {isEditing ? (
                        <>
                          <button className="setup-icon-btn setup-icon-btn--save" onClick={() => saveDraft(item.id)}><DoneIcon /></button>
                          <button className="setup-icon-btn setup-icon-btn--cancel" onClick={cancelEdit}><CloseIcon /></button>
                        </>
                      ) : (
                        <>
                          <button className="setup-icon-btn" onClick={() => startEdit(item)} aria-label="Edit" disabled={isSaving}><EditLineIcon /></button>
                          <button
                            className={`setup-toggle-btn${item.isActive ? "" : " setup-toggle-btn--inactive"}`}
                            onClick={() => onToggleActive(item)}
                            disabled={isSaving}
                          >
                            {item.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {!isLoading && editingId !== "__new__" && filteredItems.length === 0 && (
              <tr>
                <td className="setup-empty" colSpan={category.hasColor ? 6 : 5}>
                  {searchQuery
                    ? `No ${category.itemLabel} matches your search.`
                    : `No ${category.itemLabel} yet. Click "New ${category.itemLabel}" to add one.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function buildInitials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("") || "?";
}

function DealTeamPanel({ onSuccessToast, onErrorToast }) {
  const { members, isLoading, isSaving, createMember, updateMember } = useDealTeamBackend();
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ name: "", email: "" });

  const startCreate = () => {
    setEditingId("__new__");
    setDraft({ name: "", email: "" });
  };

  const startEdit = (member) => {
    setEditingId(member.id);
    setDraft({ name: member.name, email: member.email });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({ name: "", email: "" });
  };

  const handleSave = async (memberId) => {
    if (!draft.name.trim()) { onErrorToast("Name is required."); return; }
    try {
      if (memberId === "__new__") {
        const created = await createMember(draft);
        onSuccessToast(`"${created.name}" added to the deal team.`);
      } else {
        const updated = await updateMember(memberId, draft);
        onSuccessToast(`"${updated.name}" updated.`);
      }
      cancelEdit();
    } catch {
      onErrorToast("Could not save. Please try again.");
    }
  };

  return (
    <div className="setup-panel">
      <div className="setup-panel-header">
        <h2 className="setup-panel-title">Deal team &amp; support</h2>
        <button className="setup-add-btn" onClick={startCreate} disabled={editingId === "__new__" || isSaving}>
          <PlusIcon /> New member
        </button>
      </div>

      <div className="setup-table-wrap">
        <table className="setup-table">
          <thead>
            <tr>
              <th className="setup-th setup-th--name">Member</th>
              <th className="setup-th">Email</th>
              <th className="setup-th setup-th--actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {editingId === "__new__" && (
              <tr className="setup-row setup-row--editing">
                <td className="setup-td">
                  <input autoFocus className="setup-input" placeholder="Full name" value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} />
                </td>
                <td className="setup-td">
                  <input className="setup-input" type="email" placeholder="email@example.com" value={draft.email} onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))} />
                </td>
                <td className="setup-td setup-td--actions">
                  <div className="setup-actions">
                    <button className="setup-icon-btn setup-icon-btn--save" onClick={() => handleSave("__new__")}><DoneIcon /></button>
                    <button className="setup-icon-btn setup-icon-btn--cancel" onClick={cancelEdit}><CloseIcon /></button>
                  </div>
                </td>
              </tr>
            )}

            {isLoading && (
              <tr><td className="setup-empty" colSpan={3}>Loading team members...</td></tr>
            )}

            {!isLoading && members.map((member) => {
              const isEditing = editingId === member.id;
              return (
                <tr key={member.id} className={`setup-row${isEditing ? " setup-row--editing" : ""}`}>
                  <td className="setup-td">
                    <div className="setup-team-member-cell">
                      <span className="setup-team-avatar">{buildInitials(isEditing ? draft.name : member.name)}</span>
                      {isEditing ? (
                        <input autoFocus className="setup-input" value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} />
                      ) : (
                        <span>{member.name}</span>
                      )}
                    </div>
                  </td>
                  <td className="setup-td">
                    {isEditing ? (
                      <input className="setup-input" type="email" value={draft.email} onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))} />
                    ) : (
                      <span className="setup-team-email">{member.email || "—"}</span>
                    )}
                  </td>
                  <td className="setup-td setup-td--actions">
                    <div className="setup-actions">
                      {isEditing ? (
                        <>
                          <button className="setup-icon-btn setup-icon-btn--save" onClick={() => handleSave(member.id)}><DoneIcon /></button>
                          <button className="setup-icon-btn setup-icon-btn--cancel" onClick={cancelEdit}><CloseIcon /></button>
                        </>
                      ) : (
                        <button className="setup-icon-btn" onClick={() => startEdit(member)} disabled={isSaving} aria-label="Edit"><EditLineIcon /></button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {!isLoading && editingId !== "__new__" && members.length === 0 && (
              <tr><td className="setup-empty" colSpan={3}>No team members yet. Click "New member" to add one.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SetupTab() {
  const [activeKey, setActiveKey] = useState(SETUP_CATEGORIES[0].key);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast, showToast, closeToast } = useToast();

  const isDealTeam = activeKey === DEAL_TEAM_KEY;
  const activeCategory = SETUP_CATEGORIES.find((category) => category.key === activeKey) || SETUP_CATEGORIES[0];
  const { items, isLoading, isSaving, error, createItem, updateItem, toggleItemActive } = useSetupBackend(isDealTeam ? null : activeCategory.taxonomyType);

  useEffect(() => {
    if (error) {
      showToast({
        type: "error",
        title: "Setup failed",
        message: error,
      });
    }
  }, [error, showToast]);

  const countsByKey = useMemo(
    () => Object.fromEntries(SETUP_CATEGORIES.map((category) => [category.key, category.key === activeKey ? items.length : null])),
    [activeKey, items.length]
  );

  const handleCreate = async (payload) => {
    const created = await createItem(payload);
    showToast({
      type: "success",
      title: "Item created",
      message: `"${created.name}" has been created successfully.`,
    });
    return created;
  };

  const handleUpdate = async (itemId, payload) => {
    const updated = await updateItem(itemId, payload);
    showToast({
      type: "success",
      title: "Item updated",
      message: `"${updated.name}" has been updated successfully.`,
    });
    return updated;
  };

  const handleToggleActive = async (item) => {
    try {
      const updated = await toggleItemActive(item);
      showToast({
        type: "success",
        title: updated.isActive ? "Item activated" : "Item deactivated",
        message: `"${updated.name}" is now ${updated.isActive ? "active" : "inactive"}.`,
      });
    } catch {
      // Toast comes from hook error effect.
    }
  };

  const handleErrorToast = (message) => {
    showToast({
      type: "error",
      title: "Validation failed",
      message,
    });
  };

  return (
    <div className="setup-wrapper">
      <div className="setup-topbar">
        <SearchBar placeholder="Search by name or code..." onSearch={setSearchQuery} />
      </div>

      <div className="setup-subtabs">
        {SETUP_CATEGORIES.map((category) => (
          <button
            key={category.key}
            className={`setup-subtab${activeKey === category.key ? " active" : ""}`}
            onClick={() => setActiveKey(category.key)}
          >
            {category.label}
            <span className="setup-subtab-count">{countsByKey[category.key] ?? "-"}</span>
          </button>
        ))}
        <button
          className={`setup-subtab${activeKey === DEAL_TEAM_KEY ? " active" : ""}`}
          onClick={() => setActiveKey(DEAL_TEAM_KEY)}
        >
          Deal team & Support
        </button>
      </div>

      {isDealTeam ? (
        <DealTeamPanel
          onSuccessToast={(msg) => showToast({ type: "success", title: "Team updated", message: msg })}
          onErrorToast={(msg) => showToast({ type: "error", title: "Error", message: msg })}
        />
      ) : (
        <CategoryPanel
          category={activeCategory}
          items={items}
          isLoading={isLoading}
          isSaving={isSaving}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onToggleActive={handleToggleActive}
          onErrorToast={handleErrorToast}
          searchQuery={searchQuery}
        />
      )}

      {toast && (
        <Toast
          key={toast.key}
          title={toast.title}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={closeToast}
        />
      )}
    </div>
  );
}
