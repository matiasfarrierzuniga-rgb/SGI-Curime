import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CanonicalOrganizationProfileInput } from './organization-profile-input.config';
import type { OrganizationProfileReconciliationPlan } from './organization-profile-reconciliation-plan';

const CANONICAL_FIELDS = [
  'legalName',
  'legalIdentification',
  'dinadecoRegistrationCode',
  'organizationType',
  'region',
  'province',
  'canton',
  'district',
  'physicalAddress',
  'notificationPhone',
  'notificationFax',
  'notificationEmail',
] as const;

type CanonicalField = (typeof CANONICAL_FIELDS)[number];
type RootValues = Record<CanonicalField, string | null>;
type Transaction = Prisma.TransactionClient;

export type MainLegacyShadowState =
  | 'ALL_NULL_OR_UNRECONCILED'
  | 'COMPLETE_AND_MATCHING'
  | 'PARTIAL'
  | 'CONFLICTING';

export class OrganizationProfileReconciliationError extends Error {
  constructor(
    readonly code:
      | 'APPROVED_PLAN_BLOCKED'
      | 'STALE_OR_MISSING_ROOT'
      | 'PARTIAL_CANONICAL_SHADOWS'
      | 'CONFLICTING_CANONICAL_SHADOWS'
      | 'CANONICAL_INPUT_MISMATCH'
      | 'EQUIVALENT_ROOTS_CHANGED'
      | 'POSTVERIFY_FAILED'
      | 'RECONCILIATION_TRANSACTION_FAILED',
    readonly fields: readonly CanonicalField[] = [],
  ) {
    super(code);
    this.name = 'OrganizationProfileReconciliationError';
  }
}

export interface OrganizationProfileReconciliationResult {
  action: Exclude<OrganizationProfileReconciliationPlan, { outcome: 'BLOCK_CUTOVER' }>['action'];
  disposition: 'RECONCILED' | 'PRESERVED';
  shadowState?: MainLegacyShadowState;
}

/** Test-only transaction seam. Production construction supplies no hook. */
export type OrganizationProfileReconciliationPostWriteHook = (
  tx: Prisma.TransactionClient,
) => Promise<void>;

/**
 * Executes an already approved D6/D10 plan. It deliberately accepts no raw
 * institutional data and has no lifecycle ownership of PrismaService.
 */
export class OrganizationProfileReconciliationExecutor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly afterShadowWrite?: OrganizationProfileReconciliationPostWriteHook,
  ) {}

  async execute(
    plan: OrganizationProfileReconciliationPlan,
    approvedCanonicalInput: CanonicalOrganizationProfileInput,
  ): Promise<OrganizationProfileReconciliationResult> {
    if (plan.outcome === 'BLOCK_CUTOVER') {
      throw new OrganizationProfileReconciliationError('APPROVED_PLAN_BLOCKED');
    }
    if (
      plan.action === 'RECONCILE_CANONICAL_SHADOW_FROM_MAIN_LEGACY'
      && !canonicalInputsMatch(plan.canonicalInput, approvedCanonicalInput)
    ) {
      throw new OrganizationProfileReconciliationError('CANONICAL_INPUT_MISMATCH');
    }

    try {
      return await this.prisma.$transaction(
        (tx) => this.executeInTransaction(tx, plan, approvedCanonicalInput),
        { isolationLevel: 'Serializable' },
      );
    } catch (error) {
      if (error instanceof OrganizationProfileReconciliationError) throw error;
      // Serialization/deadlock/connection failures must never cause retry or
      // expose driver details. Operator re-runs only after investigation.
      throw new OrganizationProfileReconciliationError('RECONCILIATION_TRANSACTION_FAILED');
    }
  }

  private async executeInTransaction(
    tx: Transaction,
    plan: Exclude<OrganizationProfileReconciliationPlan, { outcome: 'BLOCK_CUTOVER' }>,
    approvedCanonicalInput: CanonicalOrganizationProfileInput,
  ): Promise<OrganizationProfileReconciliationResult> {
    const roots = await readRoots(tx);

    if (plan.action === 'RECONCILE_CANONICAL_SHADOW_FROM_MAIN_LEGACY') {
      requireSingletonTopology(roots, true, false);
      const shadows = roots.legacyShadow;
      if (!shadows) throw new OrganizationProfileReconciliationError('STALE_OR_MISSING_ROOT');

      const shadowState = classifyMainLegacyShadows(shadows, plan.canonicalInput);
      if (shadowState === 'CONFLICTING') {
        throw new OrganizationProfileReconciliationError(
          'CONFLICTING_CANONICAL_SHADOWS',
          differingPopulatedFields(shadows, plan.canonicalInput),
        );
      }
      if (shadowState === 'PARTIAL') {
        throw new OrganizationProfileReconciliationError('PARTIAL_CANONICAL_SHADOWS');
      }
      if (shadowState === 'ALL_NULL_OR_UNRECONCILED') {
        await tx.organizationProfile.update({
          where: { id: 1 },
          data: shadowUpdate(plan.canonicalInput),
        });
        await this.afterShadowWrite?.(tx);
      }

      const reread = await readRoots(tx);
      requireSingletonTopology(reread, true, false);
      if (!reread.legacyShadow || !matches(reread.legacyShadow, plan.canonicalInput)) {
        throw new OrganizationProfileReconciliationError('POSTVERIFY_FAILED');
      }
      return {
        action: plan.action,
        disposition: shadowState === 'ALL_NULL_OR_UNRECONCILED' ? 'RECONCILED' : 'PRESERVED',
        shadowState,
      };
    }

    if (plan.action === 'PRESERVE_CANONICAL_ROOT') {
      requireSingletonTopology(roots, false, true);
      if (!roots.canonical || !matches(roots.canonical, approvedCanonicalInput)) {
        throw new OrganizationProfileReconciliationError('CANONICAL_INPUT_MISMATCH');
      }
      const reread = await readRoots(tx);
      requireSingletonTopology(reread, false, true);
      if (!reread.canonical || !matches(reread.canonical, approvedCanonicalInput)) {
        throw new OrganizationProfileReconciliationError('POSTVERIFY_FAILED');
      }
      return { action: plan.action, disposition: 'PRESERVED' };
    }

    requireSingletonTopology(roots, true, true);
    if (!roots.legacy || !roots.canonical || !equivalent(roots.legacy, roots.canonical)
      || !matches(roots.canonical, approvedCanonicalInput)) {
      throw new OrganizationProfileReconciliationError('EQUIVALENT_ROOTS_CHANGED');
    }
    // selectedRoot was approved by D6 planner. No consolidation or write here.
    const reread = await readRoots(tx);
    requireSingletonTopology(reread, true, true);
    if (!reread.legacy || !reread.canonical || !equivalent(reread.legacy, reread.canonical)
      || !matches(reread.canonical, approvedCanonicalInput)) {
      throw new OrganizationProfileReconciliationError('POSTVERIFY_FAILED');
    }
    return { action: plan.action, disposition: 'PRESERVED' };
  }
}

export function classifyMainLegacyShadows(
  shadows: RootValues,
  input: CanonicalOrganizationProfileInput,
): MainLegacyShadowState {
  if (CANONICAL_FIELDS.every((field) => shadows[field] === null)) {
    return 'ALL_NULL_OR_UNRECONCILED';
  }
  const conflicts = differingPopulatedFields(shadows, input);
  if (conflicts.length > 0) return 'CONFLICTING';
  return matches(shadows, input) ? 'COMPLETE_AND_MATCHING' : 'PARTIAL';
}

function matches(values: RootValues, input: CanonicalOrganizationProfileInput): boolean {
  return CANONICAL_FIELDS.every((field) => values[field] === input[field]);
}

function canonicalInputsMatch(
  left: CanonicalOrganizationProfileInput,
  right: CanonicalOrganizationProfileInput,
): boolean {
  return CANONICAL_FIELDS.every((field) => left[field] === right[field]);
}

function differingPopulatedFields(values: RootValues, input: CanonicalOrganizationProfileInput): CanonicalField[] {
  return CANONICAL_FIELDS.filter((field) => values[field] !== null && values[field] !== input[field]);
}

function equivalent(legacy: RootValues, canonical: RootValues): boolean {
  return CANONICAL_FIELDS.every((field) => legacy[field] === null || legacy[field] === canonical[field]);
}

function shadowUpdate(input: CanonicalOrganizationProfileInput) {
  return {
    canonicalLegalName: input.legalName,
    canonicalLegalIdentification: input.legalIdentification,
    canonicalDinadecoRegistrationCode: input.dinadecoRegistrationCode,
    canonicalOrganizationType: input.organizationType,
    canonicalRegion: input.region,
    canonicalProvince: input.province,
    canonicalCanton: input.canton,
    canonicalDistrict: input.district,
    canonicalPhysicalAddress: input.physicalAddress,
    canonicalNotificationPhone: input.notificationPhone,
    canonicalNotificationFax: input.notificationFax,
    canonicalNotificationEmail: input.notificationEmail,
  };
}

async function readRoots(tx: Transaction): Promise<{
  legacyPresent: boolean; canonicalPresent: boolean; legacyCount: number; canonicalCount: number;
  legacyShadow: RootValues | null; legacy: RootValues | null; canonical: RootValues | null;
}> {
  const tables = await tx.$queryRawUnsafe<{ name: string }[]>(
    `SELECT relname AS name FROM pg_class WHERE oid IN (to_regclass('public."InstitutionalProfile"'), to_regclass('public."OrganizationProfile"'))`,
  );
  const legacyPresent = tables.some((table) => table.name === 'InstitutionalProfile');
  const canonicalPresent = tables.some((table) => table.name === 'OrganizationProfile');
  const legacyCount = legacyPresent ? await countRows(tx, 'InstitutionalProfile') : 0;
  const canonicalCount = canonicalPresent ? await countRows(tx, 'OrganizationProfile') : 0;
  return {
    legacyPresent, canonicalPresent, legacyCount, canonicalCount,
    legacyShadow: legacyPresent ? await readRow(tx, 'InstitutionalProfile', true) : null,
    legacy: legacyPresent ? await readRow(tx, 'InstitutionalProfile', false) : null,
    canonical: canonicalPresent ? await readRow(tx, 'OrganizationProfile', false) : null,
  };
}

async function countRows(tx: Transaction, table: 'InstitutionalProfile' | 'OrganizationProfile'): Promise<number> {
  const rows = await tx.$queryRawUnsafe<{ count: bigint }[]>(`SELECT count(*)::bigint AS count FROM public."${table}"`);
  return Number(rows[0]?.count ?? -1);
}

async function readRow(tx: Transaction, table: 'InstitutionalProfile' | 'OrganizationProfile', shadows: boolean): Promise<RootValues | null> {
  const columns = shadows
    ? CANONICAL_FIELDS.map((field) => {
      const column = `canonical${field[0].toUpperCase()}${field.slice(1)}`;
      return `"${column}" AS "${field}"`;
    }).join(', ')
    : table === 'InstitutionalProfile'
      ? `"legalName", "legalIdentification", "dinadecoRegistrationCode",
         CASE "organizationType" WHEN 'INTEGRAL' THEN 'Asociación de Desarrollo Integral'
           WHEN 'SPECIFIC' THEN 'Asociación de Desarrollo Específica' ELSE "organizationType"::text END AS "organizationType",
         "dinadecoRegion" AS "region", "province", "canton", "district",
         "correspondenceAddress" AS "physicalAddress", "phone" AS "notificationPhone",
         "telefax" AS "notificationFax", "email" AS "notificationEmail"`
      : CANONICAL_FIELDS.map((field) => `"${field}"`).join(', ');
  const rows = await tx.$queryRawUnsafe<RootValues[]>(`SELECT ${columns} FROM public."${table}" WHERE id = 1`);
  return rows[0] ?? null;
}

function requireSingletonTopology(
  roots: Awaited<ReturnType<typeof readRoots>>,
  legacy: boolean,
  canonical: boolean,
): void {
  if (roots.legacyPresent !== legacy || roots.canonicalPresent !== canonical
    || (legacy && (roots.legacyCount !== 1 || !roots.legacyShadow || !roots.legacy))
    || (canonical && (roots.canonicalCount !== 1 || !roots.canonical))) {
    throw new OrganizationProfileReconciliationError('STALE_OR_MISSING_ROOT');
  }
}
