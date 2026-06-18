import React from 'react'
import logo6 from '@/assets/Image/logo6.png'
import { C, s } from '@/styles/attendance.styles'
import type { DepartmentItem, AreaInfo } from '@/services/api'

export interface AreaNode {
  area: AreaInfo
  departments: DepartmentItem[]
}

interface AppSidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (val: boolean) => void
  user: any
  logout: () => void
  deptTreeOpen: boolean
  setDeptTreeOpen: React.Dispatch<React.SetStateAction<boolean>>
  selectedDeptCode: string
  handleSelectDept: (code: string) => void
  areaTree: AreaNode[]
  expandedAreas: Set<string>
  toggleAreaExpand: (code: string) => void
  selectedExportDepts?: string[]
  setSelectedExportDepts?: React.Dispatch<React.SetStateAction<string[]>>
}

const AppSidebar: React.FC<AppSidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  user,
  logout,
  deptTreeOpen,
  setDeptTreeOpen,
  selectedDeptCode,
  handleSelectDept,
  areaTree,
  expandedAreas,
  toggleAreaExpand,
  selectedExportDepts = [],
  setSelectedExportDepts,
}) => {
  return (
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
        <div
          onClick={() => {
            setDeptTreeOpen(false)
            handleSelectDept('') // clear selection if any
          }}
          style={{
            ...s.navItem,
            background: (!deptTreeOpen && !selectedDeptCode) ? C.sidebarActive : 'transparent',
          }}
        >
          <span className="material-symbols-outlined" style={{ ...s.navIcon, color: (!deptTreeOpen && !selectedDeptCode) ? '#fff' : C.sidebarText }}>
            event_note
          </span>
          {sidebarOpen && (
            <span style={{ color: (!deptTreeOpen && !selectedDeptCode) ? '#fff' : C.sidebarText, fontSize: 14, fontWeight: (!deptTreeOpen && !selectedDeptCode) ? 500 : 400 }}>
              Chấm công
            </span>
          )}
        </div>

        {/* ── Department Tree ── */}
        <div style={{ marginTop: 8 }}>
          {/* Section header */}
          <div
            onClick={() => sidebarOpen && setDeptTreeOpen(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 10,
              cursor: 'pointer',
              transition: 'background 0.15s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              background: (deptTreeOpen || selectedDeptCode) ? C.sidebarActive : 'transparent',
            }}
            title={!sidebarOpen ? 'Phòng ban' : undefined}
          >
            <span
              className="material-symbols-outlined"
              style={{ ...s.navIcon, color: (deptTreeOpen || selectedDeptCode) ? '#fff' : C.sidebarText, flexShrink: 0 }}
            >
              corporate_fare
            </span>
            {sidebarOpen && (
              <>
                <span style={{ color: (deptTreeOpen || selectedDeptCode) ? '#fff' : C.sidebarText, fontSize: 14, fontWeight: (deptTreeOpen || selectedDeptCode) ? 500 : 400, flex: 1 }}>
                  Phòng ban
                </span>
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 18,
                    color: (deptTreeOpen || selectedDeptCode) ? '#fff' : C.sidebarText,
                    transform: deptTreeOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}
                >
                  expand_more
                </span>
              </>
            )}
          </div>

          {sidebarOpen && deptTreeOpen && (
            <div style={{ marginTop: 4, overflow: 'hidden' }}>

              {/* ── Tất cả ── */}


              {/* ── Area groups ── */}
              {areaTree.map((areaNode) => {
                const isAreaExpanded = expandedAreas.has(areaNode.area.areaCode)
                const hasActiveChild = areaNode.departments.some(d => selectedExportDepts.includes(d.departmentCode))

                // Calculate selection state for export
                const deptCodes = areaNode.departments.map(d => d.departmentCode)
                const selectedCount = deptCodes.filter(c => selectedExportDepts.includes(c)).length
                const isAllSelected = deptCodes.length > 0 && selectedCount === deptCodes.length
                const isPartial = selectedCount > 0 && selectedCount < deptCodes.length

                return (
                  <div key={areaNode.area.areaCode} style={{ marginBottom: 4 }}>
                    {/* Area header */}
                    <div
                      onClick={() => toggleAreaExpand(areaNode.area.areaCode)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        padding: '7px 10px 7px 12px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        background: hasActiveChild
                          ? 'rgba(255,255,255,0.12)'
                          : isAreaExpanded
                            ? 'rgba(255,255,255,0.06)'
                            : 'transparent',
                        boxShadow: hasActiveChild ? 'inset 0 0 0 1px rgba(255,255,255,0.15)' : 'none',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                      }}
                      title={areaNode.area.areaName}
                    >
                      {/* Collapse arrow */}
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: 15,
                          flexShrink: 0,
                          color: hasActiveChild ? '#ffe082' : 'rgba(255,255,255,0.45)',
                          transform: isAreaExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.22s cubic-bezier(.4,0,.2,1)',
                        }}
                      >
                        chevron_right
                      </span>

                      {/* Custom Checkbox for Area export selection */}
                      {setSelectedExportDepts && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            if (isAllSelected) {
                              // Unselect all in this area
                              setSelectedExportDepts(prev => prev.filter(c => !deptCodes.includes(c)))
                            } else {
                              // Select all in this area
                              setSelectedExportDepts(prev => {
                                const set = new Set([...prev, ...deptCodes])
                                return Array.from(set)
                              })
                            }
                          }}
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 4,
                            border: (isAllSelected || isPartial) ? 'none' : '1.5px solid rgba(255,255,255,0.4)',
                            background: (isAllSelected || isPartial) ? '#ffe082' : 'rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            marginRight: 4
                          }}
                        >
                          {isAllSelected && (
                            <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#0f172a', fontWeight: 900 }}>check</span>
                          )}
                          {isPartial && (
                            <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#0f172a', fontWeight: 900 }}>remove</span>
                          )}
                        </div>
                      )}

                      {/* Area icon box */}
                      {!setSelectedExportDepts && (
                        <span style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: hasActiveChild ? 'rgba(255,224,130,0.25)' : 'rgba(255,255,255,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'background 0.15s',
                        }}>
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 12, color: hasActiveChild ? '#ffe082' : 'rgba(255,255,255,0.55)' }}
                          >
                            domain
                          </span>
                        </span>
                      )}

                      {/* Area name */}
                      <span style={{
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        color: hasActiveChild ? '#fff' : 'rgba(255,255,255,0.70)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        flex: 1,
                        textTransform: 'uppercase',
                      }}>
                        {areaNode.area.areaName}
                      </span>

                      {/* Badge count */}
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        minWidth: 18,
                        height: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 9,
                        background: hasActiveChild ? 'rgba(255,224,130,0.3)' : 'rgba(255,255,255,0.12)',
                        color: hasActiveChild ? '#ffe082' : 'rgba(255,255,255,0.55)',
                        flexShrink: 0,
                        padding: '0 5px',
                      }}>
                        {areaNode.departments.length}
                      </span>
                    </div>

                    {/* Department children */}
                    {isAreaExpanded && (
                      <div style={{
                        marginLeft: 14,
                        marginTop: 2,
                        paddingLeft: 10,
                        borderLeft: '1.5px solid rgba(255,255,255,0.10)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                      }}>
                        {areaNode.departments.map(dept => {
                          const isSelected = selectedExportDepts.includes(dept.departmentCode)
                          return (
                            <div
                              key={dept.departmentCode}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '7px 10px',
                                borderRadius: 8,
                                cursor: 'pointer',
                                fontSize: 13,
                                color: isSelected ? '#fff' : 'rgba(255,255,255,0.72)',
                                background: isSelected ? 'rgba(255,255,255,0.16)' : 'transparent',
                                transition: 'all 0.15s',
                                fontWeight: isSelected ? 600 : 400,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                boxShadow: isSelected ? 'inset 3px 0 0 #ffe082' : 'none',
                              }}
                            >
                              {/* Custom Checkbox for export selection */}
                              {setSelectedExportDepts && (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const isChecked = selectedExportDepts.includes(dept.departmentCode)
                                    if (isChecked) setSelectedExportDepts(prev => prev.filter(c => c !== dept.departmentCode))
                                    else setSelectedExportDepts(prev => [...prev, dept.departmentCode])
                                  }}
                                  style={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: 4,
                                    border: selectedExportDepts.includes(dept.departmentCode) ? 'none' : '1.5px solid rgba(255,255,255,0.4)',
                                    background: selectedExportDepts.includes(dept.departmentCode) ? '#ffe082' : 'rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s'
                                  }}
                                >
                                  {selectedExportDepts.includes(dept.departmentCode) && (
                                    <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#0f172a', fontWeight: 900 }}>check</span>
                                  )}
                                </div>
                              )}

                              <div
                                onClick={() => handleSelectDept(dept.departmentCode)}
                                title={dept.departmentName}
                                style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}
                              >
                                {/* Accent dot */}
                                {!setSelectedExportDepts && (
                                  <span style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    background: isSelected ? '#ffe082' : 'rgba(255,255,255,0.25)',
                                    flexShrink: 0,
                                    transition: 'background 0.15s',
                                  }} />
                                )}
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {dept.departmentName}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
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
  )
}

export default AppSidebar
