import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import {
  applyCanonicalRbacPlan,
  inspectCanonicalRbac,
} from './canonical-rbac-sync';
import { getPostgresConnectionConfig } from '../src/prisma/postgres-connection';

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required.');

  const prisma = new PrismaClient({
    adapter: new PrismaPg(getPostgresConnectionConfig(connectionString)),
  });
  try {
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        permissions: { select: { permission: { select: { code: true } } } },
      },
    });
    const plan = inspectCanonicalRbac(
      roles.map((role) => ({
        ...role,
        permissionCodes: role.permissions.map(
          ({ permission }) => permission.code,
        ),
      })),
    );

    if (!process.argv.includes('--apply')) {
      console.log(JSON.stringify(plan, null, 2));
      return;
    }

    await applyCanonicalRbacPlan(
      {
        ensurePermission: async (code) => {
          await prisma.permission.upsert({
            where: { code },
            update: {},
            create: { code, name: code },
          });
        },
        ensureRolePermission: async (roleName, permissionCode) => {
          const [role, permission] = await Promise.all([
            prisma.role.findUniqueOrThrow({ where: { name: roleName } }),
            prisma.permission.findUniqueOrThrow({
              where: { code: permissionCode },
            }),
          ]);
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: permission.id,
              },
            },
            update: {},
            create: { roleId: role.id, permissionId: permission.id },
          });
        },
        revokeRolePermission: async (roleName, permissionCode) => {
          await prisma.rolePermission.deleteMany({
            where: {
              role: { name: roleName },
              permission: { code: permissionCode },
            },
          });
        },
      },
      plan,
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main();
