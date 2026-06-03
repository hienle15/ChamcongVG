import React, { useState, useEffect, type CSSProperties, type FormEvent } from 'react'
import {
  attendanceApi,
  type AttendanceItem,
  type AttendanceCreateRequest,
} from '@/services/api'

const C = {
  primary: '#1e40af',
  primaryHover: '#1d4ed8',
  primaryLight: '#e8eeff',
  success: '#16a34a',
  successLight: '#dcfce7',
  danger: '#dc2626',
  dangerLight: '#fee2e2',
  warning: '#d97706',
  warningLight: '#fef3c7',
  surface: '#ffffff',
  bg: '#f1f5f9',
  border: '#e2e8f0',
  textMain: '#0f172a',
  textSub: '#475569',
  textMuted: '#94a3b8',
}

interface RawLogsModalProps {
  employeeCode: string
  employeeName: string
  attendanceCode: number
  workDate: string
  onClose: () => void
  onLogsChanged?: () => void
}

export default function RawLogsModal({
  employeeCode,
  employeeName,
  attendanceCode,
  workDate,
  onClose,
  onLogsChanged,
}: RawLogsModalProps) {
  const [logs, setLogs] = useState<AttendanceItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<AttendanceItem | null>(null)

  // Form state
  const [formTime, setFormTime] = useState('')
  const [formType, setFormType] = useState('0')
  const [formSource, setFormSource] = useState('Manual')
  const [isSaving, setIsSaving] = useState(false)

  const fetchLogs = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await attendanceApi.list({
        employeeCode,
        fromDate: workDate,
        toDate: workDate,
        pageSize: 100, // Load all for the day
      })
      setLogs(res.items || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi tải dữ liệu chi tiết')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [employeeCode, workDate])

  const openEditForm = (log: AttendanceItem) => {
    setEditingLog(log)
    setFormTime(log.attendanceTime.slice(11, 16)) // hh:mm
    setFormType(log.checkType || '0')
    setFormSource(log.checkSource || 'Manual')
    setIsFormOpen(true)
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const d = new Date(`${workDate.slice(0, 10)}T${formTime}`)
      if (isNaN(d.getTime())) throw new Error('Thời gian không hợp lệ')

      const pad = (num: number) => String(num).padStart(2, '0')
      const localTimeStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`

      const payload: AttendanceCreateRequest = {
        attendanceCode,
        attendanceTime: localTimeStr,
        checkType: formType,
        checkSource: formSource,
        deviceNo: 0,
        deviceName: 'Hệ thống',
      }

      if (editingLog) {
        await attendanceApi.update(editingLog.id, payload)
      } else {
        await attendanceApi.create(payload)
      }
      setIsFormOpen(false)
      fetchLogs()
      if (onLogsChanged) onLogsChanged()
    } catch (err) {
      alert('Lỗi lưu dữ liệu: ' + (err instanceof Error ? err.message : ''))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAll = async () => {
    setIsConfirmDeleteOpen(false)
    setIsLoading(true)
    try {
      await attendanceApi.bulkDelete({
        fromDate: workDate,
        toDate: workDate,
        attendanceCode,
      })
      fetchLogs()
      if (onLogsChanged) onLogsChanged()
      onClose()
    } catch (e) {
      alert('Lỗi khi xoá: ' + (e instanceof Error ? e.message : ''))
      setIsLoading(false)
    }
  }

  const fmtTime = (iso: string) => {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleTimeString('vi-VN')
    } catch {
      return iso
    }
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.header}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, color: C.textMain }}>Chi tiết chấm công</h3>
            <div style={{ fontSize: 13, color: C.textSub, marginTop: 4 }}>
              {employeeName} ({employeeCode}) - Ngày: {new Date(workDate).toLocaleDateString('vi-VN')}
            </div>
          </div>
          <button onClick={onClose} style={s.iconBtn}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div style={s.content}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button onClick={() => setIsConfirmDeleteOpen(true)} style={{ ...s.primaryBtn, background: C.danger }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
              Xoá giờ
            </button>
          </div>

          {error && <div style={s.errorBox}>{error}</div>}

          <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Thời gian</th>
                  <th style={{ ...s.th, width: 80, textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={2} style={s.emptyCell}>Đang tải...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={2} style={s.emptyCell}>Không có dữ liệu chi tiết</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} style={s.tr}>
                      <td style={{ ...s.td, fontWeight: 600 }}>{fmtTime(log.attendanceTime)}</td>
                      <td style={{ ...s.td, textAlign: 'center' }}>
                        <button onClick={() => openEditForm(log)} style={s.actionBtn('#0284c7', '#e0f2fe')} title="Cập nhật">
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {isConfirmDeleteOpen && (
        <div style={{ ...s.overlay, zIndex: 110 }} onClick={() => setIsConfirmDeleteOpen(false)}>
          <div style={{ ...s.modal, maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div style={s.header}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Xác nhận xoá</h3>
              <button onClick={() => setIsConfirmDeleteOpen(false)} style={s.iconBtn}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <p style={{ margin: '0 0 24px 0', color: C.textMain, fontSize: 14, lineHeight: '1.5' }}>
                Bạn có chắc chắn muốn xoá toàn bộ giờ chấm công của nhân viên trong ngày này? Thao tác này không thể hoàn tác.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setIsConfirmDeleteOpen(false)} style={s.outlineBtn}>Hủy</button>
                <button
                  type="button"
                  onClick={handleDeleteAll}
                  disabled={isLoading}
                  style={{ ...s.primaryBtn, background: C.danger }}
                >
                  {isLoading ? 'Đang xoá...' : 'Xác nhận xoá'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nested Form Modal */}
      {isFormOpen && (
        <div style={{ ...s.overlay, zIndex: 110 }} onClick={() => setIsFormOpen(false)}>
          <div style={{ ...s.modal, maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div style={s.header}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Cập nhật giờ</h3>
              <button onClick={() => setIsFormOpen(false)} style={s.iconBtn}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSave} style={{ padding: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={s.label}>Giờ</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    required
                    style={s.input}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <button type="button" onClick={() => setIsFormOpen(false)} style={s.outlineBtn}>Hủy</button>
                <button type="submit" disabled={isSaving} style={s.primaryBtn}>
                  {isSaving ? 'Đang lưu...' : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
    maxWidth: 600,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  } as CSSProperties,

  header: {
    padding: '16px 20px',
    borderBottom: `1px solid ${C.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as CSSProperties,

  content: {
    padding: 20,
    overflowY: 'auto',
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
    padding: '8px 16px',
    background: C.primary,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  } as CSSProperties,

  outlineBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    background: 'transparent',
    color: C.textSub,
    border: `1.5px solid ${C.border}`,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  } as CSSProperties,

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
  } as CSSProperties,

  th: {
    padding: '10px 14px',
    textAlign: 'left',
    background: '#f8fafc',
    color: C.textSub,
    fontWeight: 600,
    borderBottom: `1px solid ${C.border}`,
    whiteSpace: 'nowrap',
  } as CSSProperties,

  tr: {
    borderBottom: `1px solid #f1f5f9`,
  } as CSSProperties,

  td: {
    padding: '10px 14px',
    color: C.textMain,
  } as CSSProperties,

  emptyCell: {
    padding: 30,
    textAlign: 'center',
    color: C.textMuted,
  } as CSSProperties,

  badge: (isSuccess: boolean): CSSProperties => ({
    padding: '4px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    background: isSuccess ? C.successLight : C.dangerLight,
    color: isSuccess ? C.success : C.danger,
  }),

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
  }),

  errorBox: {
    padding: 12,
    background: C.dangerLight,
    color: C.danger,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 13,
  } as CSSProperties,

  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: C.textSub,
    marginBottom: 6,
  } as CSSProperties,

  input: {
    width: '100%',
    padding: '10px 12px',
    border: `1.5px solid ${C.border}`,
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  } as CSSProperties,
}
