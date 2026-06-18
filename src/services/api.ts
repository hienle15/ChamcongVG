/* ─────────────────────────────────────────────────────────────────────────
   api.ts  –  Centralized API service for ChamcongVG
   All calls go through this module. Token is read from localStorage.
───────────────────────────────────────────────────────────────────────── */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://172.23.13.54:8080'

/* ── Token helpers ── */
export const getToken = (): string | null => localStorage.getItem('accessToken')

const authHeaders = (): Record<string, string> => {
  const token = getToken()
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      window.location.href = '/login'
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    }
    let errMsg = `HTTP ${res.status}`
    try {
      const err = await res.json()
      errMsg = err?.detail ?? err?.title ?? errMsg
    } catch { /* ignore */ }
    throw new Error(errMsg)
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

/* ═══════════════════════════════ AUTH ═══════════════════════════════════ */
export interface LoginRequest {
  username: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  tokenType: string
  expiresAt: string
  userCode: string
  username: string
  displayName: string
  role: string
  permissions: string[]
}

export const authApi = {
  login: (body: LoginRequest) =>
    request<AuthResponse>('POST', '/auth/login', body),

  me: () => request<AuthResponse>('GET', '/auth/me'),
}

/* ═══════════════════════════ ATTENDANCE LOGS ════════════════════════════ */
export interface AttendanceItem {
  id: number
  attendanceCode: number
  employeeCode: string
  employeeName: string
  departmentCode: string
  attendanceDate: string
  attendanceTime: string
  checkType: string
  checkSource: string
  deviceNo: number
  deviceName: string
}

export interface AttendanceListResponse {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  items: AttendanceItem[]
}

export interface AttendanceListParams {
  page?: number
  pageSize?: number
  employeeCode?: string
  departmentCode?: string
  fromDate?: string
  toDate?: string
  checkType?: string
}

export interface AttendanceCreateRequest {
  attendanceCode: number
  attendanceTime: string
  checkType: string
  checkSource: string
  deviceNo: number
  deviceName: string
}

export interface BulkDeleteRequest {
  fromDate?: string
  toDate?: string
  attendanceCode?: number
  employeeCode?: string
  departmentCode?: string
}

export interface DailySummaryItem {
  employeeCode: string
  attendanceCode: number
  employeeName: string
  departmentCode: string
  workDate: string
  weekDayName: string
  shiftCode: string
  shiftName: string
  rawCheckIn: string | null
  rawCheckOut: string | null
  displayCheckOut: string | null
  displayCheckOutType: string | null
  checkIn: string | null
  checkOut: string | null
  shiftStart: string | null
  shiftEnd: string | null
  workHours: number
  isOvertimeAllowedDay: boolean
  note: string | null
}

export interface DailySummaryResponse {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  items: DailySummaryItem[]
}

export interface DailySummaryParams {
  page?: number
  pageSize?: number
  employeeCode?: string
  departmentCode?: string
  attendanceCode?: string
  fromDate: string
  toDate: string
}

export interface AreaInfo {
  areaCode: string
  areaName: string
  companyCode?: string
  areaAddress?: string
  contactPerson?: string
  contactPhone?: string
}

export interface DepartmentItem {
  departmentCode: string
  departmentName: string
  companyCode?: string
  areaCode?: string | null
  parentCode?: string | null
  parentArea?: AreaInfo | null
  [key: string]: any
}

export interface EmployeeLookupItem {
  employeeCode: string
  fullName: string
  departmentCode?: string
  attendanceCode?: number
  [key: string]: any
}

export interface EmployeeInfo {
  employeeCode: string
  attendanceCode: number
  fullName: string
  attendanceName?: string
  cardNo?: string
  departmentCode: string
  departmentName?: string
  areaCode?: string
  companyCode?: string
  positionCode?: string
  startDate?: string
  userEnable?: string
  isTemporaryLeave?: boolean
}

export const lookupApi = {
  getDepartments: () => request<DepartmentItem[]>('GET', '/departments'),
  getEmployees: () => request<EmployeeLookupItem[]>('GET', '/employees/lookup'),
  getEmployeesByDepartment: (params: { departmentCode?: string; departmentCodes?: string[] }) => {
    const qs = new URLSearchParams()
    if (params.departmentCode) qs.set('departmentCode', params.departmentCode)
    if (params.departmentCodes) {
      params.departmentCodes.forEach(code => qs.append('departmentCodes', code))
    }
    const query = qs.toString()
    return request<EmployeeInfo[]>('GET', `/employees/by-department${query ? `?${query}` : ''}`)
  },
}

export const attendanceApi = {
  list: (params: AttendanceListParams = {}) => {
    const qs = new URLSearchParams()
    if (params.page !== undefined) qs.set('page', String(params.page))
    if (params.pageSize !== undefined) qs.set('pageSize', String(params.pageSize))
    if (params.employeeCode) qs.set('employeeCode', params.employeeCode)
    if (params.departmentCode) {
      if (params.departmentCode.includes(',')) {
        params.departmentCode.split(',').forEach(c => qs.append('departmentCode', c))
      } else {
        qs.set('departmentCode', params.departmentCode)
      }
    }
    if (params.fromDate) qs.set('fromDate', params.fromDate)
    if (params.toDate) qs.set('toDate', params.toDate)
    if (params.checkType) qs.set('checkType', params.checkType)
    const query = qs.toString()
    return request<AttendanceListResponse>('GET', `/attendance-logs${query ? `?${query}` : ''}`)
  },

  getDailySummary: (params: DailySummaryParams) => {
    const qs = new URLSearchParams()
    if (params.page !== undefined) qs.set('page', String(params.page))
    if (params.pageSize !== undefined) qs.set('pageSize', String(params.pageSize))
    if (params.employeeCode) qs.set('employeeCode', params.employeeCode)
    if (params.departmentCode) {
      if (params.departmentCode.includes(',')) {
        params.departmentCode.split(',').forEach(c => qs.append('departmentCode', c))
      } else {
        qs.set('departmentCode', params.departmentCode)
      }
    }
    if (params.attendanceCode) qs.set('attendanceCode', params.attendanceCode)
    if (params.fromDate) qs.set('fromDate', params.fromDate)
    if (params.toDate) qs.set('toDate', params.toDate)
    const query = qs.toString()
    return request<DailySummaryResponse>('GET', `/attendance-logs/daily-summary${query ? `?${query}` : ''}`)
  },

  getById: (id: number) =>
    request<AttendanceItem>('GET', `/attendance-logs/${id}`),

  create: (body: AttendanceCreateRequest) =>
    request<AttendanceItem>('POST', '/attendance-logs', body),

  update: (id: number, body: AttendanceCreateRequest) =>
    request<AttendanceItem>('PUT', `/attendance-logs/${id}`, body),

  delete: (id: number) =>
    request<void>('DELETE', `/attendance-logs/${id}`),

  bulkCreate: (items: AttendanceCreateRequest[]) =>
    request<AttendanceItem[]>('POST', '/attendance-logs/bulk', { items }),

  bulkDelete: (body: BulkDeleteRequest) =>
    request<void>('DELETE', '/attendance-logs/bulk', body),

  autoByShift: (body: { attendanceCode: number; workDate: string }) =>
    request<void>('POST', '/attendance-logs/auto-by-shift', body),

  exportDepartmentStatistics: async (params: {
    fromDate: string
    toDate: string
    departmentCode?: string
    employeeCode?: string
    attendanceCode?: number
  }): Promise<Blob> => {
    const qs = new URLSearchParams()
    if (params.fromDate) qs.set('fromDate', params.fromDate)
    if (params.toDate) qs.set('toDate', params.toDate)
    if (params.departmentCode) {
      if (params.departmentCode.includes(',')) {
        params.departmentCode.split(',').forEach(c => qs.append('departmentCode', c))
      } else {
        qs.set('departmentCode', params.departmentCode)
      }
    }
    if (params.employeeCode) qs.set('employeeCode', params.employeeCode)
    if (params.attendanceCode) qs.set('attendanceCode', String(params.attendanceCode))

    const query = qs.toString()
    const url = `${BASE_URL}/attendance-logs/export-department-statistics${query ? `?${query}` : ''}`

    // Get token directly using the same helper
    const token = getToken()
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(url, {
      method: 'GET',
      headers,
    })

    if (!res.ok) {
      let errMsg = `HTTP ${res.status}`
      try {
        const err = await res.json()
        errMsg = err?.detail ?? err?.title ?? errMsg
      } catch { /* ignore */ }
      throw new Error(errMsg)
    }

    return res.blob()
  },
}
