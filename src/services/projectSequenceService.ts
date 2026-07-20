export type ProjectSequenceType = 'TESTCASE' | 'DEFECT'

interface ProjectSequence {
  projectId: string
  sequenceType: ProjectSequenceType
  currentValue: number
}

const sequences = new Map<string, ProjectSequence>()

const keyFor = (projectId: string, sequenceType: ProjectSequenceType) =>
  `${projectId}:${sequenceType}`

/**
 * Mock equivalent of an atomic project-sequence database update. Allocation is
 * synchronous, so concurrent async callers cannot observe the same value.
 * Existing values are only inspected once to seed the project/type row; deletes
 * never lower an initialized sequence.
 */
export const allocateProjectSequence = (
  projectId: string,
  sequenceType: ProjectSequenceType,
  existingNumbers: string[],
) => {
  const key = keyFor(projectId, sequenceType)
  let sequence = sequences.get(key)
  if (!sequence) {
    const currentValue = existingNumbers.reduce(
      (maximum, value) => Math.max(maximum, Number(value.replace(/\D/g, '')) || 0),
      0,
    )
    sequence = { projectId, sequenceType, currentValue }
    sequences.set(key, sequence)
  }
  sequence.currentValue += 1
  const prefix = sequenceType === 'TESTCASE' ? 'TC' : 'DEF'
  return `${prefix}${String(sequence.currentValue).padStart(5, '0')}`
}

