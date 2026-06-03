const LoadingSpinner = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.9s linear infinite' }}>
    <circle cx="12" cy="12" r="10" stroke="#e2e8f0" strokeWidth="3" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--brand)" strokeWidth="3" strokeLinecap="round" />
  </svg>
)

export default LoadingSpinner
