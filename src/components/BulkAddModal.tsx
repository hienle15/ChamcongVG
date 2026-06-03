import React, { useState, type CSSProperties, type FormEvent } from 'react'
import {
  attendanceApi,
  type EmployeeLookupItem,
  type AttendanceCreateRequest,
} from '@/services/api'
import VGSelectSearch from '@/assets/components/ui/VGSelectSearch'

const C = {
  primary: '#1e40af',
  primaryHover: '#1d4ed8',
  primaryLight: '#e8eeff',
  success: '#16a34a',
  successLight: '#dcfce7',
  danger: '#dc2626',
  dangerLight: '#fee2e2',
  warning: '#d97706',
  surface: '#ffffff',
  bg: '#f1f5f9',
  border: '#e2e8f0',
  textMain: '#0f172a',
  textSub: '#475569',
  textMuted: '#94a3b8',
}

interface BulkAddModalProps {
  employees: EmployeeLookupItem[]
  onClose: () => void
  onSuccess: () => void
}

interface RowData {
  id: string
  employeeCode: string
  attendanceCode?: number
  workDate: string
}

const createEmptyRow = (): RowData => ({
  id: Math.random().toString(36).substring(7),
  employeeCode: '',
  workDate: new Date().toISOString().slice(0, 10), // current date YYYY-MM-DD
})

export default function BulkAddModal({ employees, onClose, onSuccess }: BulkAddModalProps) {
  const [rows, setRows] = useState<RowData[]>([createEmptyRow()])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddRow = () => {
    setRows([...rows, createEmptyRow()])
  }

  const handleRemoveRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((r) => r.id !== id))
    }
  }

  const handleChange = (id: string, field: keyof RowData, value: any) => {
    setRows(rows.map((r) => {
      if (r.id === id) {
        const updated = { ...r, [field]: value }
        if (field === 'employeeCode') {
          const emp = employees.find(e => e.employeeCode === value)
          updated.attendanceCode = emp?.attendanceCode
        }
        return updated
      }
      return r
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    const invalidRow = rows.find(r => !r.employeeCode || !r.workDate)
    if (invalidRow) {
      setError('Vui lòng điền đầy đủ nhân viên và ngày cho tất cả các dòng.')
      return
    }
    const missingCodeRow = rows.find(r => !r.attendanceCode)
    if (missingCodeRow) {
      setError('Một số nhân viên được chọn chưa có Mã chấm công (attendanceCode).')
      return
    }

    setIsSaving(true)
    try {
      await Promise.all(
        rows.map(r => attendanceApi.autoByShift({
          attendanceCode: r.attendanceCode as number,
          workDate: r.workDate
        }))
      )
      onSuccess()
    } catch (err) {
      setError('Lỗi lưu dữ liệu: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.header}>
          <h3 style={{ margin: 0, fontSize: 18, color: C.textMain }}>Thêm chấm công hàng loạt</h3>
          <button onClick={onClose} style={s.iconBtn}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          {error && <div style={s.errorBox}>{error}</div>}

          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Nhân viên</th>
                  <th style={{ ...s.th, width: 220 }}>Ngày</th>

                  <th style={{ ...s.th, width: 60, textAlign: 'center' }}>Xoá</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id} style={s.tr}>
                    <td style={s.td}>
                      <VGSelectSearch
                        value={row.employeeCode}
                        onChange={(v) => handleChange(row.id, 'employeeCode', v ? String(v.value) : '')}
                        placeholder="Chọn nhân viên..."
                        loadOptions={async (kw) => {
                          const lower = (kw || '').toLowerCase()
                          return employees
                            .filter(e => (e.fullName?.toLowerCase() || '').includes(lower) || (e.employeeCode?.toLowerCase() || '').includes(lower))
                            .map(e => ({ label: `${e.fullName} (${e.employeeCode})`, value: e.employeeCode }))
                        }}
                        getOptionByValue={(val) => {
                          const emp = employees.find(e => e.employeeCode === val)
                          return emp ? { label: `${emp.fullName} (${emp.employeeCode})`, value: emp.employeeCode } : null
                        }}
                      />
                    </td>
                    <td style={s.td}>
                      <input
                        type="date"
                        value={row.workDate}
                        onChange={(e) => handleChange(row.id, 'workDate', e.target.value)}
                        required
                        style={s.input}
                      />
                    </td>

                    <td style={{ ...s.td, textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.id)}
                        disabled={rows.length === 1}
                        style={{
                          ...s.actionBtn(rows.length === 1 ? C.textMuted : C.danger, rows.length === 1 ? '#f1f5f9' : C.dangerLight),
                          opacity: rows.length === 1 ? 0.5 : 1,
                          cursor: rows.length === 1 ? 'not-allowed' : 'pointer'
                        }}
                        title="Xoá dòng"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 12 }}>
            <button type="button" onClick={handleAddRow} style={s.outlineBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
              Thêm dòng
            </button>
          </div>

          <div style={s.footer}>
            <button type="button" onClick={onClose} style={s.outlineBtn}>Hủy</button>
            <button type="submit" disabled={isSaving} style={s.primaryBtn}>
              {isSaving ? 'Đang lưu...' : `Lưu ${rows.length} bản ghi`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.3)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  } as CSSProperties,

  modal: {
    background: C.surface,
    borderRadius: 16,
    width: '90%',
    maxWidth: 900,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  } as CSSProperties,

  header: {
    padding: '18px 24px',
    borderBottom: `1px solid ${C.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  } as CSSProperties,

  form: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
    padding: 24,
  } as CSSProperties,

  tableWrap: {
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    overflow: 'auto',
    flex: 1,
  } as CSSProperties,

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
    minWidth: 700,
  } as CSSProperties,

  th: {
    padding: '10px 14px',
    textAlign: 'left',
    background: '#f8fafc',
    color: C.textSub,
    fontWeight: 600,
    borderBottom: `1px solid ${C.border}`,
  } as CSSProperties,

  tr: {
    borderBottom: `1px solid #f1f5f9`,
  } as CSSProperties,

  td: {
    padding: '10px 14px',
    verticalAlign: 'top',
  } as CSSProperties,

  input: {
    width: '100%',
    padding: '8px 12px',
    border: `1.5px solid ${C.border}`,
    borderRadius: 8,
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    height: 38,
  } as CSSProperties,

  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: C.textSub,
    display: 'flex',
    padding: 4,
    borderRadius: 6,
  } as CSSProperties,

  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 20px',
    background: C.primary,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  } as CSSProperties,

  outlineBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 20px',
    background: 'transparent',
    color: C.textSub,
    border: `1.5px solid ${C.border}`,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  } as CSSProperties,

  actionBtn: (color: string, bg: string): CSSProperties => ({
    background: bg,
    color: color,
    border: 'none',
    padding: 6,
    borderRadius: 6,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    width: 36,
  }),

  errorBox: {
    padding: '12px 16px',
    background: C.dangerLight,
    color: C.danger,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 13,
    fontWeight: 500,
  } as CSSProperties,

  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
    paddingTop: 16,
    borderTop: `1px solid ${C.border}`,
  } as CSSProperties,
}
