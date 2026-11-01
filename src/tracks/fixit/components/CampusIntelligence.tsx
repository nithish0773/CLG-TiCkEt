import { useNavigate } from 'react-router'
import type { Ticket, IssueType } from '@/core'
import styles from './CommandCenterComponents.module.css'

export interface CampusIntelligenceProps {
  tickets: Ticket[]
  categories: IssueType[]
}

const CATEGORY_COLORS: Record<string, string> = {
  'Electrical & Power Systems': '#477BFF',
  'HVAC & Climate Control': '#F59E0B',
  'Plumbing & Hydraulic Infrastructure': '#06B6D4',
  'Structural & Architectural Maintenance': '#8B5CF6',
  'Elevators & Vertical Conveyance': '#EC4899',
  'Network Infrastructure & IoT': '#10B981',
  'Fire Protection & Life Safety': '#EF4444',
}

export function CampusIntelligence({ tickets, categories: _categories }: CampusIntelligenceProps) {
  const navigate = useNavigate()

  // Calculate building distribution
  const buildingCounts: Record<string, number> = {}
  for (const t of tickets) {
    const b = t.building || 'Unspecified Facility'
    buildingCounts[b] = (buildingCounts[b] || 0) + 1
  }

  const sortedBuildings = Object.entries(buildingCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  // Calculate category distribution
  const categoryCounts: Record<string, number> = {}
  for (const t of tickets) {
    const cat = t.issue_type || 'General'
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
  }

  const sortedCategories = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  const total = tickets.length || 1

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <span aria-hidden="true">🧠</span>
          <span>Campus Intelligence</span>
        </div>
        <button
          type="button"
          className={styles.panelAction}
          onClick={() => navigate('/tracks/fixit/analytics')}
        >
          Detailed analytics →
        </button>
      </div>

      <div className={styles.panelBody}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8 }}>
            Category Distribution
          </div>
          <div className={styles.distributionList}>
            {sortedCategories.map(([cat, count]) => {
              const pct = Math.round((count / total) * 100)
              const barColor = CATEGORY_COLORS[cat] || 'var(--color-primary)'
              return (
                <div key={cat} className={styles.distItem}>
                  <div className={styles.distHeader}>
                    <span className={styles.distName}>{cat}</span>
                    <span className={styles.distCount}>{count} ({pct}%)</span>
                  </div>
                  <div className={styles.progressBarBg}>
                    <div
                      className={styles.progressBarFill}
                      style={{ width: `${pct}%`, background: barColor }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8 }}>
            Top Facility Loads
          </div>
          <div className={styles.distributionList}>
            {sortedBuildings.map(([bldg, count]) => {
              const pct = Math.round((count / total) * 100)
              return (
                <div
                  key={bldg}
                  className={styles.distItem}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/tracks/fixit/map?building=${encodeURIComponent(bldg)}`)}
                >
                  <div className={styles.distHeader}>
                    <span className={styles.distName}>{bldg}</span>
                    <span className={styles.distCount}>{count} active</span>
                  </div>
                  <div className={styles.progressBarBg}>
                    <div
                      className={styles.progressBarFill}
                      style={{ width: `${pct}%`, background: 'var(--color-primary)' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
