import {
  applyCanonicalRbacPlan,
  inspectCanonicalRbac,
} from './canonical-rbac-sync';

describe('canonical RBAC synchronizer', () => {
  const roles = [
    'ROLE_SYSTEM_ADMIN', 'ROLE_INSTITUTIONAL_PRESIDENT',
    'ROLE_INSTITUTIONAL_SECRETARY', 'ROLE_INSTITUTIONAL_TREASURER',
    'ROLE_INSTITUTIONAL_OPERATOR', 'ROLE_COMMUNITY_USER',
  ].map((name, id) => ({ id, name, isActive: true, permissionCodes: [] }));

  it('plans all reviewed grants without applying them', () => {
    const plan = inspectCanonicalRbac(roles);
    expect(plan.grantsToCreate).toHaveLength(107);
    expect(plan.unexpectedGrants).toEqual([]);
    expect(plan.historicalActiveRoles).toEqual([]);
  });

  it('detects active historical roles and unexpected community grants', () => {
    const plan = inspectCanonicalRbac([
      ...roles.map((role) => role.name === 'ROLE_COMMUNITY_USER'
        ? { ...role, permissionCodes: ['erp.dashboard.read'] }
        : role),
      { id: 99, name: 'Administrador', isActive: true, permissionCodes: [] },
    ]);
    expect(plan.historicalActiveRoles).toEqual(['Administrador']);
    expect(plan.unexpectedGrants).toContainEqual({
      role: 'ROLE_COMMUNITY_USER', capability: 'erp.dashboard.read',
    });
  });

  it('applies only additive approved differences', async () => {
    const writer = { ensurePermission: jest.fn(), ensureRolePermission: jest.fn() };
    const plan = inspectCanonicalRbac(roles);
    await applyCanonicalRbacPlan(writer, plan);
    expect(writer.ensurePermission).toHaveBeenCalled();
    expect(writer.ensureRolePermission).toHaveBeenCalledTimes(107);
  });
});
