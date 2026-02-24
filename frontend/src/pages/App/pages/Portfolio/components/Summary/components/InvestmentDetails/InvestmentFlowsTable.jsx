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

const TrashIcon = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M5 0.833333C5 0.373096 5.3731 0 5.83333 0H10.8333C11.2936 0 11.6667 0.373096 11.6667 0.833333C11.6667 1.29357 11.2936 1.66667 10.8333 1.66667H5.83333C5.3731 1.66667 5 1.29357 5 0.833333ZM2.49354 2.5H0.833333C0.373096 2.5 0 2.8731 0 3.33333C0 3.79357 0.373096 4.16667 0.833333 4.16667H1.72037L2.25512 12.1879C2.29708 12.8174 2.3318 13.3384 2.39406 13.7624C2.45888 14.2039 2.56171 14.6073 2.77591 14.9833C3.10936 15.5687 3.61232 16.0392 4.21852 16.333C4.60794 16.5217 5.01733 16.5975 5.46216 16.6328C5.8894 16.6667 6.41152 16.6667 7.04245 16.6667H9.62422C10.2551 16.6667 10.7773 16.6667 11.2045 16.6328C11.6493 16.5975 12.0587 16.5217 12.4481 16.333C13.0543 16.0392 13.5573 15.5687 13.8908 14.9833C14.105 14.6073 14.2078 14.2039 14.2726 13.7624C14.3349 13.3383 14.3696 12.8173 14.4116 12.1878L14.9463 4.16667H15.8333C16.2936 4.16667 16.6667 3.79357 16.6667 3.33333C16.6667 2.8731 16.2936 2.5 15.8333 2.5H14.1731C14.1683 2.49996 14.1634 2.49996 14.1585 2.5H2.50812C2.50327 2.49996 2.49841 2.49996 2.49354 2.5ZM13.2759 4.16667H3.39074L3.91589 12.044C3.96062 12.7148 3.99154 13.1695 4.04305 13.5203C4.09308 13.861 4.1542 14.0357 4.22406 14.1583C4.39079 14.451 4.64227 14.6863 4.94537 14.8332C5.07237 14.8947 5.25071 14.9441 5.59405 14.9713C5.94752 14.9994 6.40321 15 7.07555 15H9.59112C10.2635 15 10.7191 14.9994 11.0726 14.9713C11.416 14.9441 11.5943 14.8947 11.7213 14.8332C12.0244 14.6863 12.2759 14.451 12.4426 14.1583C12.5125 14.0357 12.5736 13.861 12.6236 13.5203C12.6751 13.1695 12.7061 12.7148 12.7508 12.044L13.2759 4.16667ZM6.66667 6.25C7.1269 6.25 7.5 6.6231 7.5 7.08333V11.25C7.5 11.7102 7.1269 12.0833 6.66667 12.0833C6.20643 12.0833 5.83333 11.7102 5.83333 11.25V7.08333C5.83333 6.6231 6.20643 6.25 6.66667 6.25ZM10 6.25C10.4602 6.25 10.8333 6.6231 10.8333 7.08333V11.25C10.8333 11.7102 10.4602 12.0833 10 12.0833C9.53976 12.0833 9.16667 11.7102 9.16667 11.25V7.08333C9.16667 6.6231 9.53976 6.25 10 6.25Z" fill="#375A89"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 3.3335V12.6668M3.33337 8.00016H12.6667" stroke="#375A89" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);// دالة مساعدة لتنسيق التاريخ للعرض داخل الـ Input
const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    // لو التاريخ جاي سترينج YYYY-MM-DD
    return dateString; 
};

export default function InvestmentFlowsTable({ flows, onUpdate, onDelete, onAdd, flowTypes }) {
  const types = flowTypes && flowTypes.length > 0 ? flowTypes : FLOW_TYPES;
  const [activePickerId, setActivePickerId] = useState(null);
  const hasPartialDivestment = flows.some(
    (f) => String(f.type).toLowerCase() === "partial divestment"
  );

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
    <div className="invTableContainer">
      <table className="invTable">
        <thead>
          <tr>
            <th>Flow <span className="invSortIcon"><SortIcon/></span></th>
            <th>Date <span className="invSortIcon"><SortIcon/></span></th>
            <th className="invNum">Amount <span className="invSortIcon"><SortIcon/></span></th>
            <th className="invNum">FX Rate <span className="invSortIcon"><SortIcon/></span></th>
            <th className="invNum">Amount LC* <span className="invSortIcon"><SortIcon/></span></th>
            <th>Type <span className="invSortIcon"><SortIcon/></span></th>
            {hasPartialDivestment && <th className="invNum">Divestment %</th>}
            <th style={{ textAlign: 'right', paddingRight: '12px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {flows.map((f, index) => {
            const amountLCVal = parseFloat(String(f.amountLC).replace(/[^0-9.-]/g, "")) || 0;
            const fxVal = parseFloat(String(f.fxRate).replace(/[^0-9.-]/g, "")) || 0;
            const amountEuro = fxVal ? amountLCVal / fxVal : 0;
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
         
                {/* Amount (calculated) */}
                <td>
                  <div className="invInputWrapper">
                    <input
                      type="text"
                      readOnly
                      className="invTableInput invNum readOnlyInput"
                      value={amountEuro ? `${formatNum(amountEuro)}` : ""}
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

                {/* Amount LC (input) */}
                <td>
                    <div className="invInputWrapper">
                     <input
                      type="number"
                      className="invTableInput invNum"
                      value={f.amountLC}
                      onChange={(e) => onUpdate(f.id, "amountLC", e.target.value)}
                    />
                  </div>
                </td>

                {/* Type Select */}
                <td style={{ width: '140px' }}>
                  <select
                    className={`invBadgeSelect badge-${String(f.type).replace(/\\s+/g, "-")}`}
                    value={f.type}
                    onChange={(e) => onUpdate(f.id, "type", e.target.value)}
                  >
                    {types.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </td>

                {/* Divestment Percentage (Partial divestment only) */}
                {hasPartialDivestment && (
                  <td style={{ width: '140px' }}>
                    {String(f.type).toLowerCase() === "partial divestment" ? (
                      <div className="invInputWrapper">
                        <input
                          type="number"
                          className="invTableInput invNum"
                          value={f.divestmentPercentage ?? ""}
                          onChange={(e) => onUpdate(f.id, "divestmentPercentage", e.target.value)}
                          min="0"
                          max="9.9999"
                          step="0.0001"
                          placeholder="0 - 9.9999"
                        />
                      </div>
                    ) : (
                      <div className="invEmptyCell" />
                    )}
                  </td>
                )}{/* Actions */}
                <td>
                  <div className="invActionsCell">
                    <button className="invRowActionBtn invIconGrey" onClick={() => onDelete(f.id)}>
                        <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <button className="invAddFlowBtn" onClick={onAdd}>
        <span className="invAddFlowIcon"><PlusIcon /></span>
        <span className="invAddFlowText">New Flow</span>
      </button>
    </div>
  );
}




