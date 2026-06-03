import {
  useState,
  useEffect,
  useCallback,
  type CSSProperties,
  type FormEvent,
} from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  attendanceApi,
  lookupApi,
  type DailySummaryItem,
  type DailySummaryParams,
  type DepartmentItem,
  type EmployeeLookupItem,
} from '@/services/api'
import logo6 from '@/assets/Image/logo6.png'
import VGSelectSearch from '@/assets/components/ui/VGSelectSearch'
import RawLogsModal from '@/components/RawLogsModal'
import BulkAddModal from '@/components/BulkAddModal'
import { toast } from 'react-toastify'
import { saveAs } from 'file-saver'
import ExcelJS from 'exceljs'
import * as XLSX from 'xlsx'

/* ─────────────────── Design tokens ─────────────────── */
const C = {
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

/* ─────────────────── Helpers ────────────────────────── */
const fmt = (iso: string) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return iso
  }
}

const fmtTimeOnly = (iso: string) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return iso
  }
}

const fmtDate = (iso: string) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

const toInputDateTime = (iso?: string) => {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ''
  }
}

const CHECK_TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  I: { bg: C.successLight, text: C.success, label: 'Vào' },
  O: { bg: C.dangerLight, text: C.danger, label: 'Ra' },
  IN: { bg: C.successLight, text: C.success, label: 'Vào' },
  OUT: { bg: C.dangerLight, text: C.danger, label: 'Ra' },
}
const getCheckType = (t: string) =>
  CHECK_TYPE_COLORS[t?.toUpperCase()] ?? { bg: C.primaryLight, text: C.primary, label: t || '—' }
/* ─────────────────── Main component ────────────────── */
const AttendancePage = () => {
  const { user, logout } = useAuth()

  /* Data */
  const [rows, setRows] = useState<DailySummaryItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  /* Modal state */
  const [selectedRow, setSelectedRow] = useState<DailySummaryItem | null>(null)
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false)

  /* Pagination */
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  /* Filters */
  const [filters, setFilters] = useState<DailySummaryParams>({
    fromDate: new Date(new Date().setDate(1)).toISOString().slice(0, 10), // Default to start of month
    toDate: new Date().toISOString().slice(0, 10), // Default to today
  })
  const [filterDraft, setFilterDraft] = useState({
    employeeCode: '',
    departmentCode: '',
    fromDate: new Date(new Date().setDate(1)).toISOString().slice(0, 10),
    toDate: new Date().toISOString().slice(0, 10),
  })

  /* Lookups */
  const [departments, setDepartments] = useState<DepartmentItem[]>([])
  const [employees, setEmployees] = useState<EmployeeLookupItem[]>([])

  useEffect(() => {
    lookupApi.getDepartments()
      .then(res => setDepartments(Array.isArray(res) ? res : (res as any).items || (res as any).data || []))
      .catch(console.error)
    lookupApi.getEmployees()
      .then(res => setEmployees(Array.isArray(res) ? res : (res as any).items || (res as any).data || []))
      .catch(console.error)
  }, [])


  /* Sidebar */
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    if (type === 'ok') toast.success(msg)
    else toast.error(msg)
  }

  /* ── Fetch data ── */
  const fetchData = useCallback(async (p: number, f: DailySummaryParams) => {
    setIsLoadingData(true)
    setFetchError(null)
    try {
      const res = await attendanceApi.getDailySummary({ page: p, pageSize, ...f })
      setRows(res.items ?? [])
      setTotalItems(res.totalItems ?? 0)
      setTotalPages(res.totalPages ?? 1)
    } catch (e) {
      let msg = e instanceof Error ? e.message : 'Lỗi tải dữ liệu'
      if (msg.includes('400')) {
        msg = 'Dữ liệu tìm kiếm không hợp lệ, vui lòng kiểm tra lại!'
      }
      setFetchError(msg)
      showToast(msg, 'err')
    } finally {
      setIsLoadingData(false)
    }
  }, [pageSize])

  useEffect(() => {
    if (filters.fromDate && filters.toDate) {
      fetchData(page, filters)
    }
  }, [page, filters, fetchData])

  /* ── Apply filters ── */
  const applyFilters = () => {
    const f: DailySummaryParams = {
      fromDate: filterDraft.fromDate || new Date(new Date().setDate(1)).toISOString().slice(0, 10),
      toDate: filterDraft.toDate || new Date().toISOString().slice(0, 10),
    }
    if (filterDraft.employeeCode) f.employeeCode = filterDraft.employeeCode
    if (filterDraft.departmentCode) f.departmentCode = filterDraft.departmentCode
    setFilters(f)
    setPage(1)
  }

  const clearFilters = () => {
    const defaultFrom = new Date(new Date().setDate(1)).toISOString().slice(0, 10)
    const defaultTo = new Date().toISOString().slice(0, 10)
    setFilterDraft({ employeeCode: '', departmentCode: '', fromDate: defaultFrom, toDate: defaultTo })
    setFilters({ fromDate: defaultFrom, toDate: defaultTo })
    setPage(1)
  }

  const handleExportExcelRaw = async () => {
    if (rows.length === 0) {
      showToast('Không có dữ liệu để xuất!', 'err')
      return
    }

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('BangChamCong')

    // 1. Tiêu đề chính
    worksheet.mergeCells('A1:I1')
    const titleCell = worksheet.getCell('A1')
    titleCell.value = 'BẢNG TỔNG HỢP CHẤM CÔNG'
    titleCell.font = { name: 'Cambria', size: 18, bold: true, color: { argb: 'FFC06252' } }
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
    worksheet.getRow(1).height = 40

    // 2. Tiêu đề thời gian
    worksheet.mergeCells('A2:I2')
    const dateCell = worksheet.getCell('A2')
    dateCell.value = `Từ ngày: ${fmtDate(filterDraft.fromDate)}  -  Đến ngày: ${fmtDate(filterDraft.toDate)}`
    dateCell.font = { name: 'Cambria', size: 12, italic: true, color: { argb: 'FF555555' } }
    dateCell.alignment = { vertical: 'middle', horizontal: 'center' }
    worksheet.getRow(2).height = 25

    worksheet.addRow([]) // Dòng trống

    // 3. Thiết lập độ rộng cột
    worksheet.getColumn(1).width = 8
    worksheet.getColumn(2).width = 15
    worksheet.getColumn(3).width = 25
    worksheet.getColumn(4).width = 20
    worksheet.getColumn(5).width = 15
    worksheet.getColumn(6).width = 10
    worksheet.getColumn(7).width = 15
    worksheet.getColumn(8).width = 15
    worksheet.getColumn(9).width = 15
    worksheet.getColumn(10).width = 12

    // 4. Header (Dòng 4)
    const headerRow = worksheet.addRow([
      'STT', 'Mã NV', 'Tên nhân viên', 'Phòng ban', 'Ngày', 'Thứ', 'Ca', 'Giờ vào', 'Giờ ra', 'Giờ làm'
    ])
    headerRow.height = 30
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFC06252' },
      }
      cell.font = {
        name: 'Cambria',
        color: { argb: 'FFFFFFFF' },
        bold: true,
        size: 11
      }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFC06252' } },
        left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        bottom: { style: 'thin', color: { argb: 'FFC06252' } },
        right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
      }
    })

    // 5. Thêm dữ liệu
    rows.forEach((row, idx) => {
      const addedRow = worksheet.addRow([
        (page - 1) * pageSize + idx + 1,
        row.employeeCode,
        row.employeeName,
        departments.find((d) => d.departmentCode === row.departmentCode)?.departmentName || row.departmentCode || '',
        fmtDate(row.workDate),
        row.weekDayName || '',
        row.shiftName || row.shiftCode || '',
        fmtTimeOnly(row.rawCheckIn) !== '—' ? fmtTimeOnly(row.rawCheckIn) : '',
        fmtTimeOnly(row.displayCheckOut) !== '—' ? fmtTimeOnly(row.displayCheckOut) : '',
        row.workHours > 0 ? `${row.workHours}h` : '',
      ])

      addedRow.height = 24
      const isEven = idx % 2 === 0

      addedRow.eachCell((cell, colNumber) => {
        let fontColor = 'FF1E293B' // textMain
        let bold = false

        // Giờ vào (cột 8) - màu xanh
        if (colNumber === 8 && cell.value) fontColor = 'FF16A34A'
        // Giờ ra (cột 9) - màu cam
        if (colNumber === 9 && cell.value) fontColor = 'FFD97706'
        // Giờ làm (cột 10) - màu xanh đậm, in đậm
        if (colNumber === 10 && cell.value) {
          fontColor = 'FF16A34A'
          bold = true
        }

        cell.font = { name: 'Cambria', color: { argb: fontColor }, bold, size: 11 }
        cell.alignment = { vertical: 'middle', horizontal: colNumber >= 5 ? 'center' : 'left' }
        if (colNumber === 1) cell.alignment.horizontal = 'center'

        // Màu nền xen kẽ (Zebra striping)
        if (isEven) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
        }

        cell.border = {
          top: { style: 'thin', color: { argb: 'FFEDF2F7' } },
          bottom: { style: 'thin', color: { argb: 'FFEDF2F7' } },
          left: { style: 'thin', color: { argb: 'FFEDF2F7' } },
          right: { style: 'thin', color: { argb: 'FFEDF2F7' } }
        }
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `ChamCong_${filterDraft.fromDate}_${filterDraft.toDate}.xlsx`)
  }

  const handleExportExcelStatistics = async () => {
    try {
      showToast('Đang xuất Excel...', 'ok')
      const fromDate = filterDraft.fromDate || new Date(new Date().setDate(1)).toISOString().slice(0, 10)
      const toDate = filterDraft.toDate || new Date().toISOString().slice(0, 10)

      const blob = await attendanceApi.exportDepartmentStatistics({
        fromDate,
        toDate,
        departmentCode: filterDraft.departmentCode || undefined,
        employeeCode: filterDraft.employeeCode || undefined,
      })

      // ── Format Excel ──
      const arrayBuffer = await blob.arrayBuffer()
      const wbRaw = XLSX.read(arrayBuffer, { type: 'array' })
      const wsRaw = wbRaw.Sheets[wbRaw.SheetNames[0]]
      const dataRaw: any[][] = XLSX.utils.sheet_to_json(wsRaw, { header: 1 })

      const rowsData: any[] = []
      let dataStartRow = 4 

      for (let i = 0; i < Math.min(10, dataRaw.length); i++) {
        const row = dataRaw[i]
        if (!row) continue
        const cell1 = row[0]?.toString()
        const cell2 = row[1]?.toString()
        if (cell1 === 'STT' || cell2?.includes('Phòng ban')) {
          dataStartRow = i + 1
          break
        }
      }

      let sumCong = 0
      let sumGio = 0

      for (let i = dataStartRow; i < dataRaw.length; i++) {
        const row = dataRaw[i]
        if (!row || row.length === 0) continue
        const stt = row[0]
        const phongBan = row[1]
        const tongCong = row[2]
        const tongGio = row[3]

        if (stt === undefined && phongBan === undefined && tongCong === undefined && tongGio === undefined) continue

        const pbStr = phongBan?.toString().toUpperCase() || ''
        const sttStr = stt?.toString().toUpperCase() || ''
        const isTotalRow = pbStr.includes('TỔNG CỘNG') || sttStr.includes('TỔNG CỘNG')

        if (!isTotalRow) {
          sumCong += (Number(tongCong) || 0)
          sumGio += (Number(tongGio) || 0)
        }

        rowsData.push({ 
          stt: stt ?? '', 
          phongBan: phongBan ?? '', 
          tongCong: tongCong ?? '', 
          tongGio: tongGio ?? '',
          isTotalRow 
        })
      }

      let hasTotal = false
      rowsData.forEach(r => {
        if (r.isTotalRow) {
          hasTotal = true
          if (r.tongCong === '' || r.tongCong === null || r.tongCong === undefined) r.tongCong = sumCong
          if (r.tongGio === '' || r.tongGio === null || r.tongGio === undefined) r.tongGio = sumGio
        }
      })
      if (!hasTotal) {
        rowsData.push({ stt: '', phongBan: 'TỔNG CỘNG', tongCong: sumCong, tongGio: sumGio, isTotalRow: true })
      }

      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('ThongKeChamCong')

      worksheet.mergeCells('A1:D1')
      const titleCell = worksheet.getCell('A1')
      titleCell.value = 'BẢNG TỔNG HỢP CÔNG VÀ GIỜ TĂNG CA THEO PHÒNG BAN'
      titleCell.font = { name: 'Cambria', size: 18, bold: true, color: { argb: 'FFC06252' } }
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
      worksheet.getRow(1).height = 40

      worksheet.mergeCells('A2:D2')
      const dateCell = worksheet.getCell('A2')
      dateCell.value = `Từ ngày: ${fmtDate(fromDate)}  -  Đến ngày: ${fmtDate(toDate)}`
      dateCell.font = { name: 'Cambria', size: 12, italic: true, color: { argb: 'FF555555' } }
      dateCell.alignment = { vertical: 'middle', horizontal: 'center' }
      worksheet.getRow(2).height = 25

      worksheet.addRow([])

      worksheet.getColumn(1).width = 10 
      worksheet.getColumn(2).width = 30 
      worksheet.getColumn(3).width = 25 
      worksheet.getColumn(4).width = 25 

      const headerRow = worksheet.addRow(['STT', 'Phòng ban', 'Tổng công làm', 'Tổng giờ tăng ca'])
      headerRow.height = 30
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC06252' } }
        cell.font = { name: 'Cambria', color: { argb: 'FFFFFFFF' }, bold: true, size: 12 }
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFC06252' } }, left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
          bottom: { style: 'thin', color: { argb: 'FFC06252' } }, right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
        }
      })

      rowsData.forEach((r, idx) => {
        const addedRow = worksheet.addRow([r.stt, r.phongBan, r.tongCong, r.tongGio])
        addedRow.height = 24
        
        const isTotalRow = r.isTotalRow
        const isEven = idx % 2 === 0
        
        addedRow.eachCell((cell, colNumber) => {
          let fontColor = 'FF1E293B'
          let bold = isTotalRow
          let bg = isTotalRow ? 'FFF1F5F9' : (isEven ? 'FFF8FAFC' : 'FFFFFFFF')

          if (colNumber === 3 && cell.value !== '' && cell.value !== null && !isTotalRow) fontColor = 'FF16A34A'
          if (colNumber === 4 && cell.value !== '' && cell.value !== null && !isTotalRow) fontColor = 'FFD97706'

          cell.font = { name: 'Cambria', color: { argb: fontColor }, bold, size: 11 }
          cell.alignment = { vertical: 'middle', horizontal: colNumber >= 3 || colNumber === 1 ? 'center' : 'left' }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
          
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFEDF2F7' } }, bottom: { style: 'thin', color: { argb: 'FFEDF2F7' } },
            left: { style: 'thin', color: { argb: 'FFEDF2F7' } }, right: { style: 'thin', color: { argb: 'FFEDF2F7' } }
          }
        })
      })

      const outBuffer = await workbook.xlsx.writeBuffer()
      const newBlob = new Blob([outBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      saveAs(newBlob, `ThongKeChamCong_${fromDate}_${toDate}.xlsx`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      showToast('Lỗi xuất Excel: ' + msg, 'err')
    }
  }

  /* ── Stats ── */
  const checkIn = rows.filter((r) => r.checkIn).length
  const checkOut = rows.filter((r) => r.checkOut).length

  return (
    <div style={s.shell}>
      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside style={{ ...s.sidebar, width: sidebarOpen ? 240 : 64 }}>
        <div style={s.sidebarLogo}>
          <img
            src={logo6}
            alt="Vinh Gia"
            style={{
              width: sidebarOpen ? 90 : 38,
              height: 'auto',
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)',
              display: 'block',
              margin: '0 auto',
            }}
          />
        </div>

        <nav style={s.sidebarNav}>
          {[
            { icon: 'event_note', label: 'Chấm công', active: true },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                ...s.navItem,
                background: item.active ? C.sidebarActive : 'transparent',
              }}
            >
              <span className="material-symbols-outlined" style={{ ...s.navIcon, color: item.active ? '#fff' : C.sidebarText }}>{item.icon}</span>
              {sidebarOpen && <span style={{ color: item.active ? '#fff' : C.sidebarText, fontSize: 14, fontWeight: item.active ? 500 : 400 }}>{item.label}</span>}
            </div>
          ))}
        </nav>

        <div style={s.sidebarUser}>
          <div style={s.sidebarAvatar}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{user?.displayName?.charAt(0)?.toUpperCase() ?? 'U'}</span>
          </div>
          {sidebarOpen && (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{user?.displayName ?? user?.username}</div>
              <div style={{ color: C.sidebarText, fontSize: 11 }}>{user?.role}</div>
            </div>
          )}
          <button onClick={logout} style={s.logoutBtn} title="Đăng xuất">
            <span className="material-symbols-outlined" style={{ color: C.sidebarText, fontSize: 20 }}>logout</span>
          </button>
        </div>
      </aside>

      {/* ═══════════ MAIN ═══════════ */}
      <div style={s.main}>
        <header style={s.topbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={s.iconBtn}><span className="material-symbols-outlined">menu</span></button>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.textMain }}>Bảng tổng hợp chấm công</div>
            </div>
          </div>
        </header>

        <div style={s.content}>

          <div style={s.filterCard}>
            <div style={s.filterGrid}>
              <FilterInput
                label="Từ ngày"
                value={filterDraft.fromDate}
                onChange={(v) => setFilterDraft({ ...filterDraft, fromDate: v })}
                type="date"
              />
              <FilterInput
                label="Đến ngày"
                value={filterDraft.toDate}
                onChange={(v) => setFilterDraft({ ...filterDraft, toDate: v })}
                type="date"
              />
              <div>
                <label style={s.filterLabel}>Mã nhân viên</label>
                <div style={{ ...s.filterInputWrap, border: 'none', background: 'transparent', padding: 0 }}>

                  <VGSelectSearch
                    value={filterDraft.employeeCode}
                    onChange={(v) => setFilterDraft({ ...filterDraft, employeeCode: v ? String(v.value) : '' })}
                    placeholder="Tất cả nhân viên"
                    loadOptions={async (kw) => {
                      const lower = (kw || '').toLowerCase();
                      return employees
                        .filter(e => (e.fullName?.toLowerCase() || '').includes(lower) || (e.employeeCode?.toLowerCase() || '').includes(lower))
                        .map((e) => ({ label: `${e.fullName} (${e.employeeCode})`, value: e.employeeCode }));
                    }}
                    getOptionByValue={(val) => {
                      const emp = employees.find(e => e.employeeCode === val);
                      return emp ? { label: `${emp.fullName} (${emp.employeeCode})`, value: emp.employeeCode } : null;
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={s.filterLabel}>Phòng ban</label>
                <div style={{ ...s.filterInputWrap, border: 'none', background: 'transparent', padding: 0 }}>

                  <VGSelectSearch
                    value={filterDraft.departmentCode}
                    onChange={(v) => setFilterDraft({ ...filterDraft, departmentCode: v ? String(v.value) : '' })}
                    placeholder="Tất cả phòng ban"
                    loadOptions={async (kw) => {
                      const lower = (kw || '').toLowerCase();
                      return departments
                        .filter(d => (d.departmentName?.toLowerCase() || '').includes(lower) || (d.departmentCode?.toLowerCase() || '').includes(lower))
                        .map((d) => ({ label: d.departmentName, value: d.departmentCode }));
                    }}
                    getOptionByValue={(val) => {
                      const dep = departments.find(d => d.departmentCode === val);
                      return dep ? { label: dep.departmentName, value: dep.departmentCode } : null;
                    }}
                  />
                </div>
              </div>

              {/* Filter Action Buttons aligned with inputs */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: '100%', paddingBottom: 1 }}>
                <button onClick={applyFilters} style={s.primaryBtn}>
                  <span className="material-symbols-outlined" style={{ fontSize: 17 }}>search</span>
                  Tìm kiếm
                </button>
                <button onClick={clearFilters} style={s.outlineBtn}>
                  <span className="material-symbols-outlined" style={{ fontSize: 17 }}>clear</span>
                  Xóa lọc
                </button>
              </div>
            </div>
          </div>

          {/* ── Table ── */}
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
                        Xuất danh sách chấm công
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
                        Xuất bảng công và tăng ca
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
                  onClick={() => fetchData(page, filters)}
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
        </div>
      </div>



      {/* ═══════════ MODAL ═══════════ */}
      {selectedRow && (
        <RawLogsModal
          employeeCode={selectedRow.employeeCode}
          employeeName={selectedRow.employeeName}
          attendanceCode={selectedRow.attendanceCode}
          workDate={selectedRow.workDate}
          onClose={() => setSelectedRow(null)}
          onLogsChanged={() => fetchData(page, filters)}
        />
      )}

      {/* ═══════════ BULK ADD MODAL ═══════════ */}
      {isBulkAddOpen && (
        <BulkAddModal
          employees={employees}
          onClose={() => setIsBulkAddOpen(false)}
          onSuccess={() => {
            setIsBulkAddOpen(false)
            fetchData(page, filters)
            showToast('Thêm hàng loạt thành công!', 'ok')
          }}
        />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: none } }
        @keyframes slideIn { from { opacity: 0; transform: scale(0.96) } to { opacity: 1; transform: scale(1) } }
      `}</style>
    </div>
  )
}

/* ─────────────────── Filter Input ─────────────────── */
interface FilterInputProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  icon?: string
  type?: string
}
const FilterInput = ({ label, value, onChange, placeholder, icon, type = 'text' }: FilterInputProps) => (
  <div>
    <label style={s.filterLabel}>{label}</label>
    <div style={s.filterInputWrap}>
      {icon && (
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#94a3b8', position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          {icon}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...s.filterInput, paddingLeft: icon ? 32 : 10 }}
      />
    </div>
  </div>
)


/* ─────────────────── Loading Spinner ────────────────── */
const LoadingSpinner = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.9s linear infinite' }}>
    <circle cx="12" cy="12" r="10" stroke="#e2e8f0" strokeWidth="3" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--brand)" strokeWidth="3" strokeLinecap="round" />
  </svg>
)

/* ─────────────────── Styles ─────────────────────────── */
const s = {
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
    overflow: 'hidden',
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
    background: C.surface,
    borderBottom: `1px solid ${C.border}`,
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

  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 14,
    flexShrink: 0,
  } as CSSProperties,

  statCard: {
    background: C.surface,
    borderRadius: 14,
    padding: '18px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    border: `1px solid ${C.border}`,
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

  filterCard: {
    background: C.surface,
    borderRadius: 14,
    padding: '18px 20px',
    border: `1px solid ${C.border}`,
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
    color: C.textSub,
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
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    fontSize: 13,
    color: C.textMain,
    background: '#f8fafc',
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
    transition: 'border-color 0.15s',
    boxSizing: 'border-box' as const,
  } as CSSProperties,

  filterSelect: {
    width: '100%',
    padding: '8px 10px',
    border: `1.5px solid ${C.border}`,
    borderRadius: 8,
    fontSize: 13,
    color: C.textMain,
    background: '#f8fafc',
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
    cursor: 'pointer',
    boxSizing: 'border-box' as const,
  } as CSSProperties,

  tableCard: {
    background: C.surface,
    borderRadius: 14,
    border: `1px solid ${C.border}`,
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
    borderBottom: `1px solid ${C.border}`,
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
    color: C.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    background: '#f8fafc',
    borderBottom: `1px solid ${C.border}`,
    whiteSpace: 'nowrap' as const,
  } as CSSProperties,

  tr: {
    transition: 'background 0.1s',
  } as CSSProperties,

  td: {
    padding: '10px 14px',
    color: C.textSub,
    borderBottom: `1px solid #f1f5f9`,
    verticalAlign: 'middle' as const,
    whiteSpace: 'nowrap' as const,
  } as CSSProperties,

  emptyCell: {
    padding: '60px 20px',
    textAlign: 'center' as const,
    color: C.textMuted,
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
    borderTop: `1px solid ${C.border}`,
    flexShrink: 0,
  } as CSSProperties,

  pageBtn: (disabled: boolean): CSSProperties => ({
    width: 32,
    height: 32,
    border: `1px solid ${C.border}`,
    borderRadius: 7,
    background: disabled ? '#f8fafc' : C.surface,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.4 : 1,
    color: C.textSub,
  }),

  pageNumBtn: (active: boolean): CSSProperties => ({
    width: 32,
    height: 32,
    border: active ? 'none' : `1px solid ${C.border}`,
    borderRadius: 7,
    background: active ? C.primary : C.surface,
    color: active ? '#fff' : C.textSub,
    fontWeight: active ? 700 : 400,
    fontSize: 13,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),

  /* Buttons */
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    padding: '0 16px',
    background: C.primary,
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
    color: C.textSub,
    border: `1px solid ${C.border}`,
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
    background: C.danger,
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
    border: `1px solid ${C.border}`,
  } as CSSProperties,

  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 20px',
    background: C.dangerLight,
    color: C.danger,
    fontSize: 13,
    fontWeight: 500,
    borderBottom: `1px solid #fca5a5`,
  } as CSSProperties,

  /* Modal */
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
    background: C.surface,
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
    borderBottom: `1px solid ${C.border}`,
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
    color: C.textSub,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  } as CSSProperties,

  formInput: {
    padding: '9px 12px',
    border: `1.5px solid ${C.border}`,
    borderRadius: 8,
    fontSize: 14,
    color: C.textMain,
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
    background: '#f8fafc',
    width: '100%',
    boxSizing: 'border-box' as const,
  } as CSSProperties,
}

export default AttendancePage
