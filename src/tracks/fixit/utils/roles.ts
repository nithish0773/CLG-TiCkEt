import type { User } from '@/core'

/**
 * According to CampusOS API Guide:
 * - Admin has full powers across all tracks
 * - Office staff with dept "Campus Maintenance" (e.g. Kumar Gowda) run FixIt (issue types, working on tickets)
 * - Also supports campus_manager role for demo / backwards compatibility
 */
export function isFixitManager(user?: User | null): boolean {
  if (!user) return false
  if (user.role === 'admin' || user.role === 'campus_manager') return true
  if (user.role === 'office_staff') {
    const dept = (user.department || (user as any)?.dept || '').toLowerCase()
    const designation = ((user as any)?.designation || '').toLowerCase()
    return (
      dept.includes('maintenance') ||
      dept.includes('infrastructure') ||
      designation.includes('supervisor') ||
      designation.includes('manager')
    )
  }
  return false
}

export function getRoleDisplayLabel(user?: User | null): string {
  if (!user) return 'Guest'
  if (user.role === 'admin') return 'Admin'
  if (user.role === 'campus_manager') return 'Campus Manager'
  if (user.role === 'office_staff') {
    const dept = (user.department || (user as any)?.dept || '').toLowerCase()
    if (dept.includes('maintenance') || dept.includes('infrastructure')) {
      return 'Campus Maintenance'
    }
    return 'Office Staff'
  }
  if (user.role === 'faculty') return 'Faculty'
  return 'Student'
}
