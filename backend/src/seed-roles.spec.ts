import { ensureInitialRoles, INITIAL_ROLES } from '../prisma/seed-roles';

describe('initial role seed', () => {
  it('ensures Miembro de Junta Directiva idempotently without removing base roles', async () => {
    const upsert =
      jest.fn<
        (args: {
          where: { name: string };
          update: object;
          create: object;
        }) => void
      >();
    const transaction = jest
      .fn<(operations: unknown[]) => Promise<void>>()
      .mockResolvedValue(undefined);
    const prisma = { role: { upsert }, $transaction: transaction };

    await ensureInitialRoles(prisma);
    await ensureInitialRoles(prisma);

    expect(INITIAL_ROLES.map((role) => role.name)).toEqual(
      expect.arrayContaining([
        'Administrador',
        'Tesorero',
        'Gestor de Inventario',
        'Vecino/Afiliado',
        'Miembro de Junta Directiva',
        'Subscription_L1',
      ]),
    );
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { name: 'Miembro de Junta Directiva' },
        update: {},
      }),
    );
    expect(transaction).toHaveBeenCalledTimes(2);
  });
});
