import assert from 'node:assert/strict';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import {
  runMinimalBootstrap,
  type MinimalBootstrapClient,
} from '../../prisma/minimal-bootstrap';
import { CANONICAL_ROLE_CODES } from '../../src/auth/domain/policies/canonical-role-catalog';
import { CANONICAL_ROLE_GRANTS } from '../../src/auth/domain/policies/canonical-role-grants';
import { getPostgresConnectionConfig } from '../../src/prisma/postgres-connection';
import { validateDisposableEnvironment } from './disposable-postgres-guard.mjs';

validateDisposableEnvironment(process.env);
const connectionString = process.env.TEST_DATABASE_URL!;
const prisma = new PrismaClient({
  adapter: new PrismaPg(getPostgresConnectionConfig(connectionString)),
});
const admin = {
  fullName: 'Administración Inicial de Prueba',
  identification: 'bootstrap-test-identity',
  email: 'bootstrap-admin@example.test',
  password: 'BootstrapPassword1',
};

async function operationalCounts() {
  const [resources, items, affiliates, movements, reservations] =
    await Promise.all([
      prisma.reservableResource.count(),
      prisma.inventoryItem.count(),
      prisma.affiliate.count(),
      prisma.financialMovement.count(),
      prisma.reservation.count(),
    ]);
  return { resources, items, affiliates, movements, reservations };
}

async function main() {
  const before = await operationalCounts();
  const first = await runMinimalBootstrap(
    prisma as unknown as MinimalBootstrapClient,
    admin,
  );
  const created = await prisma.user.findUniqueOrThrow({
    where: { email: admin.email },
  });
  const firstHash = created.passwordHash;
  const second = await runMinimalBootstrap(
    prisma as unknown as MinimalBootstrapClient,
    admin,
  );
  const after = await operationalCounts();
  const persisted = await prisma.user.findUniqueOrThrow({
    where: { email: admin.email },
    include: { role: true },
  });
  const canonicalRoles = await prisma.role.findMany({
    where: { name: { in: [...CANONICAL_ROLE_CODES] } },
    include: { permissions: { include: { permission: true } } },
  });
  const audits = await prisma.auditLog.count({
    where: {
      action: 'USER_CREATED',
      module: 'SYSTEM',
      entityId: String(persisted.id),
    },
  });

  assert.equal(first.administrator, 'CREATED');
  assert.equal(second.administrator, 'UNCHANGED');
  assert.deepEqual(after, before);
  assert.equal(canonicalRoles.length, 6);
  for (const role of canonicalRoles) {
    assert.deepEqual(
      role.permissions.map(({ permission }) => permission.code).sort(),
      [
        ...CANONICAL_ROLE_GRANTS[
          role.name as keyof typeof CANONICAL_ROLE_GRANTS
        ],
      ].sort(),
    );
  }
  assert.equal(persisted.role.name, 'ROLE_SYSTEM_ADMIN');
  assert.equal(persisted.status, 'ACTIVE');
  assert.equal(persisted.personId, null);
  assert.equal(persisted.passwordHash, firstHash);
  assert(firstHash && (await bcrypt.compare(admin.password, firstHash)));
  assert.equal(audits, 1);
  console.log(
    'minimal-bootstrap integration: isolated PostgreSQL checks passed',
  );
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error: unknown) => {
    console.error('minimal-bootstrap integration failed');
    if (error instanceof Error) console.error(error.message);
    process.exitCode = 1;
  });
