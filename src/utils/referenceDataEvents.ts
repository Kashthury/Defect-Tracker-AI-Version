export const MODULE_REFERENCE_DATA_CHANGED = 'module-reference-data-changed'

export const notifyModuleReferenceDataChanged = () => {
  window.dispatchEvent(new Event(MODULE_REFERENCE_DATA_CHANGED))
}
