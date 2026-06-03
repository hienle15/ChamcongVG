import React from 'react'
import { C } from '@/styles/attendance.styles'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface MonthlyExportModalProps {
  isMonthlyExportOpen: boolean
  setIsMonthlyExportOpen: (val: boolean) => void
  exportMonth: string
  setExportMonth: (val: string) => void
  isExportingMonthly: boolean
  handleExportExcelMonthly: () => void
}

const MonthlyExportModal: React.FC<MonthlyExportModalProps> = ({
  isMonthlyExportOpen,
  setIsMonthlyExportOpen,
  exportMonth,
  setExportMonth,
  isExportingMonthly,
  handleExportExcelMonthly,
}) => {
  if (!isMonthlyExportOpen) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(15,23,42,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.18s ease'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.22)',
        padding: '32px 36px',
        minWidth: 360,
        maxWidth: 420,
        animation: 'slideIn 0.2s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg,#16a34a,#15803d)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 22 }}>calendar_month</span>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.textMain }}>Xuất Excel theo tháng</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Chọn tháng để xuất bảng chấm công theo mẫu</div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.textSub, marginBottom: 8 }}>
            Tháng / Năm
          </label>
          <input
            type="month"
            value={exportMonth}
            onChange={e => setExportMonth(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: `1.5px solid ${C.border}`,
              fontSize: 15,
              fontFamily: 'Inter, sans-serif',
              color: C.textMain,
              outline: 'none',
              boxSizing: 'border-box',
              background: '#f8fafc'
            }}
            onFocus={e => e.target.style.borderColor = '#16a34a'}
            onBlur={e => e.target.style.borderColor = C.border}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={() => setIsMonthlyExportOpen(false)}
            disabled={isExportingMonthly}
            style={{
              padding: '9px 20px',
              borderRadius: 8,
              border: `1.5px solid ${C.border}`,
              background: '#fff',
              color: C.textSub,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleExportExcelMonthly}
            disabled={isExportingMonthly || !exportMonth}
            style={{
              padding: '9px 22px',
              borderRadius: 8,
              border: 'none',
              background: isExportingMonthly ? '#86efac' : 'linear-gradient(135deg,#16a34a,#15803d)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: isExportingMonthly ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontFamily: 'Inter, sans-serif'
            }}
          >
            {isExportingMonthly ? (
              <><LoadingSpinner />Đang xuất...</>
            ) : (
              <><span className="material-symbols-outlined" style={{ fontSize: 17 }}>download</span>Xuất Excel</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MonthlyExportModal
