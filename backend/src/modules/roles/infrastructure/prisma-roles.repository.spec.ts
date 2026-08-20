import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaRolesRepository } from './prisma-roles.repository';

describe('PrismaRolesRepository', () => {
  it('returns active roles ordered by name', async () => {
    const db = {
      role: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 1,
            name: 'Administrador',
            description: 'Root',
            isActive: true,
          },
          {
            id: 2,
            name: 'Tesorero',
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
      { id: 1, name: 'Administrador', description: 'Root', isActive: true },
      { id: 2, name: 'Tesorero', description: null, isActive: true },
    ]);
    expect(db.role.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  });
});
