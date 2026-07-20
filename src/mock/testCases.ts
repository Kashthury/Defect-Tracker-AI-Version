import { mockModules, mockSubmodules } from './moduleManagement'
import { mockDefectTypes, mockSeverities } from './configuration'
import { TestCaseRecord } from '@/types/testCase'

const descriptions = [
  'Verify successful submission with valid data',
  'Verify mandatory field validation messages',
  'Verify duplicate record prevention',
  'Verify user can update an existing record',
  'Verify search returns matching results',
  'Verify unauthorized action is blocked',
  'Verify pagination retains selected filters',
  'Verify invalid input is rejected',
]

export const mockTestCases: TestCaseRecord[] = Array.from({ length: 240 }, (_, index) => {
  const module = mockModules[index % mockModules.length]
  const submodules = mockSubmodules.filter((item) => item.moduleId === module.id)
  const submodule = submodules[index % Math.max(1, submodules.length)] ?? mockSubmodules[0]
  const defectType = mockDefectTypes[index % mockDefectTypes.length]
  const severity = mockSeverities[index % mockSeverities.length]
  const sequence = index + 1
  return {
    id: `test-case-${sequence}`,
    testCaseNo: `TC${String(sequence).padStart(5, '0')}`,
    projectId: module.projectId,
    moduleId: module.id,
    moduleName: module.name,
    submoduleId: submodule.id,
    submoduleName: submodule.name,
    defectTypeId: defectType.id,
    defectTypeName: defectType.name,
    severityId: severity.id,
    severityName: severity.name,
    severityColor: severity.color,
    description: descriptions[index % descriptions.length],
    steps: `1. Open ${module.name}.\n2. Navigate to ${submodule.name}.\n3. Perform the test action.\n4. Verify the expected behaviour.`,
    createdAt: new Date(Date.UTC(2026, index % 6, (index % 26) + 1)).toISOString(),
    updatedAt: new Date(Date.UTC(2026, index % 6, (index % 26) + 1)).toISOString(),
    allocatedReleaseCount: index % 9 === 0 ? 1 : 0,
    hasExecutionHistory: index % 17 === 0,
  }
})
