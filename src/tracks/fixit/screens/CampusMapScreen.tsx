import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { listTickets, type Ticket } from '@/core'
import { Button, Badge, Spinner } from '@/ui'
import styles from './CampusMapScreen.module.css'

interface BuildingNode {
  id: string
  name: string
  code: string
  zone: string
  type: 'academic' | 'lab' | 'admin' | 'residential' | 'sports'
  x: number
  y: number
  width: number
  height: number
  floors: number
  departments: string[]
}

const BUILDINGS: BuildingNode[] = [
  {
    id: 'b-1',
    name: 'Aryabhata Engineering Block',
    code: 'AEB',
    zone: 'North Academic Quad',
    type: 'academic',
    x: 80,
    y: 60,
    width: 170,
    height: 110,
    floors: 5,
    departments: ['Computer Science', 'Information Science', 'AI & Machine Learning'],
  },
  {
    id: 'b-2',
    name: 'Visvesvaraya Central Lab',
    code: 'VCL',
    zone: 'East Research Sector',
    type: 'lab',
    x: 320,
    y: 60,
    width: 170,
    height: 110,
    floors: 4,
    departments: ['Heavy Mechanics', 'Hydraulics', 'Robotics Testing'],
  },
  {
    id: 'b-3',
    name: 'Ramanujan Science Tower',
    code: 'RST',
    zone: 'Northeast Science Park',
    type: 'lab',
    x: 560,
    y: 70,
    width: 150,
    height: 130,
    floors: 7,
    departments: ['Applied Physics', 'Spectroscopy', 'Nanotech'],
  },
  {
    id: 'b-4',
    name: 'Kalam Innovation Hub',
    code: 'KIH',
    zone: 'Innovation Corridor',
    type: 'academic',
    x: 80,
    y: 220,
    width: 160,
    height: 100,
    floors: 4,
    departments: ['Startups Incubator', 'Design Studio', 'IoT Sandbox'],
  },
  {
    id: 'b-5',
    name: 'Main Administrative Block',
    code: 'MAB',
    zone: 'Central Plaza',
    type: 'admin',
    x: 310,
    y: 210,
    width: 190,
    height: 120,
    floors: 3,
    departments: ['Chancellor Office', 'Registrar', 'Student Affairs', 'Finance'],
  },
  {
    id: 'b-6',
    name: 'Campus Central Library',
    code: 'CCL',
    zone: 'Academic Oval',
    type: 'academic',
    x: 560,
    y: 240,
    width: 150,
    height: 110,
    floors: 4,
    departments: ['Archives', 'Digital Learning Hub', 'Periodicals'],
  },
  {
    id: 'b-7',
    name: 'Student Activities Center',
    code: 'SAC',
    zone: 'South Campus Quad',
    type: 'academic',
    x: 100,
    y: 370,
    width: 150,
    height: 90,
    floors: 2,
    departments: ['Student Council', 'Auditorium', 'Cultural Clubs'],
  },
  {
    id: 'b-8',
    name: 'Campus Hostel Complex - Block A',
    code: 'HA',
    zone: 'West Residential Enclave',
    type: 'residential',
    x: 300,
    y: 370,
    width: 100,
    height: 100,
    floors: 6,
    departments: ['Senior Residence', 'Dining Hall A'],
  },
  {
    id: 'b-9',
    name: 'Campus Hostel Complex - Block B',
    code: 'HB',
    zone: 'West Residential Enclave',
    type: 'residential',
    x: 430,
    y: 370,
    width: 100,
    height: 100,
    floors: 6,
    departments: ['Junior Residence', 'Dining Hall B'],
  },
  {
    id: 'b-10',
    name: 'Sports & Recreation Arena',
    code: 'SRA',
    zone: 'Southfields',
    type: 'sports',
    x: 580,
    y: 390,
    width: 140,
    height: 80,
    floors: 2,
    departments: ['Indoor Gymnasium', 'Aquatics Center', 'Physical Ed'],
  },
]

export function CampusMapScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBuildingName, setSelectedBuildingName] = useState<string>(
    searchParams.get('building') || BUILDINGS[0].name,
  )
  const [typeFilter, setTypeFilter] = useState<'all' | 'academic' | 'lab' | 'residential'>('all')

  useEffect(() => {
    listTickets()
      .then(setTickets)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const selectedBuilding = BUILDINGS.find((b) => b.name === selectedBuildingName) || BUILDINGS[0]
  const buildingTickets = tickets.filter((t) => t.building === selectedBuilding.name)
  const openCount = buildingTickets.filter((t) => t.status === 'open').length
  const overdueCount = buildingTickets.filter((t) => t.is_overdue).length

  // Category breakdown for selected building
  const categoryCounts: Record<string, number> = {}
  for (const t of buildingTickets) {
    categoryCounts[t.issue_type] = (categoryCounts[t.issue_type] || 0) + 1
  }

  const filteredBuildings = BUILDINGS.filter((b) => {
    if (typeFilter === 'all') return true
    if (typeFilter === 'academic') return b.type === 'academic' || b.type === 'admin'
    if (typeFilter === 'lab') return b.type === 'lab'
    if (typeFilter === 'residential') return b.type === 'residential' || b.type === 'sports'
    return true
  })

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.heading}>Interactive Campus Intelligence Map</h1>
          <p className={styles.subheading}>
            Geospatial visualization of campus facilities, building maintenance intensity, and real-time incident density.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            variant="primary"
            onClick={() => navigate('/tracks/fixit/raise')}
          >
            ➕ Raise Issue
          </Button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 'var(--space-8)', display: 'flex', justifyContent: 'center' }}>
          <Spinner label="Rendering campus telemetry map..." />
        </div>
      ) : (
        <div className={styles.mapLayout}>
          {/* SVG Map Card */}
          <div className={styles.mapCard}>
            <div className={styles.mapControls}>
              <div className={styles.filterBtns}>
                <button
                  type="button"
                  className={[styles.filterBtn, typeFilter === 'all' && styles.filterBtnActive].filter(Boolean).join(' ')}
                  onClick={() => setTypeFilter('all')}
                >
                  All Campus Buildings
                </button>
                <button
                  type="button"
                  className={[styles.filterBtn, typeFilter === 'academic' && styles.filterBtnActive].filter(Boolean).join(' ')}
                  onClick={() => setTypeFilter('academic')}
                >
                  Academic &amp; Admin
                </button>
                <button
                  type="button"
                  className={[styles.filterBtn, typeFilter === 'lab' && styles.filterBtnActive].filter(Boolean).join(' ')}
                  onClick={() => setTypeFilter('lab')}
                >
                  Research Labs
                </button>
                <button
                  type="button"
                  className={[styles.filterBtn, typeFilter === 'residential' && styles.filterBtnActive].filter(Boolean).join(' ')}
                  onClick={() => setTypeFilter('residential')}
                >
                  Residential &amp; Sports
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--color-text-muted)' }}>
                <span>🟢 0-1 Open</span>
                <span>🟠 2-3 Open</span>
                <span>🔴 4+ Open / Overdue</span>
              </div>
            </div>

            {/* Architectural Campus Map SVG */}
            <div className={styles.mapSvgWrapper}>
              <svg width="100%" height="100%" viewBox="0 0 800 520" style={{ display: 'block', width: '100%', height: '100%' }}>
                <defs>
                  <pattern id="campusGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M 24 0 L 0 0 0 24" fill="none" stroke="var(--color-border)" strokeWidth="0.8" strokeOpacity="0.4" />
                  </pattern>
                </defs>

                {/* Base Grid */}
                <rect width="800" height="520" fill="url(#campusGrid)" />

                {/* Roadways / Pathways */}
                <path d="M 40 180 L 760 180" stroke="var(--color-border)" strokeWidth="18" strokeLinecap="round" strokeOpacity="0.6" fill="none" />
                <path d="M 40 340 L 760 340" stroke="var(--color-border)" strokeWidth="14" strokeLinecap="round" strokeOpacity="0.6" fill="none" />
                <path d="M 270 40 L 270 480" stroke="var(--color-border)" strokeWidth="16" strokeLinecap="round" strokeOpacity="0.6" fill="none" />
                <path d="M 525 40 L 525 480" stroke="var(--color-border)" strokeWidth="16" strokeLinecap="round" strokeOpacity="0.6" fill="none" />

                {/* Central Plaza Roundabout */}
                <circle cx="400" cy="260" r="45" fill="var(--color-surface)" stroke="var(--color-border)" strokeWidth="3" />
                <circle cx="400" cy="260" r="14" fill="var(--color-primary-subtle)" stroke="var(--color-primary)" strokeWidth="1.5" />

                {/* Building Blocks */}
                {filteredBuildings.map((b) => {
                  const bTickets = tickets.filter((t) => t.building === b.name)
                  const bOpen = bTickets.filter((t) => t.status === 'open').length
                  const bOverdue = bTickets.filter((t) => t.is_overdue).length
                  const isSelected = selectedBuilding.id === b.id

                  const fillColor = isSelected
                    ? 'var(--color-primary-subtle)'
                    : 'var(--color-surface)'
                  const strokeColor = isSelected
                    ? 'var(--color-primary)'
                    : bOverdue > 0
                    ? 'var(--color-danger)'
                    : bOpen >= 2
                    ? 'var(--amber-500)'
                    : 'var(--color-border)'

                  const badgeColor =
                    bOverdue > 0 ? '#EF4444' : bOpen >= 2 ? '#F59E0B' : '#16A36A'

                  return (
                    <g
                      key={b.id}
                      onClick={() => setSelectedBuildingName(b.name)}
                      style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      {/* Building footprint shadow */}
                      <rect
                        x={b.x + 3}
                        y={b.y + 3}
                        width={b.width}
                        height={b.height}
                        rx="8"
                        fill="rgba(0, 0, 0, 0.08)"
                      />

                      {/* Building card */}
                      <rect
                        x={b.x}
                        y={b.y}
                        width={b.width}
                        height={b.height}
                        rx="8"
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={isSelected ? 3 : 1.5}
                      />

                      {/* Header bar */}
                      <rect
                        x={b.x}
                        y={b.y}
                        width={b.width}
                        height="24"
                        rx="8"
                        fill={isSelected ? 'var(--color-primary)' : 'var(--color-surface-muted)'}
                      />

                      {/* Code label */}
                      <text
                        x={b.x + 8}
                        y={b.y + 16}
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="var(--font-mono)"
                        fill={isSelected ? 'white' : 'var(--color-primary)'}
                      >
                        {b.code}
                      </text>

                      {/* Floor count */}
                      <text
                        x={b.x + b.width - 8}
                        y={b.y + 16}
                        textAnchor="end"
                        fontSize="10"
                        fill={isSelected ? 'rgba(255, 255, 255, 0.8)' : 'var(--color-text-muted)'}
                      >
                        G+{b.floors}
                      </text>

                      {/* Building Name */}
                      <text
                        x={b.x + 10}
                        y={b.y + 44}
                        fontSize="11"
                        fontWeight="600"
                        fill="var(--color-text)"
                      >
                        {b.name.split(' ')[0]}
                      </text>
                      <text
                        x={b.x + 10}
                        y={b.y + 58}
                        fontSize="10"
                        fill="var(--color-text-muted)"
                      >
                        {b.name.split(' ').slice(1).join(' ')}
                      </text>

                      {/* Issue Count Badge */}
                      <circle
                        cx={b.x + b.width - 18}
                        cy={b.y + b.height - 18}
                        r="12"
                        fill={badgeColor}
                      />
                      <text
                        x={b.x + b.width - 18}
                        y={b.y + b.height - 14}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="bold"
                        fill="white"
                      >
                        {bOpen}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>

          {/* Selected Building Intelligence Sidebar */}
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarHeader}>
              <div>
                <Badge tone="primary" size="sm">
                  {selectedBuilding.code} • {selectedBuilding.zone}
                </Badge>
                <h2 className={styles.buildingTitle}>{selectedBuilding.name}</h2>
                <p className={styles.buildingSubtitle}>
                  {selectedBuilding.floors} Floors • {selectedBuilding.departments.join(', ')}
                </p>
              </div>

              <Badge
                size="md"
                tone={overdueCount > 0 ? 'danger' : openCount > 0 ? 'warning' : 'success'}
              >
                {openCount} Active Faults
              </Badge>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div style={{ padding: 'var(--space-3)', background: 'var(--color-surface-muted)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Total Tickets</div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{buildingTickets.length}</div>
              </div>
              <div style={{ padding: 'var(--space-3)', background: 'var(--color-surface-muted)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Overdue Count</div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: overdueCount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                  {overdueCount}
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8 }}>
                Category Breakdown
              </div>
              {Object.keys(categoryCounts).length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>No issues registered in this facility.</div>
              ) : (
                <div className={styles.categoryBreakdown}>
                  {Object.entries(categoryCounts).map(([cat, count]) => (
                    <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'var(--color-text)' }}>{cat}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Related Tickets */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span>Facility Incidents</span>
                <span style={{ fontSize: 11 }}>{buildingTickets.length} items</span>
              </div>

              {buildingTickets.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', padding: 'var(--space-3)', background: 'var(--color-surface-muted)', borderRadius: 'var(--radius-sm)' }}>
                  All systems operating normally in this building.
                </div>
              ) : (
                <div className={styles.relatedTicketsList}>
                  {buildingTickets.map((t) => (
                    <div
                      key={t.id}
                      className={styles.relatedTicketItem}
                      onClick={() => navigate(`/tracks/fixit/tickets/${t.id}`)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontSize: 11, color: 'var(--color-primary)' }}>
                          {t.id}
                        </span>
                        <Badge
                          size="sm"
                          tone={t.status === 'resolved' ? 'success' : t.status === 'acknowledged' ? 'primary' : 'warning'}
                        >
                          {t.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {t.issue_type} • {t.location || 'General'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Action Button */}
            <div style={{ marginTop: 'auto', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
              <Button
                variant="primary"
                fullWidth
                onClick={() => navigate(`/tracks/fixit/raise?building=${encodeURIComponent(selectedBuilding.name)}`)}
              >
                ➕ Raise Issue in {selectedBuilding.code}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

