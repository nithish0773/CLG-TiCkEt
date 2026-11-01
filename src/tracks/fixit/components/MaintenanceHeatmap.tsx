import { useNavigate } from 'react-router'
import type { Ticket } from '@/core'
import { Badge } from '@/ui'
import styles from './CommandCenterComponents.module.css'

export interface MaintenanceHeatmapProps {
  tickets: Ticket[]
}

const CAMPUS_BUILDINGS = [
  { name: 'Aryabhata Engineering Block', code: 'AEB', type: 'Academic / Labs' },
  { name: 'Visvesvaraya Central Lab', code: 'VCL', type: 'Research / Workshops' },
  { name: 'Ramanujan Science Tower', code: 'RST', type: 'Sciences / Cleanrooms' },
  { name: 'Kalam Innovation Hub', code: 'KIH', type: 'Incubation / Tech' },
  { name: 'Main Administrative Block', code: 'MAB', type: 'Offices / Registry' },
  { name: 'Campus Central Library', code: 'CCL', type: 'Study / Digital Media' },
  { name: 'Student Activities Center', code: 'SAC', type: 'Recreation / Clubs' },
  { name: 'Campus Hostel Complex - Block A', code: 'HA', type: 'Residential' },
  { name: 'Campus Hostel Complex - Block B', code: 'HB', type: 'Residential' },
  { name: 'Sports & Recreation Arena', code: 'SRA', type: 'Athletics / Gym' },
]

export function MaintenanceHeatmap({ tickets }: MaintenanceHeatmapProps) {
  const navigate = useNavigate()

  // Calculate building stats
  const statsByBuilding = CAMPUS_BUILDINGS.map((b) => {
    const buildingTickets = tickets.filter((t) => t.building === b.name)
    const openTickets = buildingTickets.filter((t) => t.status === 'open')
    const overdueTickets = buildingTickets.filter((t) => t.is_overdue)
    return {
      ...b,
      total: buildingTickets.length,
      open: openTickets.length,
      overdue: overdueTickets.length,
    }
  })

  return (
    <div className={styles.panel} style={{ marginBottom: 'var(--space-6)' }}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <span aria-hidden="true">🗺️</span>
          <span>Campus Infrastructure Maintenance Heatmap</span>
        </div>
        <button
          type="button"
          className={styles.panelAction}
          onClick={() => navigate('/tracks/fixit/map')}
        >
          Open interactive campus map →
        </button>
      </div>

      <div className={styles.panelBody}>
        <div className={styles.heatmapGrid}>
          {statsByBuilding.map((item) => {
            const intensityClass =
              item.open >= 3
                ? styles.heatmapHigh
                : item.open >= 1
                ? styles.heatmapMedium
                : styles.heatmapLow

            return (
              <div
                key={item.name}
                className={[styles.heatmapCell, intensityClass].join(' ')}
                onClick={() => navigate(`/tracks/fixit/map?building=${encodeURIComponent(item.name)}`)}
                title={`Click to inspect ${item.name} details`}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    {item.code}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                    {item.type}
                  </span>
                </div>

                <div className={styles.heatmapBuildingName}>{item.name}</div>

                <div className={styles.heatmapBadgeRow}>
                  <Badge
                    size="sm"
                    tone={item.open > 0 ? (item.overdue > 0 ? 'danger' : 'warning') : 'success'}
                  >
                    {item.open} {item.open === 1 ? 'Open' : 'Open'}
                  </Badge>

                  {item.overdue > 0 ? (
                    <span style={{ fontSize: 11, color: 'var(--color-danger)', fontWeight: 'bold' }}>
                      ⚠️ {item.overdue} late
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {item.total} total
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

