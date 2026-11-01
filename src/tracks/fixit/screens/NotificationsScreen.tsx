import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button, Badge, EmptyState } from '@/ui'

interface NotificationItem {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  link?: string
  tone: 'primary' | 'warning' | 'success' | 'danger'
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    title: 'High Priority Overdue Alert',
    message: 'TICK-1001: Server Room 302 Chiller Compressor has exceeded committed TAT.',
    time: '12m ago',
    read: false,
    link: '/tracks/fixit/tickets/TICK-1001',
    tone: 'danger',
  },
  {
    id: 'n-2',
    title: 'Resolution Acknowledged',
    message: 'TICK-1005: Library Reading Hall Lighting acknowledged by student reporter.',
    time: '45m ago',
    read: false,
    link: '/tracks/fixit/tickets/TICK-1005',
    tone: 'success',
  },
  {
    id: 'n-3',
    title: 'New Maintenance Dispatch',
    message: 'TICK-1003 assigned to Electrical Operations team for phase harmonization.',
    time: '2h ago',
    read: true,
    link: '/tracks/fixit/tickets/TICK-1003',
    tone: 'primary',
  },
  {
    id: 'n-4',
    title: 'Scheduled Low-Consumption Window',
    message: 'Main waterline maintenance planned for tonight 01:00 - 04:00 at Visvesvaraya Lab.',
    time: '5h ago',
    read: true,
    link: '/tracks/fixit/tickets/TICK-1002',
    tone: 'warning',
  },
]

export function NotificationsScreen() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const unreadCount = notifications.filter((n) => !n.read).length
  const displayed = filter === 'all' ? notifications : notifications.filter((n) => !n.read)

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  function toggleRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)),
    )
  }

  function clearRead() {
    setNotifications((prev) => prev.filter((n) => !n.read))
  }

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: '0 0 4px', color: 'var(--color-text)' }}>
            System Notifications &amp; Alerts
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
            Real-time telemetry dispatches, technician updates, and verification requests.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {unreadCount > 0 && (
            <Button variant="secondary" size="sm" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={clearRead}>
            Clear read
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: '1px solid var(--color-border)',
            background: filter === 'all' ? 'var(--color-primary)' : 'var(--color-surface)',
            color: filter === 'all' ? 'white' : 'var(--color-text)',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 500,
          }}
          onClick={() => setFilter('all')}
        >
          All ({notifications.length})
        </button>

        <button
          type="button"
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: '1px solid var(--color-border)',
            background: filter === 'unread' ? 'var(--color-primary)' : 'var(--color-surface)',
            color: filter === 'unread' ? 'white' : 'var(--color-text)',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 500,
          }}
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        {displayed.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="No Notifications"
            description={filter === 'unread' ? 'All caught up! No unread notifications.' : 'No notifications in your archive.'}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {displayed.map((n) => (
              <div
                key={n.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: 'var(--space-4) var(--space-5)',
                  borderBottom: '1px solid var(--color-border)',
                  background: !n.read ? 'rgba(71, 123, 255, 0.04)' : 'transparent',
                  gap: 12,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  if (n.link) navigate(n.link)
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>
                    {n.tone === 'danger' ? '🔴' : n.tone === 'success' ? '🟢' : n.tone === 'warning' ? '🟠' : '🔵'}
                  </span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontWeight: 'bold', fontSize: 13, color: 'var(--color-text)' }}>
                        {n.title}
                      </span>
                      {!n.read && <Badge tone="primary" size="sm">NEW</Badge>}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.4 }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                      {n.time}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', fontSize: 12, cursor: 'pointer' }}
                    onClick={() => toggleRead(n.id)}
                  >
                    {n.read ? 'Mark unread' : 'Mark read'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

