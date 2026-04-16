import { WarningIcon, ErrorIcon } from "../Icons/MiscIcons";

const centeredContainerStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 14, // Inherited from PageSpinner
  minHeight: 320,
};

const labelStyle = {
  fontSize: 13,
  color: '#9ca3af', // Inherited from PageSpinner textColor default
  fontWeight: 500,
  letterSpacing: '0.02em',
};

export function PageSpinner({ label = "Loading...", textColor = '#9ca3af' }) {
  return (
    <>
      <style>{`
        @keyframes allfunds-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        minHeight: 320,
      }}>
        <svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          style={{ animation: 'allfunds-spin 1.4s linear infinite' }}
        >
          <circle
            cx="18" cy="18" r="14"
            fill="none"
            stroke="rgba(247,169,59,0.18)"
            strokeWidth="2.5"
          />
          <circle
            cx="18" cy="18" r="14"
            fill="none"
            stroke="#F7A93B"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="88"
            strokeDashoffset="66"
          />
        </svg>
        <span style={{
          fontSize: 13,
          color: textColor,
          fontWeight: 500,
          letterSpacing: '0.02em',
        }}>
          {label}
        </span>
      </div>
    </>
  );
}

export function PageError({ message }) {
  return (
    <div style={centeredContainerStyle}>
      <div style={{
        width: 38,
        height: 38,
        borderRadius: '50%',
        background: '#fef2f2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ef4444',
      }}>
        <ErrorIcon style={{ width: 20, height: 20 }} />
      </div>
      <span style={labelStyle}>
        Failed to load data
      </span>
      {message && (
        <span style={{ fontSize: 12, color: '#9ca3af', maxWidth: 320, textAlign: 'center', marginTop: -4 }}>
          {message}
        </span>
      )}
    </div>
  );
}

export function PageNoData({ message = "No data available" }) {
  return (
    <div style={centeredContainerStyle}>
      <div style={{
        width: 38,
        height: 38,
        borderRadius: '50%',
        background: '#fffbeb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f59e0b',
      }}>
        <WarningIcon style={{ width: 20, height: 20 }} />
      </div>
      <span style={labelStyle}>
        No data found
      </span>
      {message && (
        <span style={{ fontSize: 12, color: '#9ca3af', maxWidth: 320, textAlign: 'center', marginTop: -4 }}>
          {message}
        </span>
      )}
    </div>
  );
}