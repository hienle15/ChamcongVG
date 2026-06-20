import React from 'react'
import VGSelectSearch from '@/assets/components/ui/VGSelectSearch'
import { C, s } from '@/styles/attendance.styles'
import { lookupApi, type EmployeeLookupItem, type DepartmentItem } from '@/services/api'

/* ─────────────────── Filter Input Component ─────────────────── */
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

/* ─────────────────── Filter Panel Component ─────────────────── */
interface FilterDraft {
  fromDate: string
  toDate: string
  employeeCode: string
  departmentCode: string
}

interface FilterPanelProps {
  filterDraft: FilterDraft
  setFilterDraft: React.Dispatch<React.SetStateAction<FilterDraft>>
  employees: EmployeeLookupItem[]
  departments: DepartmentItem[]
  applyFilters: () => void
  clearFilters: () => void
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filterDraft,
  setFilterDraft,
  employees,
  departments,
  applyFilters,
  clearFilters,
}) => {
  return (
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
                try {
                  const res = await lookupApi.getEmployees({
                    keyword: kw,
                    departmentCode: filterDraft.departmentCode || undefined,
                    pageSize: 100
                  })
                  const list = Array.isArray(res) ? res : (res as any).items || (res as any).data || []
                  return list.map((e: EmployeeLookupItem) => ({
                    label: `${e.fullName} (${e.employeeCode})`,
                    value: e.employeeCode
                  }))
                } catch (err) {
                  console.error(err)
                  return []
                }
              }}
              getOptionByValue={(val) => {
                const emp = employees.find(e => e.employeeCode === val)
                return emp ? { label: `${emp.fullName} (${emp.employeeCode})`, value: emp.employeeCode } : null
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
  )
}

export default FilterPanel
