import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaRolesRepository } from './prisma-roles.repository';

describe('PrismaRolesRepository', () => {
  it('returns only active canonical roles ordered by name', async () => {
    const db = {
      role: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 1,
            name: 'ROLE_SYSTEM_ADMIN',
            description: 'Root',
            isActive: true,
          },
          {
            id: 2,
            name: 'ROLE_INSTITUTIONAL_TREASURER',
            description: null,
            isActive: true,
          },
        ]),
      },
    };
    const repository = new PrismaRolesRepository(
      db as unknown as PrismaService,
    );

    await expect(repository.findActive()).resolves.toEqual([
      { id: 1, name: 'ROLE_SYSTEM_ADMIN', description: 'Root', isActive: true },
      { id: 2, name: 'ROLE_INSTITUTIONAL_TREASURER', description: null, isActive: true },
    ]);
    expect(db.role.findMany).toHaveBeenCalledWith({
      where: {
        isActive: true,
        name: {
          in: [
            'ROLE_COMMUNITY_USER',
            'ROLE_SYSTEM_ADMIN',
            'ROLE_INSTITUTIONAL_PRESIDENT',
            'ROLE_INSTITUTIONAL_SECRETARY',
            'ROLE_INSTITUTIONAL_TREASURER',
            'ROLE_INSTITUTIONAL_OPERATOR',
          ],
        },
      },
      orderBy: { name: 'asc' },
    });
  });
});
