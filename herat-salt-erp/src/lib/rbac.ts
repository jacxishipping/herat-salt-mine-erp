import { UserRole } from "@/types/erp";

export interface RolePermissions {
  canViewFinancials: boolean;
  canViewAuditLogs: boolean;
  canCreateWeighbridge: boolean;
  canApproveVoidTicket: boolean;
  canRequestVoidTicket: boolean;
  canCreateExtractionLog: boolean;
  canViewCompliance: boolean;
  canManageProcessing: boolean;
  canManageInventory: boolean;
  canManageFinance: boolean;
  canManagePayroll: boolean;
  canLogHse: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  MINE_OWNER: {
    canViewFinancials: true,
    canViewAuditLogs: true,
    canCreateWeighbridge: true,
    canApproveVoidTicket: true,
    canRequestVoidTicket: true,
    canCreateExtractionLog: true,
    canViewCompliance: true,
    canManageProcessing: true,
    canManageInventory: true,
    canManageFinance: true,
    canManagePayroll: true,
    canLogHse: true,
  },
  SITE_OPS_MANAGER: {
    canViewFinancials: false,
    canViewAuditLogs: true,
    canCreateWeighbridge: true,
    canApproveVoidTicket: true,
    canRequestVoidTicket: true,
    canCreateExtractionLog: true,
    canViewCompliance: true,
    canManageProcessing: true,
    canManageInventory: true,
    canManageFinance: false,
    canManagePayroll: false,
    canLogHse: true,
  },
  WEIGHBRIDGE_CLERK: {
    canViewFinancials: false,
    canViewAuditLogs: false,
    canCreateWeighbridge: true,
    canApproveVoidTicket: false,
    canRequestVoidTicket: true,
    canCreateExtractionLog: false,
    canViewCompliance: false,
    canManageProcessing: false,
    canManageInventory: false,
    canManageFinance: false,
    canManagePayroll: false,
    canLogHse: false,
  },
  WAREHOUSE_OFFICER: {
    canViewFinancials: false,
    canViewAuditLogs: false,
    canCreateWeighbridge: false,
    canApproveVoidTicket: false,
    canRequestVoidTicket: false,
    canCreateExtractionLog: false,
    canViewCompliance: false,
    canManageProcessing: true,
    canManageInventory: true,
    canManageFinance: false,
    canManagePayroll: false,
    canLogHse: false,
  },
  FINANCE_OFFICER: {
    canViewFinancials: true,
    canViewAuditLogs: true,
    canCreateWeighbridge: false,
    canApproveVoidTicket: false,
    canRequestVoidTicket: false,
    canCreateExtractionLog: false,
    canViewCompliance: true,
    canManageProcessing: false,
    canManageInventory: false,
    canManageFinance: true,
    canManagePayroll: true,
    canLogHse: false,
  },
  HSE_COMPLIANCE_OFFICER: {
    canViewFinancials: false,
    canViewAuditLogs: false,
    canCreateWeighbridge: false,
    canApproveVoidTicket: false,
    canRequestVoidTicket: false,
    canCreateExtractionLog: false,
    canViewCompliance: true,
    canManageProcessing: false,
    canManageInventory: false,
    canManageFinance: false,
    canManagePayroll: false,
    canLogHse: true,
  },
};
