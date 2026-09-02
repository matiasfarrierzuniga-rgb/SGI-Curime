export const CAPABILITIES = {
  ERP_DASHBOARD_READ: 'erp.dashboard.read',
  USERS_READ: 'usr.users.read',
  USERS_MANAGE: 'usr.users.manage',
  ROLES_READ: 'usr.roles.read',
  ROLES_ASSIGN: 'usr.roles.assign',
  PROFILE_READ: 'usr.profile.read',
  AFFILIATES_READ: 'adm.affiliates.read',
  AFFILIATES_MANAGE: 'adm.affiliates.manage',
  REQUESTS_READ: 'adm.requests.read',
  REQUESTS_REVIEW: 'adm.requests.review',
  ASSEMBLIES_READ: 'adm.assemblies.read',
  ASSEMBLIES_MANAGE: 'adm.assemblies.manage',
  ATTENDANCE_MANAGE: 'adm.attendance.manage',
  JUSTIFICATIONS_READ: 'adm.justifications.read',
  JUSTIFICATIONS_REVIEW: 'adm.justifications.review',
  SANCTIONS_READ: 'adm.sanctions.read',
  SANCTIONS_MANAGE: 'adm.sanctions.manage',
  REPORTS_READ: 'adm.reports.read',
  AUDIT_LOGS_READ: 'aud.logs.read',
  INVENTORY_READ: 'inv.inventory.read',
  INVENTORY_MANAGE: 'inv.inventory.manage',
} as const;

export type Capability = (typeof CAPABILITIES)[keyof typeof CAPABILITIES];

export const CAPABILITY_CATALOG: readonly Capability[] =
  Object.values(CAPABILITIES);
