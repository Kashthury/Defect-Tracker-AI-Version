import { Project, ProjectModule } from '@/types/project'

export const mockProjects: Project[] = [
  {
    id: 'proj-1', name: 'Payments Platform', description: 'Core payments processing and settlement engine.', status: 'ACTIVE',
    startDate: '2024-02-01', endDate: '2026-12-31', clientName: 'Northstar Financial', clientPhone: '+1 212 555 0101', clientCountry: 'United States', clientEmail: 'delivery@northstar.example',
    managerId: 'emp-0002', managerName: 'Priya Raghavan', managerEmployeeCode: 'EMP-0002', managerDesignationId: 'des-2', managerDesignationName: 'Senior Project Manager', managerAllocationPercentage: 30, managerAllocationStartDate: '2024-02-01', managerAllocationEndDate: '2026-12-31',
    teamCount: 19, moduleCount: 3, openDefects: 214, currentRelease: 'Release 4.2', createdAt: '2024-01-15T08:00:00Z', updatedAt: '2026-06-20T10:30:00Z',
  },
  {
    id: 'proj-2', name: 'Customer Onboarding', description: 'KYC, document verification and account setup flows.', status: 'ACTIVE',
    startDate: '2024-05-15', endDate: '2026-09-30', clientName: 'Meridian Retail Bank', clientPhone: '+44 20 7946 0123', clientCountry: 'United Kingdom', clientEmail: 'programs@meridian.example',
    managerId: 'emp-0002', managerName: 'Priya Raghavan', managerEmployeeCode: 'EMP-0002', managerDesignationId: 'des-2', managerDesignationName: 'Senior Project Manager', managerAllocationPercentage: 30, managerAllocationStartDate: '2024-05-15', managerAllocationEndDate: '2026-09-30',
    teamCount: 11, moduleCount: 2, openDefects: 87, currentRelease: 'Release 3.1', createdAt: '2024-04-20T08:00:00Z', updatedAt: '2026-06-12T09:15:00Z',
  },
  {
    id: 'proj-3', name: 'Mobile Banking App', description: 'Consumer-facing iOS and Android banking application.', status: 'ACTIVE',
    startDate: '2023-11-01', endDate: '2026-08-01', clientName: 'Apex Digital Bank', clientPhone: '+65 6123 4567', clientCountry: 'Singapore', clientEmail: 'mobile@apexbank.example',
    managerId: 'emp-0005', managerName: 'Meera Nair', managerEmployeeCode: 'EMP-0005', managerDesignationId: 'des-1', managerDesignationName: 'System Administrator', managerAllocationPercentage: 50, managerAllocationStartDate: '2023-11-01', managerAllocationEndDate: '2026-08-01',
    teamCount: 25, moduleCount: 3, openDefects: 356, currentRelease: 'Release 5.0', createdAt: '2023-10-12T08:00:00Z', updatedAt: '2026-07-01T15:00:00Z',
  },
  {
    id: 'proj-4', name: 'Risk & Fraud Engine', description: 'Real-time transaction risk scoring service.', status: 'ON_HOLD',
    startDate: '2024-06-01', endDate: '2026-06-01', clientName: 'Northstar Financial', clientPhone: '+1 212 555 0101', clientCountry: 'United States', clientEmail: 'risk@northstar.example',
    managerId: 'emp-0002', managerName: 'Priya Raghavan', managerEmployeeCode: 'EMP-0002', managerDesignationId: 'des-2', managerDesignationName: 'Senior Project Manager', managerAllocationPercentage: 20, managerAllocationStartDate: '2024-06-01', managerAllocationEndDate: '2026-06-01',
    teamCount: 9, moduleCount: 1, openDefects: 42, createdAt: '2024-05-10T08:00:00Z', updatedAt: '2026-06-02T08:00:00Z',
  },
  {
    id: 'proj-5', name: 'Regulatory Reporting', description: 'Automated compliance reporting for regional regulators.', status: 'ACTIVE',
    startDate: '2026-09-01', endDate: '2027-06-30', clientName: 'Crown Compliance Group', clientPhone: '+61 2 9374 4000', clientCountry: 'Australia', clientEmail: 'delivery@crowncompliance.example',
    managerId: 'emp-0005', managerName: 'Meera Nair', managerEmployeeCode: 'EMP-0005', managerDesignationId: 'des-1', managerDesignationName: 'System Administrator', managerAllocationPercentage: 40, managerAllocationStartDate: '2026-09-01', managerAllocationEndDate: '2027-06-30',
    teamCount: 4, moduleCount: 0, openDefects: 3, currentRelease: 'Planning', createdAt: '2026-07-01T08:00:00Z', updatedAt: '2026-07-01T08:00:00Z',
  },
  {
    id: 'proj-6', name: 'Legacy Ledger Migration', description: 'Migration off the mainframe general ledger.', status: 'COMPLETED',
    startDate: '2023-01-10', endDate: '2024-12-20', clientName: 'Heritage Commercial Bank', clientPhone: '+94 11 234 5678', clientCountry: 'Sri Lanka', clientEmail: 'technology@heritage.example',
    managerId: 'emp-0002', managerName: 'Priya Raghavan', managerEmployeeCode: 'EMP-0002', managerDesignationId: 'des-2', managerDesignationName: 'Senior Project Manager', managerAllocationPercentage: 40, managerAllocationStartDate: '2023-01-10', managerAllocationEndDate: '2024-12-20',
    teamCount: 15, moduleCount: 0, openDefects: 0, currentRelease: 'Completed', createdAt: '2022-12-12T08:00:00Z', updatedAt: '2024-12-20T17:00:00Z',
  },
]

export const mockModules: ProjectModule[] = [
  { id: 'mod-1', projectId: 'proj-1', name: 'Settlement Engine', description: 'End-of-day settlement batch processing.', ownerName: 'Carlos Ibanez' },
  { id: 'mod-2', projectId: 'proj-1', name: 'Card Authorization', description: 'Real-time card authorization and decline handling.', ownerName: 'Liam O\u2019Connor' },
  { id: 'mod-3', projectId: 'proj-1', name: 'Wire Transfers', description: 'Domestic and international wire processing.', ownerName: 'Carlos Ibanez' },
  { id: 'mod-4', projectId: 'proj-2', name: 'Document Verification', description: 'ID document scan and validation.', ownerName: 'Hana Kimura' },
  { id: 'mod-5', projectId: 'proj-2', name: 'KYC Checks', description: 'Sanctions and watchlist screening.', ownerName: 'Arjun Mehta' },
  { id: 'mod-6', projectId: 'proj-3', name: 'Account Overview', description: 'Balance and transaction history screens.', ownerName: 'Liam O\u2019Connor' },
  { id: 'mod-7', projectId: 'proj-3', name: 'Bill Pay', description: 'Scheduled and one-time bill payments.', ownerName: 'Carlos Ibanez' },
  { id: 'mod-8', projectId: 'proj-3', name: 'Push Notifications', description: 'Real-time alerts and notification preferences.', ownerName: 'Hana Kimura' },
  { id: 'mod-9', projectId: 'proj-4', name: 'Transaction Scoring', description: 'ML-based fraud risk scoring.', ownerName: 'Arjun Mehta' },
]
