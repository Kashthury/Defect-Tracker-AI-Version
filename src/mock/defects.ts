import { DefectRecord, DefectHistoryRecord } from '@/types/defect'
import { mockModules, mockSubmodules } from './moduleManagement'
import { mockDefectTypes, mockPriorities, mockSeverities, mockStatusTypes } from './configuration'
import { mockReleases } from './releases'
import { mockEmployeeRecords } from './employees'

const descriptions = ['Settlement total differs from ledger', 'Validation message is not displayed', 'Duplicate request is accepted', 'Page becomes unresponsive after save', 'Incorrect status badge is displayed']
const projectDefectSequences = new Map<string, number>()
export const mockDefects: DefectRecord[] = Array.from({ length: 95 }, (_, index) => {
  const module = mockModules[index % mockModules.length]
  const subs = mockSubmodules.filter((s) => s.moduleId === module.id)
  const sub = subs[index % Math.max(subs.length, 1)] ?? mockSubmodules[0]
  const type = mockDefectTypes[index % mockDefectTypes.length]
  const severity = mockSeverities[index % mockSeverities.length]
  const priority = mockPriorities[index % mockPriorities.length]
  const releases = mockReleases.filter((r) => r.projectId === module.projectId)
  const release = releases[index % Math.max(releases.length, 1)] ?? mockReleases[0]
  const developerId = sub.developerEmployeeIds[0] ?? 'emp-0004'
  const developer = mockEmployeeRecords.find((e) => e.id === developerId)
  const status = mockStatusTypes[index % mockStatusTypes.length]
  const sequence = (projectDefectSequences.get(module.projectId) ?? 0) + 1
  projectDefectSequences.set(module.projectId, sequence)
  return {
    id: `defect-${index + 1}`,
    defectNo: `DEF${String(sequence).padStart(5, '0')}`,
    projectId: module.projectId,
    moduleId: module.id,
    moduleName: module.name,
    submoduleId: sub.id,
    submoduleName: sub.name,
    defectTypeId: type.id,
    defectTypeName: type.name,
    severityId: severity.id,
    severityName: severity.name,
    severityColor: severity.color,
    priorityId: priority.id,
    priorityName: priority.name,
    priorityColor: priority.color,
    releaseId: release.id,
    releaseName: release.name,
    description: descriptions[index % descriptions.length],
    recreationSteps: `1. Open ${module.name}.\n2. Navigate to ${sub.name}.\n3. Perform the operation.\n4. Observe the issue.`,
    statusCode: status.code,
    statusName: status.name,
    assignedToId: developerId,
    assignedToName: developer ? `${developer.firstName} ${developer.lastName}` : 'Unassigned',
    enteredById: index % 2 ? 'emp-0003' : 'emp-0007',
    enteredByName: index % 2 ? 'Arjun Mehta' : 'Hana Kimura',
    testCaseRequired: index % 8 === 0,
    linkedTestCaseId: undefined,
    linkedTestCaseNo: undefined,
    createdAt: new Date(Date.UTC(2026, index % 7, (index % 25) + 1)).toISOString(),
    updatedAt: new Date(Date.UTC(2026, index % 7, (index % 25) + 1)).toISOString(),
  }
})

export const mockDefectHistory: DefectHistoryRecord[] = mockDefects.slice(0, 20).map((d, i) => ({
  id: `history-${i + 1}`, defectId: d.id, action: 'CREATED', toValue: d.statusName, changedBy: d.enteredByName, changedAt: d.createdAt,
}))
