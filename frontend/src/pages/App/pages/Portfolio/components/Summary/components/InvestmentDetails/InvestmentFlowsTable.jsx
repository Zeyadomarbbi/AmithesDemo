import React, { useState, useRef, useEffect } from "react"; 
import "./InvestmentDetails.css";
// تأكد من استيراد الديت بيكر من مساره الصحيح
import DatePicker from "../../../../../../../../components/DateComponents/DatePicker"; // <--- مسار ملف الديت بيكر

const FLOW_TYPES = ["Investment", "Dividend", "Interest", "Other", "Divestment"];

const SortIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '4px' }}>
    <path fillRule="evenodd" clipRule="evenodd" d="M7.5286 2.19526C7.78894 1.93491 8.21106 1.93491 8.4714 2.19526L11.8047 5.5286C12.0651 5.78894 12.0651 6.21106 11.8047 6.4714C11.5444 6.73175 11.1223 6.73175 10.8619 6.4714L8 3.60948L5.13807 6.4714C4.87772 6.73175 4.45561 6.73175 4.19526 6.4714C3.93491 6.21106 3.93491 5.78894 4.19526 5.5286L7.5286 2.19526ZM4.19526 9.5286C4.45561 9.26825 4.87772 9.26825 5.13807 9.5286L8 12.3905L10.8619 9.5286C11.1223 9.26825 11.5444 9.26825 11.8047 9.5286C12.0651 9.78895 12.0651 10.2111 11.8047 10.4714L8.4714 13.8047C8.21106 14.0651 7.78894 14.0651 7.5286 13.8047L4.19526 10.4714C3.93491 10.2111 3.93491 9.78895 4.19526 9.5286Z" fill="#375A89"/>
  </svg>
);

const formatNum = (v) => {
  if (v === "" || v === undefined) return "";
  const n = Number(v);
  if (isNaN(n)) return v;
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).replace(/,/g, ' ');
};

const MenuIcon = () => (
  <div style={{fontWeight: 'bold', fontSize: '18px', paddingBottom:'6px'}}>⋮</div>
);

// دالة مساعدة لتنسيق التاريخ للعرض داخل الـ Input
const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    // لو التاريخ جاي سترينج YYYY-MM-DD
    return dateString; 
};

export default function InvestmentFlowsTable({ flows, onUpdate, onDelete, onAdd }) {
  const [activePickerId, setActivePickerId] = useState(null);

  // لغلق الـ Picker عند الضغط خارجه (اختياري، لكن مفيد)
  const wrapperRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setActivePickerId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);


  return (
    <div className="invTableContainer" style={{ minHeight: '400px' /* مساحة عشان الـ Popup يظهر */ }}>
      <table className="invTable">
        <thead>
          <tr>
            <th>Flow <span className="invSortIcon"><SortIcon/></span></th>
            <th>Date <span className="invSortIcon"><SortIcon/></span></th>
            <th className="invNum">Amount (€) <span className="invSortIcon"><SortIcon/></span></th>
            <th className="invNum">FX Rate <span className="invSortIcon"><SortIcon/></span></th>
            <th className="invNum">Amount LC <span className="invSortIcon"><SortIcon/></span></th>
            <th>Type <span className="invSortIcon"><SortIcon/></span></th>
            <th style={{ textAlign: 'right', paddingRight: '12px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {flows.map((f, index) => {
            const amountVal = parseFloat(String(f.amount).replace(/[^0-9.-]/g, "")) || 0;
            const fxVal = parseFloat(String(f.fxRate).replace(/[^0-9.-]/g, "")) || 0;
            const calculatedLC = amountVal * fxVal;
            const isPickerOpen = activePickerId === f.id;

            return (
              <tr key={f.id}>
                {/* Index */}
                <td style={{ color: '#64748b', fontWeight: '400' }}>#{index + 1}</td>

                {/* Date Picker Custom Integration */}
                <td style={{ overflow: 'visible' }}> {/* overflow visible مهم عشان الـ popup يظهر بره الخلية */}
                  <div className="invInputWrapper" style={{ position: 'relative' }} ref={isPickerOpen ? wrapperRef : null}>
                    
                    {/* 1. حقل الإدخال الذي يظهر التاريخ ويفتح الـ Picker عند الضغط */}
                    <input
                        type="text"
                        className="invTableInput"
                        placeholder="Select date"
                        value={formatDateForDisplay(f.date)}
                        onClick={() => setActivePickerId(f.id)}
                        readOnly // ممنوع الكتابة اليدوية، فقط اختيار
                    />

                    {/* 2. ظهور الـ DatePicker المخصص */}
                    {isPickerOpen && (
                        <DatePicker
                            isSingle={true}
                            initialStartDate={f.date ? new Date(f.date) : new Date()}
                            onClose={() => setActivePickerId(null)}
                            onApply={(data) => {
                                // data.start هو التاريخ المختار
                                if (data.start) {
                                    const dateObj = data.start;
                                    const y = dateObj.getFullYear();
                                    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                                    const d = String(dateObj.getDate()).padStart(2, '0');
                                    // تحديث الحالة بصيغة YYYY-MM-DD
                                    onUpdate(f.id, "date", `${y}-${m}-${d}`);
                                }
                                setActivePickerId(null);
                            }}
                            // ستايل عشان يظهر فوق الجدول كـ Popup
                            style={{
                                position: 'absolute',
                                top: '100%',
                                left: '0',
                                zIndex: 1000,
                                boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                                background: 'white',
                                borderRadius: '8px',
                                marginTop: '4px'
                            }}
                        />
                    )}
                  </div>
                </td>
         
                {/* Amount */}
                <td>
                  <div className="invInputWrapper">
                    <input
                      type="number"
                      className="invTableInput invNum"
                      value={f.amount}
                      onChange={(e) => onUpdate(f.id, "amount", e.target.value)}
                    />
                  </div>
                </td>

                {/* FX Rate */}
                <td style={{ width: '100px' }}>
                    <div className="invInputWrapper">
                     <input
                      type="number"
                      step="0.01"
                      className="invTableInput invNum"
                      value={f.fxRate}
                      onChange={(e) => onUpdate(f.id, "fxRate", e.target.value)}
                    />
                  </div>
                </td>

                {/* Calculated LC */}
                <td>
                    <div className="invInputWrapper">
                     <input
                      type="text"
                      readOnly
                      className="invTableInput invNum readOnlyInput"
                      value={calculatedLC ? `${formatNum(calculatedLC)} LC` : ""}
                    />
                  </div>
                </td>

                {/* Type Select */}
                <td style={{ width: '140px' }}>
                  <select
                    className={`invBadgeSelect badge-${f.type}`}
                    value={f.type}
                    onChange={(e) => onUpdate(f.id, "type", e.target.value)}
                  >
                    {FLOW_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </td>

                {/* Actions */}
                <td>
                  <div className="invActionsCell">
                    <button className="invRowActionBtn invIconGrey" onClick={() => onDelete(f.id)}>
                        <MenuIcon />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <button className="invAddFlowBtn" onClick={onAdd}>
        + New Flow
      </button>
    </div>
  );
}