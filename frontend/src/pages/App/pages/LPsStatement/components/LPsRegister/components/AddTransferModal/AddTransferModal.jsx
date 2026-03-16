// src/pages/App/pages/LPsStatement/components/AddTransferModal.jsx
import React, { useEffect, useState } from "react";
import {EuroCurrencyIcon } from "../../../../../../../../components/Icons/FinancialIcons.jsx";
import {ChevronDownIcon } from "../../../../../../../../components/Icons/DirectionIcons.jsx";
import DateInputWithPicker from "../../../../../../../../components/DateComponents/DateInput.jsx";
import "./AddTransferModal.css";




// small SVGs from your Figma
const PeerIcon = () => (
  <svg width="15" height="11" viewBox="0 0 15 11" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.7743 5.73408e-07L11.8924 1.48735e-06C12.2438 -1.04733e-05 12.547 -2.0725e-05 12.7967 0.0203818C13.0603 0.0419158 13.3224 0.0894598 13.5747 0.217989C13.951 0.409736 14.2569 0.715696 14.4487 1.09202C14.5772 1.34427 14.6248 1.60642 14.6463 1.86998C14.6667 2.1197 14.6667 2.42287 14.6667 2.77429V7.89238C14.6667 8.2438 14.6667 8.54698 14.6463 8.79669C14.6248 9.06025 14.5772 9.3224 14.4487 9.57465C14.2569 9.95097 13.951 10.2569 13.5747 10.4487C13.3224 10.5772 13.0603 10.6248 12.7967 10.6463C12.547 10.6667 12.2438 10.6667 11.8924 10.6667L2.77432 10.6667C2.42288 10.6667 2.1197 10.6667 1.86998 10.6463C1.60642 10.6248 1.34427 10.5772 1.09202 10.4487C0.715696 10.2569 0.409735 9.95097 0.217988 9.57465C0.0894587 9.32239 0.0419148 9.06025 0.0203808 8.79669C-2.16787e-05 8.54697 -1.13475e-05 8.24379 5.73407e-07 7.89236L0 2.77431C-1.1268e-05 2.42287 -2.15992e-05 2.1197 0.020381 1.86998C0.0419149 1.60642 0.0894589 1.34427 0.217988 1.09202C0.409735 0.715696 0.715696 0.409735 1.09202 0.217988C1.34427 0.0894587 1.60642 0.0419147 1.86998 0.0203808C2.1197 -2.16787e-05 2.42287 -1.13475e-05 2.7743 5.73408e-07ZM1.33333 4.66667V7.86667C1.33333 8.25104 1.33385 8.49922 1.34929 8.68811C1.36408 8.86922 1.3892 8.93636 1.406 8.96933C1.46991 9.09477 1.5719 9.19676 1.69734 9.26067C1.7303 9.27747 1.79745 9.30258 1.97856 9.31738C2.16745 9.33281 2.41563 9.33333 2.8 9.33333H11.8667C12.251 9.33333 12.4992 9.33282 12.6881 9.31738C12.8692 9.30259 12.9364 9.27747 12.9693 9.26067C13.0948 9.19676 13.1968 9.09477 13.2607 8.96933C13.2775 8.93637 13.3026 8.86922 13.3174 8.68811C13.3328 8.49922 13.3333 8.25104 13.3333 7.86667V4.66667H1.33333ZM13.3333 3.33333H1.33333V2.8C1.33333 2.41563 1.33385 2.16745 1.34929 1.97856C1.36408 1.79745 1.3892 1.7303 1.406 1.69734C1.46991 1.5719 1.5719 1.46991 1.69734 1.406C1.7303 1.3892 1.79745 1.36408 1.97856 1.34929C2.16745 1.33385 2.41563 1.33333 2.8 1.33333H11.8667C12.251 1.33333 12.4992 1.33385 12.6881 1.34929C12.8692 1.36408 12.9364 1.3892 12.9693 1.406C13.0948 1.46991 13.1968 1.5719 13.2607 1.69734C13.2775 1.7303 13.3026 1.79745 13.3174 1.97856C13.3328 2.16745 13.3333 2.41563 13.3333 2.8V3.33333Z"
      fill="#375A89"
    />
  </svg>
);

const EqualizeIcon = () => (
  <svg width="15" height="12" viewBox="0 0 15 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.77431 5.73406e-07H11.8924C12.2438 -1.13475e-05 12.547 -2.16787e-05 12.7967 0.020381C13.0603 0.0419152 13.3224 0.0894596 13.5747 0.21799C13.951 0.409736 14.2569 0.715697 14.4487 1.09202C14.5772 1.34427 14.6248 1.60642 14.6463 1.86998C14.6667 2.11969 14.6667 2.42286 14.6667 2.77429V5.33333C14.6667 5.70152 14.3682 6 14 6C13.6318 6 13.3333 5.70152 13.3333 5.33333V4.66667H1.33333V7.86667C1.33333 8.25104 1.33385 8.49922 1.34929 8.68811C1.36408 8.86922 1.3892 8.93636 1.406 8.96933C1.46991 9.09477 1.5719 9.19675 1.69734 9.26067C1.7303 9.27747 1.79745 9.30258 1.97856 9.31738C2.16745 9.33281 2.41563 9.33333 2.8 9.33333H7.33333C7.70152 9.33333 8 9.63181 8 10C8 10.3682 7.70152 10.6667 7.33333 10.6667H2.77432C2.42288 10.6667 2.1197 10.6667 1.86998 10.6463C1.60642 10.6248 1.34427 10.5772 1.09202 10.4487C0.715696 10.2569 0.409735 9.95097 0.217988 9.57465C0.0894588 9.32239 0.0419148 9.06025 0.0203809 8.79669C-2.16787e-05 8.54697 -1.13475e-05 8.24379 5.73406e-07 7.89236V2.77431C-1.13475e-05 2.42287 -2.16787e-05 2.1197 0.0203809 1.86998C0.0419149 1.60642 0.089459 1.34427 0.217988 1.09202C0.409735 0.715696 0.715696 0.409735 1.09202 0.217988C1.34427 0.0894588 1.60642 0.0419149 1.86998 0.0203809C2.1197 -2.16787e-05 2.42287 -1.13475e-05 2.77431 5.73406e-07ZM1.33333 3.33333H13.3333V2.8C13.3333 2.41563 13.3328 2.16745 13.3174 1.97856C13.3026 1.79745 13.2775 1.7303 13.2607 1.69734C13.1968 1.5719 13.0948 1.46991 12.9693 1.406C12.9364 1.3892 12.8692 1.36408 12.6881 1.34929C12.4992 1.33385 12.251 1.33333 11.8667 1.33333H2.8C2.41563 1.33333 2.16745 1.33385 1.97856 1.34929C1.79745 1.36408 1.7303 1.3892 1.69734 1.406C1.5719 1.46991 1.46991 1.5719 1.406 1.69734C1.3892 1.7303 1.36408 1.79745 1.34929 1.97856C1.33385 2.16745 1.33333 2.41563 1.33333 2.8V3.33333Z"
      fill="#375A89"
    />
    <path
      d="M9.86193 7.5286C10.1223 7.26825 10.5444 7.26825 10.8047 7.5286L12 8.72386L13.1953 7.5286C13.4556 7.26825 13.8777 7.26825 14.1381 7.5286C14.3984 7.78895 14.3984 8.21106 14.1381 8.47141L12.9428 9.66667L14.1381 10.8619C14.3984 11.1223 14.3984 11.5444 14.1381 11.8047C13.8777 12.0651 13.4556 12.0651 13.1953 11.8047L12 10.6095L10.8047 11.8047C10.5444 12.0651 10.1223 12.0651 9.86193 11.8047C9.60158 11.5444 9.60158 11.1223 9.86193 10.8619L11.0572 9.66667L9.86193 8.47141C9.60158 8.21106 9.60158 7.78895 9.86193 7.5286Z"
      fill="#375A89"
    />
  </svg>
);

export default function AddTransferModal({
  open,
  onClose,
  onSave,
  lps = [],
  lp, // selected LP from table (optional)
}) {
  const [mode, setMode] = useState("peer"); // "peer" | "equalize";

  const [form, setForm] = useState({
    amount: "",
    date: "",
    fromLpName: "",
    toLpName: "",
    fromShareType: "",
    toShareType: "",
  });

  // Prefill "From" with selected LP when modal opens
  useEffect(() => {
    if (open && lp?.name) {
      setForm((prev) => ({ ...prev, fromLpName: lp.name }));
    }
  }, [lp, open]);

  if (!open) return null;

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleClose = () => {
    setForm({
      amount: "",
      date: "",
      fromLpName: lp?.name || "",
      toLpName: "",
      fromShareType: "",
      toShareType: "",
    });
    setMode("peer");
    onClose?.();
  };

  const handleSave = () => {
    if (!form.amount || !form.date || !form.fromLpName || !form.toLpName) {
      // simple guard; you can add proper validation later
      return;
    }

    const payload = {
      ...form,
      amount: Number(form.amount),
      mode,
    };

    onSave?.(payload); // 🚀 send to parent
    handleClose();     // close modal
  };

  return (
    <div className="transfer-modal-backdrop" onClick={handleClose}>
      <div
        className="transfer-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="transfer-modal-header">
          <h2 className="transfer-modal-title">Add a transfer</h2>
          <button
            className="transfer-close-btn"
            type="button"
            onClick={handleClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="transfer-modal-body">
          {/* Commitment + Date */}
          <div className="transfer-grid-2">
            <div className="transfer-field transfer-field-with-suffix">
              <label className="transfer-label">Commitment*</label>
              <div className="transfer-input-wrapper">
                <input
  className="transfer-input"
  type="text"
  placeholder="e.g. 200 000"
  value={form.amount}
  onChange={updateField("amount")}
/>

                <span className="transfer-suffix">
  <EuroCurrencyIcon />
</span>

              </div>
            </div>
<div className="transfer-field">
  <label className="transfer-label">Date*</label>

  <DateInputWithPicker
    initialDate={form.date ? new Date(form.date.split("/").reverse().join("-")) : new Date()}
    onDateChange={(date) => {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();

      setForm((prev) => ({
        ...prev,
        date: `${day}/${month}/${year}`,
      }));
    }}
    isSingle
    dateFormat="DD/MM/YYYY"
  />
</div>

          </div>

          {/* From / To cards */}
          <div className="transfer-grid-2 transfer-card-row">
            {/* FROM card */}
            <div className="transfer-card">
              <div className="transfer-field">
                <label className="transfer-label">From*</label>
                <div className="transfer-select-wrapper">
                  <select
                    className="transfer-select"
                    value={form.fromLpName}
                    onChange={updateField("fromLpName")}
                  >
                    <option value="" disabled>
                      Select LP...
                    </option>
                    {lps.map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <span className="transfer-select-chevron">
  <ChevronDownIcon />
</span>

                </div>
              </div>

              <div className="transfer-field">
                <label className="transfer-label">Type of share*</label>
                <div className="transfer-select-wrapper">
                  <select
                    className="transfer-select"
                    value={form.fromShareType}
                    onChange={updateField("fromShareType")}
                  >
                    <option value="" disabled>
                      e.g. A
                    </option>
                    <option value="Class A1">Class A1</option>
                    <option value="Class A2">Class A2</option>
                    <option value="Class B">Class B</option>
                  </select>
                  <span className="transfer-select-chevron">
  <ChevronDownIcon />
</span>

                </div>
              </div>
            </div>

            {/* TO card */}
            <div className="transfer-card">
              <div className="transfer-field">
                <label className="transfer-label">To*</label>
                <div className="transfer-select-wrapper">
                  <select
                    className="transfer-select"
                    value={form.toLpName}
                    onChange={updateField("toLpName")}
                  >
                    <option value="" disabled>
                      Select LP...
                    </option>
                    {lps.map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <span className="transfer-select-chevron">
  <ChevronDownIcon />
</span>

                </div>
              </div>

              <div className="transfer-field">
                <label className="transfer-label">Type of share*</label>
                <div className="transfer-select-wrapper">
                  <select
                    className="transfer-select"
                    value={form.toShareType}
                    onChange={updateField("toShareType")}
                  >
                    <option value="" disabled>
                      e.g. A
                    </option>
                    <option value="Class A1">Class A1</option>
                    <option value="Class A2">Class A2</option>
                    <option value="Class B">Class B</option>
                  </select>
                  <span className="transfer-select-chevron">
  <ChevronDownIcon />
</span>

                </div>
              </div>
            </div>
          </div>

          {/* Mode buttons */}
          <div className="transfer-mode-row">
            <button
              type="button"
              className={
                "transfer-mode-btn " +
                (mode === "peer" ? "transfer-mode-btn-active" : "")
              }
              onClick={() => setMode("peer")}
            >
              <span className="transfer-mode-icon">
                <PeerIcon />
              </span>
              Peer to peer payment
            </button>

            <button
              type="button"
              className={
                "transfer-mode-btn " +
                (mode === "equalize" ? "transfer-mode-btn-active" : "")
              }
              onClick={() => setMode("equalize")}
            >
              <span className="transfer-mode-icon">
                <EqualizeIcon />
              </span>
              Should be equalize for next cap call
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <div className="transfer-modal-footer">
          <button
            type="button"
            className="btn-secondary-wide"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary-wide"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
