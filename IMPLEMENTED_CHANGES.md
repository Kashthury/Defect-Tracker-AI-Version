# Implemented changes

- Rebuilt Module Management as a three-panel workspace.
- Added Module CRUD with validation and duplicate checks.
- Added Module-level QA / QA Lead assignment from active project allocations.
- Added Submodule CRUD with validation and dependency-safe deletion.
- Added Submodule-level Developer assignment from active project allocations.
- Added icon-based actions, empty states, loading states, toast messages, and reusable project selection.
- Added Release Test Case Allocation with One-to-One, One-to-Many, Bulk, and Many-to-Many modes.
- Added duplicate allocation skipping and success/skip summary.
- Added Module/Submodule filtering, multi-select, Select All, Clear All, pagination, and allocation summary.
- Added QA Allocation tab showing only NOT_STARTED release test cases.
- Added QA assignment/reassignment from Module-assigned QA members only.
- Added mock API-ready types, services, and data for future Spring Boot integration.
- Updated project release allocation route to use the new allocation page.
- Verified with `npm run build`.

## Test Case Management
- Project-scoped Test Case list with reusable Project Selector support.
- Module and Submodule navigation with live Test Case counts.
- Create, View, Edit, Delete with global validation and update change detection.
- Defect Type and Severity configuration integration.
- Severity badges use configured colors.
- Module, Submodule, Severity, Defect Type, and Description filters with clear action.
- API-style pagination for large Test Case datasets.
- CSV export, downloadable import template, preview validation, partial import, and result summaries.
- Automatic TC00001-style Test Case numbering.
- Permission-aware Create, Update, Delete, Export, and Import actions.
