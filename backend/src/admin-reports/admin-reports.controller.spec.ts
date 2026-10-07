import { StreamableFile, type ExecutionContext } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { Readable } from 'node:stream';
import type { Request } from 'express';
import { JwtAuthGuard, RolesGuard, type AuthenticatedUser } from '../auth';
import { ROLES_KEY } from '../auth/presentation/decorators/roles.decorator';
import { AdminReportsController } from './admin-reports.controller';
import { AdminReportsService } from './admin-reports.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

describe('AdminReportsController', () => {
  const service = {
    dashboard: jest.fn(),
    affiliatesSummary: jest.fn(),
    affiliatesReport: jest.fn(),
    exportAffiliatesCsv: jest.fn(),
    attendanceSummary: jest.fn(),
    justificationsSummary: jest.fn(),
    sanctionsSummary: jest.fn(),
  };
  const user = {
    id: 12,
    fullName: 'Persona Administradora',
    email: 'admin@example.com',
    status: 'ACTIVE',
    role: 'Administrador',
    canAccessErp: true,
  };
  const request = { user } as AuthenticatedRequest;
  let controller: AdminReportsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AdminReportsController(
      service as unknown as AdminReportsService,
    );
  });

  it('passes only the safe report identity to the service', async () => {
    await controller.attendance({ assemblyId: 3 }, request);

    expect(service.attendanceSummary).toHaveBeenCalledWith(
      { assemblyId: 3 },
      { id: 12, fullName: 'Persona Administradora' },
    );
  });

  it('passes only the safe report identity to the dashboard facade', async () => {
    await controller.dashboard(request);

    expect(service.dashboard).toHaveBeenCalledWith({
      id: 12,
      fullName: 'Persona Administradora',
    });
  });

  it('passes affiliate report filters and safe report identity to the service', async () => {
    const query = { page: 2, limit: 20, search: 'Pérez' };
    await controller.affiliateReport(query, request);

    expect(service.affiliatesReport).toHaveBeenCalledWith(query, {
      id: 12,
      fullName: 'Persona Administradora',
    });
  });

  it('streams the affiliates CSV with a dated attachment filename', () => {
    const query = {
      search: 'Pérez',
      subscriptionStatus: 'CURRENT' as const,
      page: 1,
      limit: 20,
    };
    service.exportAffiliatesCsv.mockReturnValue(Readable.from(['csv']));

    const file = controller.exportAffiliates(query);

    expect(service.exportAffiliatesCsv).toHaveBeenCalledWith(query);
    expect(file).toBeInstanceOf(StreamableFile);
    const headers = file.getHeaders();
    expect(headers.type).toBe('text/csv; charset=utf-8');
    expect(headers.disposition).toMatch(
      /^attachment; filename="reporte-afiliados-membresias-\d{4}-\d{2}-\d{2}\.csv"$/,
    );
  });

  it('keeps all admin report endpoints restricted to administrators', () => {
    expect(Reflect.getMetadata(ROLES_KEY, AdminReportsController)).toEqual([
      'Administrador',
    ]);
    expect(
      Reflect.getMetadata(GUARDS_METADATA, AdminReportsController),
    ).toEqual([JwtAuthGuard, RolesGuard]);
  });

  it('allows only authorized administrators through the report role guard', () => {
    const guard = new RolesGuard(new Reflector());
    const canActivate = guard.canActivate.bind(guard);
    const reportHandler = () => undefined;
    const contextFor = (
      role: string,
      canAccessErp: boolean,
    ): ExecutionContext =>
      ({
        getHandler: () => reportHandler,
        getClass: () => AdminReportsController,
        switchToHttp: () => ({
          getRequest: () => ({
            user: { ...user, role, canAccessErp },
          }),
        }),
      }) as unknown as ExecutionContext;

    expect(canActivate(contextFor('Administrador', true))).toBe(true);
    expect(canActivate(contextFor('Tesorero', true))).toBe(false);
    expect(canActivate(contextFor('Administrador', false))).toBe(false);
  });
});
