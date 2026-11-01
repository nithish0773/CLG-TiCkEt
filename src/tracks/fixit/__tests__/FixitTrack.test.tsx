import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoute, screen } from '@/test/render'
import type { IssueType, Ticket } from '@/core'
import track from '../index'

const MOCK_CATEGORIES: IssueType[] = [
  { id: 'cat-elec', name: 'Electrical & Power', description: 'Power failures, wiring, lighting' },
  { id: 'cat-hvac', name: 'HVAC & Climate Control', description: 'AC units, chillers, ventilation' },
  { id: 'cat-plumb', name: 'Plumbing & Water', description: 'Leaks, faucets, drainage' },
]

const MOCK_TICKETS: Ticket[] = [
  {
    id: 'TICK-1001',
    issue_type_id: 'cat-hvac',
    issue_type: 'HVAC & Climate Control',
    building: 'Aryabhata Engineering Block',
    location: 'Server Room 302',
    title: 'Server Room Chiller Compressor Tripping',
    description: 'Compressor unit shuts down under high thermal load.',
    status: 'open',
    reporter: {
      name: 'Kavita Sharma',
      email: 'manager@team1.com',
      role: 'campus_manager',
    },
    has_photo: false,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    expected_completion_date: new Date(Date.now() - 3600000 * 12).toISOString(),
    is_overdue: true,
  },
  {
    id: 'TICK-1002',
    issue_type_id: 'cat-elec',
    issue_type: 'Electrical & Power',
    building: 'Main Administrative Block',
    location: 'Main Auditorium',
    title: 'Stage Dimmer Lighting Rack Malfunction',
    description: 'Channel 4 flickering continuously.',
    status: 'resolved',
    reporter: {
      name: 'Kavita Sharma',
      email: 'manager@team1.com',
      role: 'campus_manager',
    },
    has_photo: false,
    expected_completion_date: null,
    is_overdue: false,
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
]

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string | URL | Request) => {
      const urlStr = url.toString()
      if (urlStr.includes('/api/v1/issue-types')) {
        return Promise.resolve(jsonResponse(200, MOCK_CATEGORIES))
      }
      if (urlStr.includes('/api/v1/tickets')) {
        return Promise.resolve(jsonResponse(200, MOCK_TICKETS))
      }
      return Promise.resolve(jsonResponse(200, {}))
    }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  sessionStorage.clear()
})

const renderFixit = (route = '/tracks/fixit', userOverrides: Partial<{ id: string; name: string; email: string; role: any }> = {}) =>
  renderRoute({
    route,
    user: {
      id: 'manager@team1.com',
      name: 'Kavita Sharma',
      email: 'manager@team1.com',
      role: 'campus_manager',
      ...userOverrides,
    },
    tracks: [track],
  })

describe('FIXIT Track: Navigation and Command Center', () => {
  it('renders the FIXIT enterprise shell with brand and navigation links', async () => {
    renderFixit()

    // Shell branding (find brand link in sidebar)
    const brandLinks = await screen.findAllByText('FIXIT')
    expect(brandLinks.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Infrastructure OS')).toBeInTheDocument()

    // Navigation links in sidebar
    expect(screen.getByRole('link', { name: /Overview/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /My Tickets/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Raise an Issue/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /All Tickets/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Campus Map/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Issue Analytics/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Issue Categories/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Notifications/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Settings/i })).toBeInTheDocument()

    // Role badge
    expect(screen.getByText('Campus Manager')).toBeInTheDocument()
  })

  it('renders the Campus Operations Command Center and Pulse metrics', async () => {
    renderFixit()

    // Command Center header
    expect(await screen.findByText(/Campus Operations Command Center/i)).toBeInTheDocument()

    // Pulse cards should be visible
    expect(screen.getByText('Campus Pulse Total')).toBeInTheDocument()
    expect(screen.getByText('Open Requests')).toBeInTheDocument()
    expect(screen.getByText('Resolved Issues')).toBeInTheDocument()
    expect(screen.getByText('Acknowledged')).toBeInTheDocument()
    expect(screen.getByText('Attention: Overdue')).toBeInTheDocument()
  })

  it('renders the Raise an Issue screen with form controls and file drag area', async () => {
    renderFixit('/tracks/fixit/raise')

    // Raise Issue title
    expect(await screen.findByRole('heading', { name: /Raise a Maintenance Issue/i })).toBeInTheDocument()

    // Form inputs
    expect(screen.getByLabelText(/Issue Title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Detailed Description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Campus Facility/i)).toBeInTheDocument()

    // Drag-and-drop file upload zone
    expect(screen.getByText(/Drag and drop an image here/i)).toBeInTheDocument()

    // Submit button
    expect(screen.getByRole('button', { name: /Submit Maintenance Ticket/i })).toBeInTheDocument()
  })

  it('renders the Issue Categories management screen', async () => {
    renderFixit('/tracks/fixit/categories')

    // Heading
    expect(await screen.findByRole('heading', { name: /Issue Category Management/i })).toBeInTheDocument()

    // Add category button
    const btns = screen.getAllByRole('button', { name: /Create Category/i })
    expect(btns[0]).toBeInTheDocument()
  })

  it('renders the Campus Map screen with architectural intelligence', async () => {
    renderFixit('/tracks/fixit/map')

    // Map screen title
    expect(await screen.findByRole('heading', { name: /Interactive Campus Intelligence Map/i })).toBeInTheDocument()
  })

  it('renders the Issue Analytics screen with metrics and charts', async () => {
    renderFixit('/tracks/fixit/analytics')

    // Analytics screen title
    expect(await screen.findByRole('heading', { name: /Infrastructure Analytics & Intelligence/i })).toBeInTheDocument()
  })

  it('renders the role switcher for all logged-in accounts', async () => {
    renderFixit('/tracks/fixit/settings', {
      id: 'student@team1.com',
      name: 'Asha Kumar',
      email: 'student@team1.com',
      role: 'student',
    })

    // Settings title
    expect(await screen.findByRole('heading', { name: /Platform Settings & Configuration/i })).toBeInTheDocument()

    // Role Switcher is accessible for all logged-in users
    expect(screen.getByText(/1-Click Role Switcher/i)).toBeInTheDocument()
  })

  it('renders the Settings screen with role switcher for authorized developer account', async () => {
    renderFixit('/tracks/fixit/settings', {
      id: 'admin@team13.com',
      name: 'Team 13 Admin',
      email: 'admin@team13.com',
      role: 'admin',
    })

    // Settings title
    expect(await screen.findByRole('heading', { name: /Platform Settings & Configuration/i })).toBeInTheDocument()

    // Demo Role Switcher visible only for authorized developer
    expect(screen.getByText(/1-Click Role Switcher/i)).toBeInTheDocument()
    expect(screen.getByText('(asha@team1.com)')).toBeInTheDocument()
    expect(screen.getByText('(kumar@team1.com)')).toBeInTheDocument()
  })

  it('renders profile picture options with upload and preset selector for all logged-in users', async () => {
    renderFixit('/tracks/fixit/settings')

    // Profile photo studio visible for all users
    expect(await screen.findByText('Profile Photo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Upload Photo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Choose Preset/i })).toBeInTheDocument()
  })
})
