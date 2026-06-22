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
  type AreaInfo,
  type EmployeeLookupItem,
  type EmployeeInfo,
} from '@/services/api'

import RawLogsModal from '@/components/RawLogsModal'
import BulkAddModal from '@/components/BulkAddModal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toast } from 'react-toastify'
import { saveAs } from 'file-saver'
import ExcelJS from 'exceljs'
import * as XLSX from 'xlsx'

import AppSidebar from '@/components/layout/AppSidebar'
import FilterPanel from '@/components/attendance/FilterPanel'
import AttendanceTable from '@/components/attendance/AttendanceTable'
import MonthlyExportModal from '@/components/attendance/MonthlyExportModal'
import { C, s } from '@/styles/attendance.styles'
import { fmtDate, fmtTimeOnly, fmt, toInputDateTime } from '@/utils/attendance.utils'

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

  /* Monthly export modal */
  const [isMonthlyExportOpen, setIsMonthlyExportOpen] = useState(false)
  const [exportMonth, setExportMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [isExportingMonthly, setIsExportingMonthly] = useState(false)
  const [selectedExportDepts, setSelectedExportDepts] = useState<string[]>([])

  /* Department tree */
  const [deptTreeOpen, setDeptTreeOpen] = useState(true)
  const [selectedDeptCode, setSelectedDeptCode] = useState<string>('')

  /* Build area → department grouped tree from flat list */
  interface AreaNode {
    area: AreaInfo
    departments: DepartmentItem[]
  }
  const buildAreaTree = (list: DepartmentItem[]): AreaNode[] => {
    const areaMap = new Map<string, AreaNode>()
    const noArea: DepartmentItem[] = []
    list.forEach(d => {
      if (d.parentArea) {
        const key = d.parentArea.areaCode
        if (!areaMap.has(key)) {
          areaMap.set(key, { area: d.parentArea, departments: [] })
        }
        areaMap.get(key)!.departments.push(d)
      } else {
        noArea.push(d)
      }
    })
    const nodes = Array.from(areaMap.values())
    // Nếu có phòng ban không thuộc khu vực nào, nhóm vào "Khác"
    if (noArea.length > 0) {
      nodes.push({
        area: { areaCode: '__no_area__', areaName: 'Khác' },
        departments: noArea,
      })
    }
    return nodes
  }
  const areaTree = buildAreaTree(departments)

  /* Expanded areas state */
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set())
  const toggleAreaExpand = (code: string) => {
    setExpandedAreas(prev => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  const handleSelectDept = (code: string) => {
    setSelectedExportDepts(prev => {
      const isChecked = prev.includes(code)
      const next = isChecked ? prev.filter(c => c !== code) : [...prev, code]
      return next
    })
  }

  useEffect(() => {
    const newDeptCode = selectedExportDepts.join(',')
    setFilterDraft(prev => ({ ...prev, departmentCode: newDeptCode }))
    setFilters(prev => ({
      ...prev,
      departmentCode: newDeptCode || undefined
    }))
    setPage(1)
  }, [selectedExportDepts])

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
    setSelectedExportDepts([])
    setFilterDraft(prev => ({
      ...prev,
      employeeCode: '',
    }))
    setFilters(prev => ({
      fromDate: prev.fromDate,
      toDate: prev.toDate,
    }))
    setPage(1)
  }

  /* ── Monthly Excel Export (template format) ── */
  const handleExportExcelMonthly = async () => {
    if (!exportMonth) { showToast('Vui lòng chọn tháng!', 'err'); return }
    const [yearStr, monthStr] = exportMonth.split('-')
    const year = parseInt(yearStr)
    const month = parseInt(monthStr)
    const daysInMonth = new Date(year, month, 0).getDate()
    const fromDate = `${year}-${String(month).padStart(2, '0')}-01`
    const toDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`

    setIsExportingMonthly(true)
    try {
      showToast('Đang tải dữ liệu...', 'ok')

      let allRows: DailySummaryItem[] = []

      if (selectedExportDepts.length > 0) {
        for (const deptCode of selectedExportDepts) {
          const queryParams: DailySummaryParams = {
            page: 1,
            pageSize: 500,
            fromDate,
            toDate,
            departmentCode: deptCode,
            ...(filterDraft.employeeCode ? { employeeCode: filterDraft.employeeCode } : {})
          }
          const firstPage = await attendanceApi.getDailySummary(queryParams)
          let deptRows = firstPage.items ?? []
          if (firstPage.totalPages > 1) {
            for (let p = 2; p <= firstPage.totalPages; p++) {
              const res = await attendanceApi.getDailySummary({ ...queryParams, page: p })
              deptRows = deptRows.concat(res.items ?? [])
            }
          }
          allRows = allRows.concat(deptRows)
        }
      } else {
        const queryParams: DailySummaryParams = {
          page: 1,
          pageSize: 500,
          fromDate,
          toDate,
          ...(filterDraft.departmentCode ? { departmentCode: filterDraft.departmentCode } : {}),
          ...(filterDraft.employeeCode ? { employeeCode: filterDraft.employeeCode } : {})
        }

        const firstPage = await attendanceApi.getDailySummary(queryParams)
        allRows = firstPage.items ?? []
        if (firstPage.totalPages > 1) {
          for (let p = 2; p <= firstPage.totalPages; p++) {
            const res = await attendanceApi.getDailySummary({ ...queryParams, page: p })
            allRows = allRows.concat(res.items ?? [])
          }
        }
      }

      // Fetch all employees belonging to the selected departments
      let employeeList: EmployeeInfo[] = []
      try {
        const deptCodesToFetch = selectedExportDepts.length > 0
          ? selectedExportDepts
          : (filterDraft.departmentCode ? filterDraft.departmentCode.split(',') : departments.map(d => d.departmentCode))

        employeeList = await lookupApi.getEmployeesByDepartment({ departmentCodes: deptCodesToFetch })
        if (filterDraft.employeeCode) {
          employeeList = employeeList.filter(emp => emp.employeeCode === filterDraft.employeeCode)
        }
      } catch (err) {
        console.error('Error fetching employees by department:', err)
      }

      if (filterDraft.employeeCode) {
        allRows = allRows.filter(r => r.employeeCode === filterDraft.employeeCode)
      }

      if (allRows.length === 0 && employeeList.length === 0) {
        showToast('Không có dữ liệu nhân sự và chấm công trong tháng này!', 'err')
        setIsExportingMonthly(false)
        return
      }

      // Day-of-week helper (Vietnamese)
      const viDayNames: Record<number, string> = { 0: 'CN', 1: 'T.2', 2: 'T.3', 3: 'T.4', 4: 'T.5', 5: 'T.6', 6: 'T.7' }
      const dayNames: string[] = []
      for (let d = 1; d <= daysInMonth; d++) {
        dayNames.push(viDayNames[new Date(year, month - 1, d).getDay()])
      }
      const isSunday = (d: number) => new Date(year, month - 1, d).getDay() === 0

      // Group rows by departmentCode → employeeCode → day
      type EmpKey = string
      type DeptKey = string
      // map: deptCode -> empCode -> day(1-31) -> DailySummaryItem
      const deptMap = new Map<DeptKey, Map<EmpKey, Map<number, DailySummaryItem>>>()
      allRows.forEach(r => {
        const dept = r.departmentCode || ''
        const emp = r.employeeCode || ''
        const day = new Date(r.workDate).getDate()
        if (!deptMap.has(dept)) deptMap.set(dept, new Map())
        const empMap = deptMap.get(dept)!
        if (!empMap.has(emp)) empMap.set(emp, new Map())
        empMap.get(emp)!.set(day, r)
      })

      // Gather employee info
      const empInfoMap = new Map<string, any>()
      allRows.forEach(r => { if (!empInfoMap.has(r.employeeCode)) empInfoMap.set(r.employeeCode, r) })

      // Merge with employeeList to include employees with no logs
      if (Array.isArray(employeeList)) {
        employeeList.forEach(emp => {
          const dept = emp.departmentCode || ''
          const code = emp.employeeCode || ''

          if (!deptMap.has(dept)) {
            deptMap.set(dept, new Map())
          }
          const empMap = deptMap.get(dept)!
          if (!empMap.has(code)) {
            empMap.set(code, new Map())
          }

          if (!empInfoMap.has(code)) {
            empInfoMap.set(code, {
              employeeCode: code,
              employeeName: emp.fullName,
              departmentCode: dept,
              attendanceCode: emp.attendanceCode,
              workDate: emp.startDate || '',
              workHours: 0,
              cccd: (emp as any).cccd || (emp as any).cardNo || ''
            })
          }
        })
      }

      const workbook = new ExcelJS.Workbook()

      // One sheet per department (or all in one sheet if desired)
      const deptEntries = Array.from(deptMap.entries())

      // Create a single sheet matching the template
      const ws = workbook.addWorksheet('ChamCong')

      // Helper: get dept name
      const getDeptName = (code: string) =>
        departments.find(d => d.departmentCode === code)?.departmentName || code

      // Styles — brand color #c06252, font Cambria
      const BRAND = 'FFC06252'          // primary brand color
      const BRAND_LIGHT = 'FFFCE8E5'    // light tint for dept/total rows
      const WHITE = 'FFFFFFFF'
      const titleFont = { name: 'Cambria', size: 14, bold: true }
      const headerFont = { name: 'Cambria', size: 11, bold: true }
      const dataFont = { name: 'Cambria', size: 11 }
      const thinBorder = (): ExcelJS.Border => ({ style: 'thin', color: { argb: BRAND } })
      const allBorders = () => ({ top: thinBorder(), left: thinBorder(), bottom: thinBorder(), right: thinBorder() })
      const thinWhiteBorder = (): ExcelJS.Border => ({ style: 'thin', color: { argb: WHITE } })
      const headerBorders = () => ({ top: thinWhiteBorder(), left: thinWhiteBorder(), bottom: thinWhiteBorder(), right: thinWhiteBorder() })
      const centerAlign = (): ExcelJS.Alignment => ({ vertical: 'middle', horizontal: 'center', wrapText: true })
      const leftAlign = (): ExcelJS.Alignment => ({ vertical: 'middle', horizontal: 'left', wrapText: true })

      // Total number of columns: STT(1) + MãNV(2) + CCCD(3) + HọTên(4) + NgàyVào(5) + days(daysInMonth) + CôngChính + TổngCôngChính + TăngCa + ChủNhật + TăngCaChủNhật + GhiChú
      const dayStartCol = 6 // 1-indexed
      const dayEndCol = 5 + daysInMonth
      const colCongChinh = dayEndCol + 1
      const colTongCongChinh = dayEndCol + 2
      const colTangCa = dayEndCol + 3
      const colChuNhat = dayEndCol + 4
      const colTangCaChuNhat = dayEndCol + 5
      const colGhiChu = dayEndCol + 6
      const totalCols = colGhiChu

      // Set column widths
      ws.getColumn(1).width = 5   // STT
      ws.getColumn(2).width = 12  // Mã NV
      ws.getColumn(3).width = 14  // CCCD
      ws.getColumn(4).width = 22  // Họ và tên
      ws.getColumn(5).width = 11  // Ngày vào làm
      for (let d = 1; d <= daysInMonth; d++) {
        ws.getColumn(dayStartCol + d - 1).width = 5
      }
      ws.getColumn(colCongChinh).width = 8
      ws.getColumn(colTongCongChinh).width = 9
      ws.getColumn(colTangCa).width = 8
      ws.getColumn(colChuNhat).width = 8
      ws.getColumn(colTangCaChuNhat).width = 10
      ws.getColumn(colGhiChu).width = 14

      let currentRow = 1

      // ── Row 1: Company name ──
      ws.mergeCells(currentRow, 1, currentRow, totalCols)
      const companyCell = ws.getCell(currentRow, 1)
      companyCell.value = 'Công ty: CTY TNHH VINH GIA'
      companyCell.font = { ...titleFont, size: 12, color: { argb: 'FF555555' } }
      companyCell.alignment = leftAlign()
      ws.getRow(currentRow).height = 18
      currentRow++

      // ── Row 2: Title ──
      ws.mergeCells(currentRow, 1, currentRow, totalCols)
      const titleCell = ws.getCell(currentRow, 1)
      titleCell.value = `BẢNG CHẤM CÔNG THÁNG ${month} NĂM ${year}`
      titleCell.font = { ...titleFont, size: 16, bold: true, color: { argb: BRAND } }
      titleCell.alignment = centerAlign()
      ws.getRow(currentRow).height = 28
      currentRow++

      // ── Unified Column header rows (3 rows) ──
      const staticCols = [1, 2, 3, 4, 5, colCongChinh, colTongCongChinh, colTangCa, colChuNhat, colTangCaChuNhat, colGhiChu]
      const hdrFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: BRAND } }
      const sunFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: BRAND_LIGHT } }

      const writeHdrCell = (r: number, col: number, val: any, sun = false) => {
        const cell = ws.getCell(r, col)
        cell.value = val
        cell.font = sun
          ? { ...headerFont, color: { argb: 'FFCC0000' } }
          : { ...headerFont, color: { argb: WHITE } }
        cell.alignment = centerAlign()
        cell.fill = sun ? sunFill : hdrFill
        cell.border = headerBorders()
      }

      const r1 = currentRow
      // Row 1: labels
      ws.getRow(currentRow).height = 30
      writeHdrCell(currentRow, 1, 'STT')
      writeHdrCell(currentRow, 2, 'MÃ NHÂN VIÊN')
      writeHdrCell(currentRow, 3, 'SỐ CCCD')
      writeHdrCell(currentRow, 4, 'HỌ VÀ TÊN')
      writeHdrCell(currentRow, 5, 'NGÀY VÀO LÀM')
      ws.mergeCells(currentRow, dayStartCol, currentRow, dayEndCol)
      writeHdrCell(currentRow, dayStartCol, 'Ngày Trong Tháng')
      writeHdrCell(currentRow, colCongChinh, 'Công Chính')
      writeHdrCell(currentRow, colTongCongChinh, 'Tổng Công Chính')
      writeHdrCell(currentRow, colTangCa, 'Tăng Ca')
      writeHdrCell(currentRow, colChuNhat, 'Chủ Nhật')
      writeHdrCell(currentRow, colTangCaChuNhat, 'Tăng Ca Chủ Nhật')
      writeHdrCell(currentRow, colGhiChu, 'Ghi Chú')
      currentRow++

      // Row 2: day numbers
      ws.getRow(currentRow).height = 18
      for (const sc of staticCols) writeHdrCell(currentRow, sc, null)
      for (let d = 1; d <= daysInMonth; d++) writeHdrCell(currentRow, dayStartCol + d - 1, d)
      currentRow++

      // Row 3: day-of-week
      ws.getRow(currentRow).height = 18
      for (const sc of staticCols) writeHdrCell(currentRow, sc, null)
      for (let d = 1; d <= daysInMonth; d++) writeHdrCell(currentRow, dayStartCol + d - 1, dayNames[d - 1], isSunday(d))
      const hdrRow3Index = currentRow
      currentRow++

      // Merge static cols across all 3 header rows
      for (const col of staticCols) {
        ws.mergeCells(r1, col, hdrRow3Index, col)
        const mc = ws.getCell(r1, col)
        mc.alignment = centerAlign()
        mc.fill = hdrFill
        mc.border = headerBorders()
      }

      // Freeze top rows & first 5 cols
      const frozenY = currentRow - 1
      ws.views = [{ state: 'frozen', xSplit: 5, ySplit: frozenY, topLeftCell: `F${frozenY + 1}`, activeCell: 'A1' }]

      let globalStt = 0

      for (const [deptCode, empMap] of deptEntries) {
        const deptName = getDeptName(deptCode)

        // ── Department header row ──
        ws.mergeCells(currentRow, 1, currentRow, totalCols)
        const deptCell = ws.getCell(currentRow, 1)
        deptCell.value = `BỘ PHẬN/XƯỞNG: ${deptName}`
        deptCell.font = { ...titleFont, size: 12, bold: true, color: { argb: BRAND } }
        deptCell.alignment = leftAlign()
        deptCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_LIGHT } }
        deptCell.border = allBorders()
        ws.getRow(currentRow).height = 20
        currentRow++

        // ── Employee rows ──
        let deptTotalCong = 0
        let deptTotalGio = 0
        let deptTotalSun = 0
        let deptTotalSunOT = 0

        const empEntries = Array.from(empMap.entries())
        for (const [empCode, dayMap] of empEntries) {
          globalStt++
          const empInfo = empInfoMap.get(empCode)!

          // Compute totals
          let tongCong = 0
          let tangCa = 0
          let cuaT = 0
          let tangCaCuaT = 0
          const overtimeDayMap = new Map<number, number>() // day -> overtime hours

          for (let d = 1; d <= daysInMonth; d++) {
            const rec = dayMap.get(d)
            if (!rec) continue
            if (isSunday(d)) {
              cuaT++
              if (rec.workHours > 8) tangCaCuaT += rec.workHours - 8
            } else {
              if (rec.workHours > 6) {
                tongCong += 1
              } else if (rec.workHours >= 3) {
                tongCong += 0.5
              }
              if (rec.workHours > 8) {
                const ot = rec.workHours - 8
                tangCa += ot
                overtimeDayMap.set(d, ot)
              }
            }
          }

          deptTotalCong += tongCong
          deptTotalGio += tangCa
          deptTotalSun += cuaT
          deptTotalSunOT += tangCaCuaT

          // Main employee row
          const mainRow = ws.getRow(currentRow)
          mainRow.height = 20

          const ngayVaoLam = empInfo.workDate
            ? new Date(empInfo.workDate.substring(0, 7) + '-01')
            : null

          const setCell = (col: number, value: any, opts?: { bold?: boolean; color?: string; bg?: string }) => {
            const cell = ws.getCell(currentRow, col)
            cell.value = value
            cell.font = { ...dataFont, bold: opts?.bold, color: opts?.color ? { argb: opts.color } : undefined }
            cell.alignment = col <= 4 ? leftAlign() : centerAlign()
            if (opts?.bg) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: opts.bg } }
            cell.border = allBorders()
          }

          setCell(1, globalStt)
          setCell(2, empCode)
          setCell(3, (empInfo as any).cccd || '')
          setCell(4, empInfo.employeeName, { bold: true })
          const startDate = employees.find(e => e.employeeCode === empCode)
          // Ngày vào làm - try from employee lookup
          setCell(5, '')

          for (let d = 1; d <= daysInMonth; d++) {
            const col = dayStartCol + d - 1
            const rec = dayMap.get(d)
            const cell = ws.getCell(currentRow, col)
            if (isSunday(d)) {
              cell.value = rec ? 'CuT' : ''
              cell.font = { ...dataFont, color: { argb: 'FFC00000' }, bold: true }
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_LIGHT } }
            } else {
              let cellVal: any = ''
              if (rec) {
                const hasIn = !!rec.rawCheckIn
                const hasOut = !!(rec.rawCheckOut || rec.displayCheckOut)
                const isSingleSwipe = (hasIn && !hasOut) || (!hasIn && hasOut) || (hasIn && hasOut && rec.rawCheckIn === (rec.rawCheckOut || rec.displayCheckOut))

                if (!hasIn && !hasOut) {
                  cellVal = ''
                } else if (isSingleSwipe) {
                  cellVal = 'x'
                } else {
                  if (rec.workHours > 6) {
                    cellVal = 1
                  } else if (rec.workHours >= 3) {
                    cellVal = 0.5
                  } else {
                    cellVal = 0
                  }
                }
              }
              cell.value = cellVal
              cell.font = dataFont
              if (cellVal === 'x') {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } }
              }
            }
            cell.alignment = centerAlign()
            cell.border = allBorders()
          }

          setCell(colCongChinh, tongCong, { bold: true, color: 'FF1F497D' })
          setCell(colTongCongChinh, tongCong, { bold: true })
          setCell(colTangCa, tangCa > 0 ? tangCa : 0, { color: tangCa > 0 ? 'FF70AD47' : undefined })
          setCell(colChuNhat, cuaT)
          setCell(colTangCaChuNhat, tangCaCuaT > 0 ? tangCaCuaT : 0)
          setCell(colGhiChu, '')
          currentRow++

          // Overtime sub-row (always rendered)
          {
            const otRow = ws.getRow(currentRow)
            otRow.height = 16
            // Empty static cols
            for (const col of [1, 2, 3, 5]) {
              const cell = ws.getCell(currentRow, col)
              cell.value = ''
              cell.border = allBorders()
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
            }
            // Name cell showing "- Tăng ca"
            const otNameCell = ws.getCell(currentRow, 4)
            otNameCell.value = '- Tăng ca'
            otNameCell.font = { ...dataFont, italic: true, size: 10, color: { argb: 'FF555555' } }
            otNameCell.alignment = leftAlign()
            otNameCell.border = allBorders()
            otNameCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }

            for (let d = 1; d <= daysInMonth; d++) {
              const col = dayStartCol + d - 1
              const cell = ws.getCell(currentRow, col)
              const ot = overtimeDayMap.get(d)
              cell.value = ot ? ot : ''
              cell.font = { ...dataFont, color: { argb: 'FF16A34A' }, size: 10 }
              cell.alignment = centerAlign()
              cell.border = allBorders()
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
            }
            // Summary cols for OT row
            for (const col of [colCongChinh, colTongCongChinh, colTangCa, colChuNhat, colTangCaChuNhat]) {
              const cell = ws.getCell(currentRow, col)
              cell.value = ''
              cell.border = allBorders()
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
            }
            ws.getCell(currentRow, colGhiChu).value = ''
            ws.getCell(currentRow, colGhiChu).border = allBorders()
            ws.getCell(currentRow, colGhiChu).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
            currentRow++
          }
        }

        // ── Department total row ──
        const totRow = ws.getRow(currentRow)
        totRow.height = 20
        ws.mergeCells(currentRow, 1, currentRow, 5)
        const totLabelCell = ws.getCell(currentRow, 1)
        totLabelCell.value = 'TỔNG CỘNG'
        totLabelCell.font = { ...headerFont, bold: true }
        totLabelCell.alignment = centerAlign()
        totLabelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }
        totLabelCell.border = allBorders()
        for (let d = 1; d <= daysInMonth; d++) {
          const cell = ws.getCell(currentRow, dayStartCol + d - 1)
          cell.value = ''
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }
          cell.border = allBorders()
        }
        const setTotCell = (col: number, val: any) => {
          const cell = ws.getCell(currentRow, col)
          cell.value = val
          cell.font = { ...headerFont, bold: true }
          cell.alignment = centerAlign()
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }
          cell.border = allBorders()
        }
        setTotCell(colCongChinh, deptTotalCong)
        setTotCell(colTongCongChinh, deptTotalCong)
        setTotCell(colTangCa, deptTotalGio)
        setTotCell(colChuNhat, deptTotalSun)
        setTotCell(colTangCaChuNhat, deptTotalSunOT)
        setTotCell(colGhiChu, '')
        currentRow++

        // spacing row between departments
        currentRow++
      }


      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      saveAs(blob, `BangChamCong_T${month}_${year}.xlsx`)
      showToast('Xuất Excel theo tháng thành công!', 'ok')
      setIsMonthlyExportOpen(false)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Lỗi không xác định'
      showToast('Lỗi xuất Excel: ' + msg, 'err')
    } finally {
      setIsExportingMonthly(false)
    }
  }

  const handleExportExcelRaw = async () => {
    if (rows.length === 0) {
      showToast('Không có dữ liệu để xuất!', 'err')
      return
    }

    try {
      showToast('Đang tải dữ liệu để xuất...', 'ok')

      const queryParams: DailySummaryParams = {
        page: 1,
        pageSize: 1000,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        ...(filters.departmentCode ? { departmentCode: filters.departmentCode } : {}),
        ...(filters.employeeCode ? { employeeCode: filters.employeeCode } : {})
      }

      const firstPage = await attendanceApi.getDailySummary(queryParams)
      let allRows = firstPage.items ?? []
      if (firstPage.totalPages > 1) {
        for (let p = 2; p <= firstPage.totalPages; p++) {
          const res = await attendanceApi.getDailySummary({ ...queryParams, page: p })
          allRows = allRows.concat(res.items ?? [])
        }
      }

      if (allRows.length === 0) {
        showToast('Không có dữ liệu để xuất!', 'err')
        return
      }

      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('BangChamCong')

      // 1. Tiêu đề chính
      worksheet.mergeCells('A1:J1')
      const titleCell = worksheet.getCell('A1')
      titleCell.value = 'BẢNG TỔNG HỢP CHẤM CÔNG'
      titleCell.font = { name: 'Cambria', size: 18, bold: true, color: { argb: 'FFC06252' } }
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
      worksheet.getRow(1).height = 40

      // 2. Tiêu đề thời gian
      worksheet.mergeCells('A2:J2')
      const dateCell = worksheet.getCell('A2')
      dateCell.value = `Từ ngày: ${fmtDate(filters.fromDate)}  -  Đến ngày: ${fmtDate(filters.toDate)}`
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
      allRows.forEach((row, idx) => {
        const addedRow = worksheet.addRow([
          idx + 1,
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
      saveAs(blob, `ChamCong_${filters.fromDate}_${filters.toDate}.xlsx`)
      showToast('Xuất Excel dữ liệu thô thành công!', 'ok')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      showToast('Lỗi xuất Excel: ' + msg, 'err')
    }
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
      <AppSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        logout={logout}
        deptTreeOpen={deptTreeOpen}
        setDeptTreeOpen={setDeptTreeOpen}
        selectedDeptCode={selectedDeptCode}
        handleSelectDept={handleSelectDept}
        areaTree={areaTree}
        expandedAreas={expandedAreas}
        toggleAreaExpand={toggleAreaExpand}
        selectedExportDepts={selectedExportDepts}
        setSelectedExportDepts={setSelectedExportDepts}
      />

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
          <FilterPanel
            filterDraft={filterDraft}
            setFilterDraft={setFilterDraft}
            employees={employees}
            departments={departments}
            applyFilters={applyFilters}
            clearFilters={clearFilters}
          />

          <AttendanceTable
            rows={rows}
            isLoadingData={isLoadingData}
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
            totalItems={totalItems}
            totalPages={totalPages}
            departments={departments}
            setSelectedRow={setSelectedRow}
            isExportMenuOpen={isExportMenuOpen}
            setIsExportMenuOpen={setIsExportMenuOpen}
            handleExportExcelRaw={handleExportExcelRaw}
            handleExportExcelStatistics={handleExportExcelStatistics}
            setIsMonthlyExportOpen={setIsMonthlyExportOpen}
            user={user}
            setIsBulkAddOpen={setIsBulkAddOpen}
            fetchData={() => fetchData(page, filters)}
          />
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

      {/* ═══════════ MONTHLY EXPORT MODAL ═══════════ */}
      {isMonthlyExportOpen && (
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

            <div style={{ marginBottom: 20 }}>
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

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 600, color: C.textSub, marginBottom: 8 }}>
                <span>Phòng ban (có thể chọn nhiều)</span>
                {selectedExportDepts.length > 0 && (
                  <span
                    onClick={() => setSelectedExportDepts([])}
                    style={{ fontSize: 12, color: '#3b82f6', cursor: 'pointer', fontWeight: 500 }}
                  >
                    Bỏ chọn tất cả
                  </span>
                )}
              </label>
              <div style={{
                maxHeight: 180, overflowY: 'auto', border: `1.5px solid ${C.border}`, borderRadius: 8, padding: '4px 0', background: '#f8fafc'
              }}>
                {departments
                  .filter(d => selectedExportDepts.includes(d.departmentCode))
                  .map(d => (
                    <label key={d.departmentCode} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <input
                        type="checkbox"
                        checked={selectedExportDepts.includes(d.departmentCode)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedExportDepts(prev => [...prev, d.departmentCode])
                          else setSelectedExportDepts(prev => prev.filter(c => c !== d.departmentCode))
                        }}
                        style={{ cursor: 'pointer', width: 16, height: 16, accentColor: '#16a34a' }}
                      />
                      <span style={{ fontSize: 14, color: C.textMain }}>{d.departmentName}</span>
                    </label>
                  ))}
              </div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6, fontStyle: 'italic' }}>
                * Để trống nếu muốn xuất tất cả phòng ban
              </div>
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


/* ─────────────────── Dept Tree Node ────────────────── */

type DeptNodeType = DepartmentItem & { children: DeptNodeType[] }

interface DeptTreeNodeProps {
  node: DeptNodeType
  depth: number
  selectedCode: string
  expandedCodes: Set<string>
  onSelect: (code: string) => void
  onToggle: (code: string) => void
}

const DeptTreeNode = ({ node, depth, selectedCode, expandedCodes, onSelect, onToggle }: DeptTreeNodeProps) => {
  const isSelected = selectedCode === node.departmentCode
  const isExpanded = expandedCodes.has(node.departmentCode)
  const hasChildren = node.children.length > 0
  const indentPx = 24 + depth * 14

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: `7px 12px 7px ${indentPx}px`,
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 13,
          color: isSelected ? '#fff' : 'rgba(255,255,255,0.80)',
          background: isSelected ? 'rgba(255,255,255,0.14)' : 'transparent',
          transition: 'background 0.15s',
          fontWeight: isSelected ? 600 : 400,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}
        onClick={() => {
          onSelect(node.departmentCode)
          if (hasChildren) onToggle(node.departmentCode)
        }}
        title={node.departmentName}
      >
        {hasChildren ? (
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 14,
              flexShrink: 0,
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              color: isSelected ? '#fff' : 'rgba(255,255,255,0.6)',
            }}
            onClick={(e) => { e.stopPropagation(); onToggle(node.departmentCode) }}
          >
            chevron_right
          </span>
        ) : (
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 13, flexShrink: 0, color: isSelected ? '#fff' : 'rgba(255,255,255,0.4)' }}
          >
            fiber_manual_record
          </span>
        )}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.departmentName}</span>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map(child => (
            <DeptTreeNode
              key={child.departmentCode}
              node={child}
              depth={depth + 1}
              selectedCode={selectedCode}
              expandedCodes={expandedCodes}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}




export default AttendancePage
