import { defineTrack } from '@/core/tracks'
import { routes } from './routes'

export default defineTrack({
  id: 'fixit',
  title: 'FIXIT: Campus Infrastructure Intelligence',
  description: 'Centralized enterprise platform for reporting, monitoring and managing campus maintenance issues.',
  team: 'Team 13',
  icon: '🛠️',
  navLabel: 'FIXIT',
  routes,
})

