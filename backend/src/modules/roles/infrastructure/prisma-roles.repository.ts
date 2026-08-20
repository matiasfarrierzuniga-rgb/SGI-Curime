import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { Role } from '../domain/entities/role';
import type { RolesRepository } from '../domain/repositories/roles-repository';

@Injectable()
export class PrismaRolesRepository implements RolesRepository {
  constructor(private readonly db: PrismaService) {}

  async findActive(): Promise<Role[]> {
    const roles = await this.db.role.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return roles.map(toRole);
  }
}

function toRole(role: {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
}): Role {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isActive: role.isActive,
  };
}
