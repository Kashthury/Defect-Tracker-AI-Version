import {
  LayoutDashboard,
  Briefcase,
  Rocket,
  ClipboardList,
  Bug,
  FolderKanban,
  Boxes,
  Users,
  ShieldCheck,
  KeyRound,
  BadgeCheck,
  Settings2,
  Tag,
  GitBranch,
  AlertTriangle,
  ArrowUpDown,
  Workflow,
  Route,
  Mail,
  KeySquare,
  ListChecks,
  UserCog,
  UserRoundSearch,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import { ROUTES } from './routes'
import { PRIV } from './privileges'
import { SelectedProject } from '@/types/project'

export interface MenuItem {
  label: string
  path?: string
  icon?: LucideIcon
  privilege?: string
  children?: MenuItem[]
}

export const createMenuConfig = (selectedProject?: SelectedProject | null): MenuItem[] => [
  {
    label: 'Dashboard',
    path: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    privilege: PRIV.DASHBOARD_VIEW,
  },
  {
    label: 'Employee',
    path: ROUTES.EMPLOYEES,
    icon: Users,
    privilege: PRIV.EMPLOYEE_VIEW,
  },
  {
    label: 'Bench',
    icon: Briefcase,
    children: [
      { label: 'Available Employees', path: ROUTES.BENCH_AVAILABLE_EMPLOYEES, icon: UserRoundSearch, privilege: PRIV.PROJECT_ALLOCATION_VIEW },
      { label: 'Project Allocation', path: ROUTES.BENCH_PROJECT_ALLOCATION, icon: UserPlus, privilege: PRIV.PROJECT_ALLOCATION_VIEW },
    ],
  },
  {
    label: 'Configuration',
    icon: Settings2,
    children: [
      { label: 'Role', path: ROUTES.ROLES, icon: ShieldCheck, privilege: PRIV.ROLE_VIEW },
      { label: 'Designations', path: ROUTES.DESIGNATIONS, icon: BadgeCheck, privilege: PRIV.DESIGNATION_VIEW },
      { label: 'Defect Type', path: ROUTES.DEFECT_TYPE, icon: Tag, privilege: PRIV.DEFECT_TYPE_VIEW },
      { label: 'Release Type', path: ROUTES.RELEASE_TYPE, icon: GitBranch, privilege: PRIV.RELEASE_TYPE_VIEW },
      { label: 'Severity', path: ROUTES.SEVERITY, icon: AlertTriangle, privilege: PRIV.SEVERITY_VIEW },
      { label: 'Priority', path: ROUTES.PRIORITY, icon: ArrowUpDown, privilege: PRIV.PRIORITY_VIEW },
      { label: 'Status', path: ROUTES.STATUS, icon: Workflow, privilege: PRIV.STATUS_TYPE_VIEW },
      { label: 'Privilege', path: ROUTES.PRIVILEGE, icon: KeyRound, privilege: PRIV.PRIVILEGE_VIEW },
      { label: 'Email Management', path: ROUTES.EMAIL_MANAGEMENT, icon: Mail, privilege: PRIV.EMAIL_CONFIG },
    ],
  },
  {
    label: 'Projects',
    path: ROUTES.PROJECTS,
    icon: FolderKanban,
    privilege: PRIV.PROJECT_VIEW,
    children: selectedProject
      ? [
          { label: 'Project Management', path: ROUTES.PROJECT_MANAGEMENT_HUB, icon: Boxes, privilege: PRIV.PROJECT_VIEW },
          { label: 'Test Cases', path: ROUTES.PROJECT_TEST_CASES, icon: ClipboardList, privilege: PRIV.TESTCASE_VIEW },
          { label: 'Releases', path: ROUTES.PROJECT_RELEASE_HUB, icon: Rocket, privilege: PRIV.RELEASE_VIEW },
          { label: 'Defects', path: ROUTES.PROJECT_DEFECTS, icon: Bug, privilege: PRIV.DEFECT_VIEW },
        ]
      : undefined,
  },
]

export const MENU_CONFIG: MenuItem[] = createMenuConfig()
