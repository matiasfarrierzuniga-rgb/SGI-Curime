import {
  classifyMainLegacyShadows,
  OrganizationProfileReconciliationError,
  OrganizationProfileReconciliationExecutor,
} from './organization-profile-reconciliation-executor';
import type { CanonicalOrganizationProfileInput } from './organization-profile-input.config';
import type { OrganizationProfileReconciliationPlan } from './organization-profile-reconciliation-plan';

const input: CanonicalOrganizationProfileInput = {
  legalName: 'synthetic name', legalIdentification: 'synthetic id',
  dinadecoRegistrationCode: 'synthetic registration', organizationType: 'synthetic type',
  region: 'synthetic region', province: 'synthetic province', canton: 'synthetic canton',
  district: 'synthetic district', physicalAddress: 'synthetic address',
  notificationPhone: '2222', notificationFax: null, notificationEmail: 'synthetic@example.test',
};

const allNull = Object.fromEntries(
  Object.keys(input).map((field) => [field, null]),
) as Record<keyof CanonicalOrganizationProfileInput, string | null>;

describe('organization profile reconciliation executor', () => {
  it('classifies all-null shadows, including nullable fax, as unreconciled', () => {
    expect(classifyMainLegacyShadows(allNull, input)).toBe('ALL_NULL_OR_UNRECONCILED');
  });

  it('classifies exact complete shadows as matching', () => {
    expect(classifyMainLegacyShadows({ ...input }, input)).toBe('COMPLETE_AND_MATCHING');
  });

  it('classifies populated divergence before partial state and exposes field name only', () => {
    const shadows = { ...input, notificationFax: 'different synthetic fax' };
    expect(classifyMainLegacyShadows(shadows, input)).toBe('CONFLICTING');
  });

  it('classifies non-null incomplete shadows without a divergent value as partial', () => {
    expect(classifyMainLegacyShadows({ ...allNull, legalName: input.legalName }, input)).toBe('PARTIAL');
  });

  it('does not open a transaction for a blocked plan', async () => {
    const transaction = jest.fn();
    const executor = new OrganizationProfileReconciliationExecutor({ $transaction: transaction } as never);
    const plan: OrganizationProfileReconciliationPlan = { outcome: 'BLOCK_CUTOVER', diagnostics: { codes: ['HISTORY_MISMATCH'] } };

    await expect(executor.execute(plan, input)).rejects.toMatchObject({ code: 'APPROVED_PLAN_BLOCKED' });
    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects a reconcile plan whose embedded input differs from current approval before opening a transaction', async () => {
    const transaction = jest.fn();
    const executor = new OrganizationProfileReconciliationExecutor({ $transaction: transaction } as never);
    const plan: OrganizationProfileReconciliationPlan = {
      outcome: 'PLAN', action: 'RECONCILE_CANONICAL_SHADOW_FROM_MAIN_LEGACY',
      canonicalInput: { ...input, legalName: 'stale synthetic name' },
      transitionEvidence: null, diagnostics: { codes: [] },
    };

    await expect(executor.execute(plan, input)).rejects.toMatchObject({ code: 'CANONICAL_INPUT_MISMATCH' });
    expect(transaction).not.toHaveBeenCalled();
  });

  it('preserves future canonical-only root without an update', async () => {
    const tx = futureRootTransaction({ legacy: false, canonical: true });
    const executor = new OrganizationProfileReconciliationExecutor({
      $transaction: (callback: (transaction: unknown) => unknown) => callback(tx),
    } as never);
    const plan: OrganizationProfileReconciliationPlan = { outcome: 'PLAN', action: 'PRESERVE_CANONICAL_ROOT', diagnostics: { codes: [] } };

    await expect(executor.execute(plan, input)).resolves.toMatchObject({ disposition: 'PRESERVED' });
    expect(tx.organizationProfile.update).not.toHaveBeenCalled();
  });

  it('preserves future reviewed equivalent roots without consolidation', async () => {
    const tx = futureRootTransaction({ legacy: true, canonical: true });
    const executor = new OrganizationProfileReconciliationExecutor({
      $transaction: (callback: (transaction: unknown) => unknown) => callback(tx),
    } as never);
    const plan: OrganizationProfileReconciliationPlan = {
      outcome: 'PLAN', action: 'PRESERVE_REVIEWED_EQUIVALENT_ROOT', selectedRoot: 'CANONICAL', diagnostics: { codes: [] },
    };

    await expect(executor.execute(plan, input)).resolves.toMatchObject({ disposition: 'PRESERVED' });
    expect(tx.organizationProfile.update).not.toHaveBeenCalled();
  });

  it('keeps errors stable and payload-free', () => {
    const error = new OrganizationProfileReconciliationError('CONFLICTING_CANONICAL_SHADOWS', ['legalName']);
    expect(error.message).toBe('CONFLICTING_CANONICAL_SHADOWS');
    expect(JSON.stringify(error)).not.toContain('synthetic');
  });
});

function futureRootTransaction({ legacy, canonical }: { legacy: boolean; canonical: boolean }) {
  const tables = [
    ...(legacy ? [{ name: 'InstitutionalProfile' }] : []),
    ...(canonical ? [{ name: 'OrganizationProfile' }] : []),
  ];
  const legacyValues = { ...input };
  return {
    $queryRawUnsafe: jest.fn((query: string) => {
      if (query.includes('FROM pg_class')) return Promise.resolve(tables);
      if (query.includes('count(*)')) return Promise.resolve([{ count: BigInt(1) }]);
      if (query.includes('"InstitutionalProfile"') && query.includes('"canonicalLegalName"')) {
        return Promise.resolve([{ ...input }]);
      }
      if (query.includes('"InstitutionalProfile"')) return Promise.resolve([legacyValues]);
      return Promise.resolve([{ ...input }]);
    }),
    organizationProfile: { update: jest.fn() },
  };
}
