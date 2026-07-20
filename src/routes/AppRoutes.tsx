import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { ROUTES } from '@/constants/routes'
import { PRIV } from '@/constants/privileges'

import { LoginPage } from '@/pages/LoginPage'
import { SessionExpiredPage } from '@/pages/SessionExpiredPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { DashboardPage } from '@/pages/DashboardPage'

import { MyProjectsPage } from '@/pages/workspace/MyProjectsPage'
import { ReleasesPage } from '@/pages/workspace/ReleasesPage'
import { TestCasesPage } from '@/pages/workspace/TestCasesPage'
import { ReleaseTestCaseExecutionPage } from '@/pages/workspace/releases/ReleaseTestCaseExecutionPage'
import { DefectsPage } from '@/pages/workspace/DefectsPage'
import { ReportsPage } from '@/pages/workspace/ReportsPage'
import { ReleaseCreatePage } from '@/pages/workspace/releases/ReleaseCreatePage'
import { ReleaseDetailPage } from '@/pages/workspace/releases/ReleaseDetailPage'
import { ReleaseEditPage } from '@/pages/workspace/releases/ReleaseEditPage'
import { ReleaseWorkspacePage } from '@/pages/workspace/releases/ReleaseWorkspacePage'
import { ReleaseTestCaseAllocationPage } from '@/pages/workspace/releases/ReleaseTestCaseAllocationPage'

import { ProjectsPage } from '@/pages/project-management/ProjectsPage'
import { ModulesPage } from '@/pages/project-management/ModulesPage'
import { AllocationHistoryPage } from '@/pages/project-management/AllocationHistoryPage'
import { ProjectCreatePage } from '@/pages/project-management/projects/ProjectCreatePage'
import { ProjectEditPage } from '@/pages/project-management/projects/ProjectEditPage'
import { ProjectOverviewPage } from '@/pages/project-management/projects/ProjectOverviewPage'
import { ProjectDetailPage } from '@/pages/project-management/projects/ProjectDetailPage'
import { ProjectManagementHubPage } from '@/pages/project-management/ProjectManagementHubPage'
import { ReleaseManagementHubPage } from '@/pages/project-management/ReleaseManagementHubPage'
import { ProjectWorkspaceLayout } from '@/components/projects/ProjectWorkspaceLayout'
import { AvailableEmployeesPage } from '@/pages/bench/AvailableEmployeesPage'
import { ProjectAllocationPage } from '@/pages/bench/ProjectAllocationPage'

import { EmployeeListPage } from '@/pages/user-management/employees/EmployeeListPage'
import { EmployeeCreatePage } from '@/pages/user-management/employees/EmployeeCreatePage'
import { EmployeeDetailPage } from '@/pages/user-management/employees/EmployeeDetailPage'
import { EmployeeEditPage } from '@/pages/user-management/employees/EmployeeEditPage'
import { PrivilegesPage } from '@/pages/user-management/PrivilegesPage'

import { RoleListPage } from '@/pages/configuration/roles/RoleListPage'
import { RoleCreatePage } from '@/pages/configuration/roles/RoleCreatePage'
import { RoleDetailPage } from '@/pages/configuration/roles/RoleDetailPage'
import { RoleEditPage } from '@/pages/configuration/roles/RoleEditPage'
import { DefectTypeListPage } from '@/pages/configuration/defect-types/DefectTypeListPage'
import { DefectTypeCreatePage } from '@/pages/configuration/defect-types/DefectTypeCreatePage'
import { DefectTypeEditPage } from '@/pages/configuration/defect-types/DefectTypeEditPage'
import { ReleaseTypeListPage } from '@/pages/configuration/release-types/ReleaseTypeListPage'
import { ReleaseTypeCreatePage } from '@/pages/configuration/release-types/ReleaseTypeCreatePage'
import { ReleaseTypeEditPage } from '@/pages/configuration/release-types/ReleaseTypeEditPage'
import { SeverityListPage } from '@/pages/configuration/severities/SeverityListPage'
import { SeverityCreatePage } from '@/pages/configuration/severities/SeverityCreatePage'
import { SeverityEditPage } from '@/pages/configuration/severities/SeverityEditPage'
import { PriorityListPage } from '@/pages/configuration/priorities/PriorityListPage'
import { PriorityCreatePage } from '@/pages/configuration/priorities/PriorityCreatePage'
import { PriorityEditPage } from '@/pages/configuration/priorities/PriorityEditPage'
import { StatusTypeListPage } from '@/pages/configuration/status-types/StatusTypeListPage'
import { StatusTypeCreatePage } from '@/pages/configuration/status-types/StatusTypeCreatePage'
import { StatusTypeEditPage } from '@/pages/configuration/status-types/StatusTypeEditPage'
import { DefectWorkflowViewPage } from '@/pages/configuration/defect-workflow/DefectWorkflowViewPage'
import { DefectWorkflowDesignerPage } from '@/pages/configuration/defect-workflow/DefectWorkflowDesignerPage'
import { PrivilegeListPage } from '@/pages/configuration/privileges/PrivilegeListPage'
import { RolePrivilegeAssignmentPage } from '@/pages/configuration/privileges/RolePrivilegeAssignmentPage'
import { UserPermissionOverridePage } from '@/pages/configuration/privileges/UserPermissionOverridePage'
import { DesignationListPage } from '@/pages/configuration/designations/DesignationListPage'
import { DesignationCreatePage } from '@/pages/configuration/designations/DesignationCreatePage'
import { DesignationEditPage } from '@/pages/configuration/designations/DesignationEditPage'
import { StatusHubPage } from '@/pages/configuration/StatusHubPage'
import { PrivilegeHubPage } from '@/pages/configuration/PrivilegeHubPage'

import { EmailManagementPage } from '@/pages/system-settings/EmailManagementPage'

/** Wraps a page element with privilege-checked route protection. */
const guarded = (privilege: string, element: React.ReactNode) => (
  <ProtectedRoute privilege={privilege}>{element}</ProtectedRoute>
)

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.SESSION_EXPIRED} element={<SessionExpiredPage />} />

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.DASHBOARD} element={guarded(PRIV.DASHBOARD_VIEW, <DashboardPage />)} />

        <Route path={ROUTES.MY_PROJECTS} element={guarded(PRIV.MY_PROJECTS_VIEW, <MyProjectsPage />)} />
        <Route path={ROUTES.RELEASES} element={guarded(PRIV.RELEASE_VIEW, <ReleasesPage />)} />
        <Route path={ROUTES.TEST_CASES} element={guarded(PRIV.TESTCASE_VIEW, <TestCasesPage />)} />
        <Route path={ROUTES.DEFECTS} element={guarded(PRIV.DEFECT_VIEW, <DefectsPage />)} />
        <Route path={ROUTES.REPORTS} element={guarded(PRIV.REPORTS_VIEW, <ReportsPage />)} />

        <Route path={ROUTES.PROJECTS} element={guarded(PRIV.PROJECT_VIEW, <ProjectsPage />)} />
        <Route path={ROUTES.PROJECT_CREATE} element={guarded(PRIV.PROJECT_CREATE, <ProjectCreatePage />)} />
        <Route path={ROUTES.PROJECT_EDIT} element={guarded(PRIV.PROJECT_UPDATE, <ProjectEditPage />)} />
        <Route path={ROUTES.BENCH_AVAILABLE_EMPLOYEES} element={guarded(PRIV.PROJECT_ALLOCATION_VIEW, <AvailableEmployeesPage />)} />
        <Route path={ROUTES.BENCH_PROJECT_ALLOCATION} element={guarded(PRIV.PROJECT_ALLOCATION_VIEW, <ProjectAllocationPage />)} />
        <Route path={ROUTES.MODULES} element={guarded(PRIV.MODULE_VIEW, <ModulesPage />)} />
        <Route path={ROUTES.ALLOCATION_HISTORY} element={guarded(PRIV.PROJECT_ALLOCATION_VIEW, <AllocationHistoryPage />)} />
        <Route path={ROUTES.PROJECT_WORKSPACE} element={guarded(PRIV.PROJECT_VIEW, <ProjectWorkspaceLayout />)}>
          <Route index element={<Navigate to="project-management" replace />} />
          <Route path="project-management" element={guarded(PRIV.PROJECT_VIEW, <ProjectManagementHubPage />)} />
          <Route path="release-management" element={guarded(PRIV.RELEASE_VIEW, <ReleaseManagementHubPage />)} />
          <Route path="overview" element={guarded(PRIV.PROJECT_VIEW, <ProjectOverviewPage />)} />
          <Route path="details" element={guarded(PRIV.PROJECT_VIEW, <ProjectDetailPage />)} />
          <Route path="modules" element={guarded(PRIV.MODULE_VIEW, <ModulesPage />)} />
          <Route path="allocation-history" element={guarded(PRIV.PROJECT_ALLOCATION_VIEW, <AllocationHistoryPage />)} />
          <Route path="test-cases" element={guarded(PRIV.TESTCASE_VIEW, <TestCasesPage />)} />
          <Route path="releases" element={guarded(PRIV.RELEASE_VIEW, <ReleasesPage />)} />
          <Route path="releases/test-case-execution" element={guarded(PRIV.TESTCASE_EXECUTION_VIEW, <ReleaseTestCaseExecutionPage />)} />
          <Route path="releases/test-case-allocation" element={guarded(PRIV.TESTCASE_VIEW, <ReleaseTestCaseAllocationPage />)} />
          <Route path="releases/create" element={guarded(PRIV.RELEASE_CREATE, <ReleaseCreatePage />)} />
          <Route path="releases/:releaseId/edit" element={guarded(PRIV.RELEASE_UPDATE, <ReleaseEditPage />)} />
          <Route path="releases/:releaseId/workspace" element={guarded(PRIV.RELEASE_VIEW, <ReleaseWorkspacePage />)} />
          <Route path="releases/:releaseId" element={guarded(PRIV.RELEASE_VIEW, <ReleaseDetailPage />)} />
          <Route path="defects" element={guarded(PRIV.DEFECT_VIEW, <DefectsPage />)} />
          <Route path="reports" element={guarded(PRIV.REPORTS_VIEW, <ReportsPage />)} />
        </Route>

        <Route path={ROUTES.EMPLOYEES} element={guarded(PRIV.EMPLOYEE_VIEW, <EmployeeListPage />)} />
        <Route path={ROUTES.EMPLOYEE_CREATE} element={guarded(PRIV.EMPLOYEE_CREATE, <EmployeeCreatePage />)} />
        <Route path={ROUTES.EMPLOYEE_DETAIL} element={guarded(PRIV.EMPLOYEE_VIEW, <EmployeeDetailPage />)} />
        <Route path={ROUTES.EMPLOYEE_EDIT} element={guarded(PRIV.EMPLOYEE_UPDATE, <EmployeeEditPage />)} />
        <Route path={ROUTES.PRIVILEGES} element={guarded(PRIV.PRIVILEGE_VIEW, <PrivilegesPage />)} />

        <Route path={ROUTES.ROLES} element={guarded(PRIV.ROLE_VIEW, <RoleListPage />)} />
        <Route path={ROUTES.ROLE_CREATE} element={guarded(PRIV.ROLE_CREATE, <RoleCreatePage />)} />
        <Route path={ROUTES.ROLE_DETAIL} element={guarded(PRIV.ROLE_VIEW, <RoleDetailPage />)} />
        <Route path={ROUTES.ROLE_EDIT} element={guarded(PRIV.ROLE_UPDATE, <RoleEditPage />)} />
        <Route path={ROUTES.DEFECT_TYPE} element={guarded(PRIV.DEFECT_TYPE_VIEW, <DefectTypeListPage />)} />
        <Route path={ROUTES.DEFECT_TYPE_CREATE} element={guarded(PRIV.DEFECT_TYPE_CREATE, <DefectTypeCreatePage />)} />
        <Route path={ROUTES.DEFECT_TYPE_EDIT} element={guarded(PRIV.DEFECT_TYPE_UPDATE, <DefectTypeEditPage />)} />
        <Route path={ROUTES.RELEASE_TYPE} element={guarded(PRIV.RELEASE_TYPE_VIEW, <ReleaseTypeListPage />)} />
        <Route path={ROUTES.RELEASE_TYPE_CREATE} element={guarded(PRIV.RELEASE_TYPE_CREATE, <ReleaseTypeCreatePage />)} />
        <Route path={ROUTES.RELEASE_TYPE_EDIT} element={guarded(PRIV.RELEASE_TYPE_UPDATE, <ReleaseTypeEditPage />)} />
        <Route path={ROUTES.SEVERITY} element={guarded(PRIV.SEVERITY_VIEW, <SeverityListPage />)} />
        <Route path={ROUTES.SEVERITY_CREATE} element={guarded(PRIV.SEVERITY_CREATE, <SeverityCreatePage />)} />
        <Route path={ROUTES.SEVERITY_EDIT} element={guarded(PRIV.SEVERITY_UPDATE, <SeverityEditPage />)} />
        <Route path={ROUTES.PRIORITY} element={guarded(PRIV.PRIORITY_VIEW, <PriorityListPage />)} />
        <Route path={ROUTES.PRIORITY_CREATE} element={guarded(PRIV.PRIORITY_CREATE, <PriorityCreatePage />)} />
        <Route path={ROUTES.PRIORITY_EDIT} element={guarded(PRIV.PRIORITY_UPDATE, <PriorityEditPage />)} />
        <Route path={ROUTES.STATUS} element={guarded(PRIV.STATUS_TYPE_VIEW, <StatusHubPage />)} />
        <Route path={ROUTES.STATUS_TYPE} element={guarded(PRIV.STATUS_TYPE_VIEW, <StatusTypeListPage />)} />
        <Route path={ROUTES.STATUS_TYPE_CREATE} element={guarded(PRIV.STATUS_TYPE_CREATE, <StatusTypeCreatePage />)} />
        <Route path={ROUTES.STATUS_TYPE_EDIT} element={guarded(PRIV.STATUS_TYPE_UPDATE, <StatusTypeEditPage />)} />
        <Route path={ROUTES.DEFECT_WORKFLOW} element={guarded(PRIV.DEFECT_WORKFLOW_VIEW, <DefectWorkflowViewPage />)} />
        <Route path={ROUTES.DEFECT_WORKFLOW_EDIT} element={guarded(PRIV.DEFECT_WORKFLOW_UPDATE, <DefectWorkflowDesignerPage />)} />
        <Route path={ROUTES.STATUS_WORKFLOW} element={guarded(PRIV.DEFECT_WORKFLOW_VIEW, <Navigate to={ROUTES.DEFECT_WORKFLOW} replace />)} />
        <Route path={ROUTES.PRIVILEGE} element={guarded(PRIV.PRIVILEGE_VIEW, <PrivilegeHubPage />)} />
        <Route path={ROUTES.PRIVILEGE_LIST} element={guarded(PRIV.PRIVILEGE_VIEW, <PrivilegeListPage />)} />
        <Route path={ROUTES.ROLE_PRIVILEGE_ASSIGNMENT} element={guarded(PRIV.PRIVILEGE_ASSIGN, <RolePrivilegeAssignmentPage />)} />
        <Route path={ROUTES.USER_PERMISSION_OVERRIDE} element={guarded(PRIV.USER_PERMISSION_MANAGE, <UserPermissionOverridePage />)} />
        <Route path={ROUTES.DESIGNATIONS} element={guarded(PRIV.DESIGNATION_VIEW, <DesignationListPage />)} />
        <Route path={ROUTES.DESIGNATION_CREATE} element={guarded(PRIV.DESIGNATION_CREATE, <DesignationCreatePage />)} />
        <Route path={ROUTES.DESIGNATION_EDIT} element={guarded(PRIV.DESIGNATION_UPDATE, <DesignationEditPage />)} />

        <Route path={ROUTES.EMAIL_MANAGEMENT} element={guarded(PRIV.EMAIL_CONFIG, <EmailManagementPage />)} />
        <Route path={ROUTES.EMAIL_CONFIGURATION} element={<Navigate to={`${ROUTES.EMAIL_MANAGEMENT}?tab=smtp`} replace />} />
        <Route path={ROUTES.EMAIL_POINT_SETUP} element={<Navigate to={`${ROUTES.EMAIL_MANAGEMENT}?tab=templates`} replace />} />

        <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Route>

      <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
