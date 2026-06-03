import type { CSSProperties } from 'react'

/* ─────────────────── Design tokens ─────────────────── */
export const C = {
  primary: 'var(--brand)',
  primaryHover: '#13546c',
  primaryLight: '#e8f3f6',
  accent: '#0052cc',
  accentLight: '#e6f0ff',
  success: '#16a34a',
  successLight: '#dcfce7',
  danger: '#dc2626',
  dangerLight: '#fee2e2',
  warning: '#d97706',
  warningLight: '#fef3c7',
  surface: '#ffffff',
  bg: '#f1f5f9',
  sidebar: 'var(--brand)',
  sidebarText: 'rgba(255,255,255,0.80)',
  sidebarActive: 'rgba(255,255,255,0.14)',
  border: '#e2e8f0',
  textMain: '#0f172a',
  textSub: '#475569',
  textMuted: '#94a3b8',
}

/* ─────────────────── Shared styles ─────────────────── */
export const s = {
  shell: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    fontFamily: "'Inter', sans-serif",
    background: C.bg,
  } as CSSProperties,

  sidebar: {
    background: C.sidebar,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    transition: 'width 0.25s ease',
    overflow: 'hidden',
    borderRight: 'none',
    boxShadow: '4px 0 16px rgba(0,0,0,0.15)',
    zIndex: 10,
  } as CSSProperties,

  sidebarLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '20px 14px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
  } as CSSProperties,

  sidebarLogoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    border: '1px solid rgba(255,255,255,0.2)',
  } as CSSProperties,

  sidebarLogoText: {
    color: '#fff',
    fontWeight: 700,
    fontSize: 15,
    whiteSpace: 'nowrap' as const,
    letterSpacing: '-0.01em',
  } as CSSProperties,

  sidebarNav: {
    flex: 1,
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    overflowY: 'auto',
    overflowX: 'hidden',
  } as CSSProperties,

  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'background 0.15s',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
  } as CSSProperties,

  navIcon: {
    flexShrink: 0,
    fontSize: 22,
  } as CSSProperties,

  sidebarUser: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 12px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
  } as CSSProperties,

  sidebarAvatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    border: '2px solid rgba(255,255,255,0.3)',
  } as CSSProperties,

  logoutBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  } as CSSProperties,

  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  } as CSSProperties,

  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    background: '#ffffff',
    borderBottom: `1px solid #e2e8f0`,
    flexShrink: 0,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  } as CSSProperties,

  content: {
    flex: 1,
    overflow: 'auto',
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  } as CSSProperties,

  filterCard: {
    background: '#ffffff',
    borderRadius: 14,
    padding: '18px 20px',
    border: `1px solid #e2e8f0`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    flexShrink: 0,
  } as CSSProperties,

  filterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 12,
  } as CSSProperties,

  filterLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: '#475569',
    marginBottom: 5,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  } as CSSProperties,

  filterInputWrap: {
    position: 'relative',
  } as CSSProperties,

  filterInput: {
    width: '100%',
    height: 38,
    padding: '0 10px',
    border: `1px solid #e2e8f0`,
    borderRadius: 8,
    fontSize: 13,
    color: '#0f172a',
    background: '#f8fafc',
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
    transition: 'border-color 0.15s',
    boxSizing: 'border-box' as const,
  } as CSSProperties,

  filterSelect: {
    width: '100%',
    padding: '8px 10px',
    border: `1.5px solid #e2e8f0`,
    borderRadius: 8,
    fontSize: 13,
    color: '#0f172a',
    background: '#f8fafc',
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
    cursor: 'pointer',
    boxSizing: 'border-box' as const,
  } as CSSProperties,

  tableCard: {
    background: '#ffffff',
    borderRadius: 14,
    border: `1px solid #e2e8f0`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minHeight: 0,
  } as CSSProperties,

  tableHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    borderBottom: `1px solid #e2e8f0`,
    flexShrink: 0,
  } as CSSProperties,

  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 13,
    tableLayout: 'auto' as const,
  } as CSSProperties,

  th: {
    padding: '10px 14px',
    textAlign: 'left' as const,
    fontSize: 11,
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    background: '#f8fafc',
    borderBottom: `1px solid #e2e8f0`,
    whiteSpace: 'nowrap' as const,
  } as CSSProperties,

  tr: {
    transition: 'background 0.1s',
  } as CSSProperties,

  td: {
    padding: '10px 14px',
    color: '#475569',
    borderBottom: `1px solid #f1f5f9`,
    verticalAlign: 'middle' as const,
    whiteSpace: 'nowrap' as const,
  } as CSSProperties,

  emptyCell: {
    padding: '60px 20px',
    textAlign: 'center' as const,
    color: '#94a3b8',
  } as CSSProperties,

  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.03em',
  } as CSSProperties,

  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    borderTop: `1px solid #e2e8f0`,
    flexShrink: 0,
  } as CSSProperties,

  pageBtn: (disabled: boolean): CSSProperties => ({
    width: 32,
    height: 32,
    border: `1px solid #e2e8f0`,
    borderRadius: 7,
    background: disabled ? '#f8fafc' : '#ffffff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.4 : 1,
    color: '#475569',
  }),

  pageNumBtn: (active: boolean): CSSProperties => ({
    width: 32,
    height: 32,
    border: active ? 'none' : `1px solid #e2e8f0`,
    borderRadius: 7,
    background: active ? 'var(--brand)' : '#ffffff',
    color: active ? '#fff' : '#475569',
    fontWeight: active ? 700 : 400,
    fontSize: 13,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),

  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    padding: '0 16px',
    background: 'var(--brand)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    transition: 'background 0.15s',
  } as CSSProperties,

  outlineBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    padding: '0 16px',
    background: 'transparent',
    color: '#475569',
    border: `1px solid #e2e8f0`,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
  } as CSSProperties,

  dangerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
  } as CSSProperties,

  iconBtn: {
    width: 36,
    height: 36,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as CSSProperties,

  dateBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    background: '#f1f5f9',
    borderRadius: 8,
    border: `1px solid #e2e8f0`,
  } as CSSProperties,

  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 20px',
    background: '#fee2e2',
    color: '#dc2626',
    fontSize: 13,
    fontWeight: 500,
    borderBottom: `1px solid #fca5a5`,
  } as CSSProperties,

  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    animation: 'fadeIn 0.2s ease',
  } as CSSProperties,

  modal: {
    background: '#ffffff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 560,
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    animation: 'slideIn 0.2s ease',
  } as CSSProperties,

  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 24px',
    borderBottom: `1px solid #e2e8f0`,
    flexShrink: 0,
  } as CSSProperties,

  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  } as CSSProperties,

  formField: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  } as CSSProperties,

  formLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#475569',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  } as CSSProperties,

  formInput: {
    padding: '9px 12px',
    border: `1.5px solid #e2e8f0`,
    borderRadius: 8,
    fontSize: 14,
    color: '#0f172a',
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
    background: '#f8fafc',
    width: '100%',
    boxSizing: 'border-box' as const,
  } as CSSProperties,

  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 14,
    flexShrink: 0,
  } as CSSProperties,

  statCard: {
    background: '#ffffff',
    borderRadius: 14,
    padding: '18px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    border: `1px solid #e2e8f0`,
  } as CSSProperties,

  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  } as CSSProperties,
}
