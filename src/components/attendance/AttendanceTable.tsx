import React from 'react'
import { C, s } from '@/styles/attendance.styles'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { fmtDate, fmtTimeOnly } from '@/utils/attendance.utils'
import type { DailySummaryItem, DepartmentItem } from '@/services/api'

interface AttendanceTableProps {
  rows: DailySummaryItem[]
  isLoadingData: boolean
  page: number
  setPage: React.Dispatch<React.SetStateAction<number>>
  pageSize: number
  setPageSize: (size: number) => void
  totalItems: number
  totalPages: number
  departments: DepartmentItem[]
  setSelectedRow: (row: DailySummaryItem) => void
  isExportMenuOpen: boolean
  setIsExportMenuOpen: (val: boolean) => void
  handleExportExcelRaw: () => void
  handleExportExcelStatistics: () => void
  setIsMonthlyExportOpen: (val: boolean) => void
  user: any
  setIsBulkAddOpen: (val: boolean) => void
  fetchData: () => void
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({
  rows,
  isLoadingData,
  page,
  setPage,
  pageSize,
  setPageSize,
  totalItems,
  totalPages,
  departments,
  setSelectedRow,
  isExportMenuOpen,
  setIsExportMenuOpen,
  handleExportExcelRaw,
  handleExportExcelStatistics,
  setIsMonthlyExportOpen,
  user,
  setIsBulkAddOpen,
  fetchData,
}) => {
  return (
    <div style={s.tableCard}>
      {/* Table header row */}
      <div style={s.tableHeader}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.textMain }}>
          Danh sách chấm công
          <span style={{ color: C.textMuted, fontWeight: 400, marginLeft: 8, fontSize: 13 }}>
            ({totalItems} bản ghi)
          </span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              style={{ ...s.primaryBtn, background: '#16a34a', fontFamily: 'Cambria, serif' }}
              onBlur={() => setTimeout(() => setIsExportMenuOpen(false), 200)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
              Xuất Excel
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>expand_more</span>
            </button>

            {isExportMenuOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 4,
                background: '#fff',
                borderRadius: 8,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                border: `1px solid ${C.border}`,
                padding: '4px 0',
                zIndex: 100,
                minWidth: 230,
              }}>
                <button
                  onClick={() => {
                    setIsExportMenuOpen(false)
                    handleExportExcelRaw()
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 16px',
                    background: 'none',
                    border: 'none',
                    fontSize: 13,
                    color: C.textMain,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: 'Inter, sans-serif'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: C.textSub }}>list_alt</span>
                  Xuất danh sách chấm công nhân viên
                </button>
                <button
                  onClick={() => {
                    setIsExportMenuOpen(false)
                    handleExportExcelStatistics()
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 16px',
                    background: 'none',
                    border: 'none',
                    fontSize: 13,
                    color: C.textMain,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: 'Inter, sans-serif'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: C.textSub }}>analytics</span>
                  Xuất bảng tổng hợp  công và tăng ca
                </button>
                <div style={{ borderTop: `1px solid ${C.border}`, margin: '4px 0' }} />
                <button
                  onClick={() => {
                    setIsExportMenuOpen(false)
                    setIsMonthlyExportOpen(true)
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 16px',
                    background: 'none',
                    border: 'none',
                    fontSize: 13,
                    color: C.textMain,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: 'Inter, sans-serif'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'none'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: C.textSub }}>calendar_month</span>
                  Xuất Excel theo tháng
                </button>
              </div>
            )}
          </div>
          {user?.displayName === 'admin' && (
            <>
              <button onClick={() => setIsBulkAddOpen(true)} style={s.primaryBtn}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>playlist_add</span>
                Thêm chấm công hàng loạt
              </button>
              <div style={{ width: 1, height: 24, background: C.border, margin: '0 4px' }}></div>
            </>
          )}
          <button
            onClick={fetchData}
            style={s.iconBtn}
            title="Làm mới"
          >
            <span className="material-symbols-outlined" style={{ color: C.textSub }}>refresh</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={s.table}>
          <thead>
            <tr>
              {['STT', 'Mã NV', 'Tên nhân viên', 'Phòng ban', 'Ngày', 'Thứ', 'Ca', 'Giờ vào', 'Giờ ra', 'Giờ làm', 'Thao tác'].map((h) => (
                <th key={h} style={{ ...s.th, ...(h === 'STT' ? { width: 60, textAlign: 'center' } : {}) }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoadingData ? (
              <tr>
                <td colSpan={11} style={s.emptyCell}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <LoadingSpinner />
                    <div style={{ marginTop: 8, color: C.textMuted, fontSize: 13 }}>Đang tải dữ liệu...</div>
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={11} style={s.emptyCell}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 48, color: C.textMuted }}>inbox</span>
                    <div style={{ marginTop: 8, color: C.textMuted, fontSize: 14 }}>Không có dữ liệu</div>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                return (
                  <tr
                    key={`${row.employeeCode}_${row.workDate}`}
                    style={{
                      ...s.tr,
                      background: idx % 2 === 0 ? '#fff' : '#f8fafc',
                    }}
                  >
                    <td style={{ ...s.td, textAlign: 'center', fontWeight: 500, color: C.textSub }}>{(page - 1) * pageSize + idx + 1}</td>
                    <td style={{ ...s.td, fontFamily: 'monospace', fontSize: 13 }}>{row.employeeCode}</td>
                    <td style={{ ...s.td, fontWeight: 500, color: C.textMain }}>{row.employeeName}</td>
                    <td style={s.td}>{departments.find((d) => d.departmentCode === row.departmentCode)?.departmentName || row.departmentCode || '—'}</td>
                    <td style={s.td}>{fmtDate(row.workDate)}</td>
                    <td style={{ ...s.td, fontSize: 13 }}>{row.weekDayName || '—'}</td>
                    <td style={s.td}>{row.shiftName || row.shiftCode || '—'}</td>
                    <td style={{ ...s.td, fontWeight: 600, color: C.success }}>{fmtTimeOnly(row.rawCheckIn)}</td>
                    <td style={{ ...s.td, fontWeight: 600, color: C.warning }}>{fmtTimeOnly(row.displayCheckOut)}</td>
                    <td style={{ ...s.td, fontWeight: 700, color: C.textMain }}>{row.workHours > 0 ? <span style={{ color: C.success }}>{row.workHours}h</span> : '—'}</td>
                    <td style={s.td}>
                      <button onClick={() => setSelectedRow(row)} style={s.iconBtn} title="Xem chi tiết & thao tác">
                        <span className="material-symbols-outlined" style={{ color: C.primary, fontSize: 20 }}>visibility</span>
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={s.pagination}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: C.textMuted }}>
            Trang {page} / {totalPages} · {totalItems} bản ghi
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: C.textMuted }}>Hiển thị:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
              style={{
                padding: '2px 6px',
                borderRadius: 4,
                border: `1px solid ${C.border}`,
                fontSize: 13,
                outline: 'none',
                cursor: 'pointer',
                color: C.textMain
              }}
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            style={s.pageBtn(page === 1)}
            title="Trang đầu"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>first_page</span>
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={s.pageBtn(page === 1)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 2, totalPages - 4))
            const p = start + i
            return p <= totalPages ? (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={s.pageNumBtn(p === page)}
              >
                {p}
              </button>
            ) : null
          })}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={s.pageBtn(page === totalPages)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            style={s.pageBtn(page === totalPages)}
            title="Trang cuối"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>last_page</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AttendanceTable
