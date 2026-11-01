import React from 'react'
import { Navigate, type RouteObject } from 'react-router'
import { RequireAuth } from '@/core/auth/RequireAuth'
import { useAuth } from '@/core/auth/useAuth'
import { isCampusMaintenanceStaff, isAdminUser } from '@/core/auth/session'
import type { TrackManifest } from '@/core/tracks'
import { tracks as registeredTracks } from '@/core/tracks/registry'
import { Spinner } from '@/ui'

// Public Pages
import { PublicLayout } from '@/pages/public/PublicLayout'
import { LandingPage } from '@/pages/public/LandingPage'
import { FeaturesPage } from '@/pages/public/FeaturesPage'
import { AboutPage } from '@/pages/public/AboutPage'
import { ContactPage } from '@/pages/public/ContactPage'
import { LoginPage } from '@/features/auth/LoginPage'

// Application Layout & Pages
import { DashboardLayout } from './DashboardLayout'
import { AppLayout } from './AppLayout'
import { ReporterDashboardPage } from '@/pages/dashboard/ReporterDashboardPage'
import { MyTicketsPage } from '@/pages/tickets/MyTicketsPage'
import { RaiseTicketPage } from '@/pages/tickets/RaiseTicketPage'
import { TicketDetailsPage } from '@/pages/tickets/TicketDetailsPage'
import { OperationsOverviewPage } from '@/pages/operations/OperationsOverviewPage'
import { OperationsTicketsPage } from '@/pages/operations/OperationsTicketsPage'
import { OperationsIssueTypesPage } from '@/pages/operations/OperationsIssueTypesPage'
import { AdminCommandPage } from '@/pages/admin/AdminCommandPage'
import { UserProfilePage } from '@/pages/profile/UserProfilePage'
import { NotFoundPage } from './NotFoundPage'

/** Role-aware /dashboard dispatcher */
function DashboardRouter() {
  const { user } = useAuth()
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }
  if (isCampusMaintenanceStaff(user)) {
    return <Navigate to="/operations" replace />
  }
  return <ReporterDashboardPage />
}

/** Guard for Operations routes (Campus Maintenance & Admin) */
function RequireOperations({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!isCampusMaintenanceStaff(user) && !isAdminUser(user)) {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}

/** Guard for Admin Command routes */
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!isAdminUser(user)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

/** Complete Route table for CampusOS FixIt */
export function buildRoutes(tracks: TrackManifest[] = registeredTracks): RouteObject[] {
  return [
    // Public routes under PublicLayout
    {
      element: <PublicLayout />,
      children: [
        { path: '/', element: <LandingPage /> },
        { path: '/features', element: <FeaturesPage /> },
        { path: '/about', element: <AboutPage /> },
        { path: '/contact', element: <ContactPage /> },
      ],
    },

    // Authentication entrypoint
    { path: '/login', element: <LoginPage /> },
    { path: '/developer/login', element: <Navigate to="/login" replace /> },
    { path: '/admin/login', element: <Navigate to="/login" replace /> },

    // Protected Application Routes under DashboardLayout
    {
      element: (
        <RequireAuth>
          <DashboardLayout />
        </RequireAuth>
      ),
      children: [
        // Role-aware primary dashboard
        { path: '/dashboard', element: <DashboardRouter /> },

        // Reporter Routes
        { path: '/my-tickets', element: <MyTicketsPage /> },
        { path: '/raise-ticket', element: <RaiseTicketPage /> },
        { path: '/tickets/:id', element: <TicketDetailsPage /> },

        // Operations Routes
        {
          path: '/operations',
          element: (
            <RequireOperations>
              <OperationsOverviewPage />
            </RequireOperations>
          ),
        },
        {
          path: '/operations/tickets',
          element: (
            <RequireOperations>
              <OperationsTicketsPage />
            </RequireOperations>
          ),
        },
        {
          path: '/operations/issue-types',
          element: (
            <RequireOperations>
              <OperationsIssueTypesPage />
            </RequireOperations>
          ),
        },

        // Admin Command Route
        {
          path: '/admin',
          element: (
            <RequireAdmin>
              <AdminCommandPage />
            </RequireAdmin>
          ),
        },

        // User Profile
        { path: '/profile', element: <UserProfilePage /> },

        // Backward compatibility redirects for track links
        { path: '/fixit/overview', element: <Navigate to="/operations" replace /> },
        { path: '/fixit/tickets', element: <Navigate to="/operations/tickets" replace /> },
        { path: '/fixit/tickets/:id', element: <TicketDetailsPage /> },
        { path: '/fixit/raise', element: <Navigate to="/raise-ticket" replace /> },
        { path: '/fixit/my-tickets', element: <Navigate to="/my-tickets" replace /> },
        { path: '/fixit', element: <Navigate to="/dashboard" replace /> },
      ],
    },

    // Registered track routes (e.g. tests or legacy track screens)
    {
      element: (
        <RequireAuth>
          <AppLayout />
        </RequireAuth>
      ),
      children: [
        ...tracks.map((track) => ({
          path: `/tracks/${track.id}`,
          hydrateFallbackElement: <Spinner label={`Loading ${track.title}`} />,
          children: track.routes,
        })),
      ],
    },

    // 404 Fallback
    { path: '*', element: <NotFoundPage /> },
  ]
}
