import { PrismaService } from '../prisma/prisma.service';
import { RolesService } from './roles.service';

describe('RolesService', () => {
  it('returns only safe fields from active roles ordered by name', async () => {
    const prisma = {
      role: { findMany: jest.fn().mockResolvedValue([{ id: 1, name: 'Administrador' }]) },
    };
    const service = new RolesService(prisma as unknown as PrismaService);

    await expect(service.findActive()).resolves.toEqual([{ id: 1, name: 'Administrador' }]);
    expect(prisma.role.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  });
});
