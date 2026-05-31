type Props = {
  message: string;
  retry?: () => void;
};

export function ErrorBanner({ message, retry }: Props) {
  return (
    <div className="error-banner">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
        <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 5v5M9 13h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span style={{ flex: 1 }}>{message}</span>
      {retry && (
        <button
          onClick={retry}
          style={{
            flexShrink: 0, padding: "0.3rem 0.75rem", borderRadius: 999,
            border: "1px solid rgba(252,165,165,0.35)", background: "transparent",
            color: "#fca5a5", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
