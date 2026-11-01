import type { RouteObject } from 'react-router'
import { FixitLayout } from './components/FixitLayout'
import { OverviewScreen } from './screens/OverviewScreen'
import { MyTicketsScreen } from './screens/MyTicketsScreen'
import { RaiseTicketScreen } from './screens/RaiseTicketScreen'
import { AllTicketsScreen } from './screens/AllTicketsScreen'
import { TicketDetailsScreen } from './screens/TicketDetailsScreen'
import { CampusMapScreen } from './screens/CampusMapScreen'
import { AnalyticsScreen } from './screens/AnalyticsScreen'
import { CategoriesScreen } from './screens/CategoriesScreen'
import { NotificationsScreen } from './screens/NotificationsScreen'
import { SettingsScreen } from './screens/SettingsScreen'

export const routes: RouteObject[] = [
  {
    element: <FixitLayout />,
    children: [
      { index: true, element: <OverviewScreen /> },
      { path: 'my-tickets', element: <MyTicketsScreen /> },
      { path: 'raise', element: <RaiseTicketScreen /> },
      { path: 'tickets', element: <AllTicketsScreen /> },
      { path: 'tickets/:id', element: <TicketDetailsScreen /> },
      { path: 'map', element: <CampusMapScreen /> },
      { path: 'analytics', element: <AnalyticsScreen /> },
      { path: 'categories', element: <CategoriesScreen /> },
      { path: 'notifications', element: <NotificationsScreen /> },
      { path: 'settings', element: <SettingsScreen /> },
      {
        path: 'developer',
        lazy: async () => ({ Component: (await import('./developer/DeveloperSuperAdminScreen')).DeveloperSuperAdminScreen }),
      },
      {
        path: 'developer/login',
        lazy: async () => ({ Component: (await import('./developer/DeveloperLoginPage')).DeveloperLoginPage }),
      },
    ],
  },
]
