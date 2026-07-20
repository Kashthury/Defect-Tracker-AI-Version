/**
 * Mock credential store. In a real backend this would never exist on the
 * client — authService treats it as a stand-in for a POST /auth/login call.
 */
export const mockCredentials: Record<string, string> = {
  'superuser@defecttrack.io': 'Passw0rd!',
  'pm.priya@defecttrack.io': 'Passw0rd!',
  'qa.arjun@defecttrack.io': 'Passw0rd!',
  'dev.liam@defecttrack.io': 'Passw0rd!',
  'admin.meera@defecttrack.io': 'Passw0rd!',
  'dev.carlos@defecttrack.io': 'Passw0rd!',
  'qa.hana@defecttrack.io': 'Passw0rd!',
}
