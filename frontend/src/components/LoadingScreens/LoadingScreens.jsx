// ─── Spinner ─────────────────────────────────────────────────────────────────

export function PageSpinner({ label = "Loading..." }) {
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
        <div style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          border: '2.5px solid #e5e7eb',
          borderTopColor: '#6b7280',
          animation: 'allfunds-spin 0.75s linear infinite',
        }} />
        <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500, letterSpacing: '0.02em' }}>
          {label}
        </span>
      </div>
    </>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

export function PageError({ message }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      minHeight: 320,
    }}>
      <div style={{
        width: 38,
        height: 38,
        borderRadius: '50%',
        background: '#fef2f2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        color: '#ef4444',
      }}>
        !
      </div>
      <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
        Failed to load funds
      </span>
      {message && (
        <span style={{ fontSize: 12, color: '#9ca3af', maxWidth: 320, textAlign: 'center' }}>
          {message}
        </span>
      )}
    </div>
  );
}
