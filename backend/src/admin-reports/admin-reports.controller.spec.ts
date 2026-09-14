import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth';
import { ROLES_KEY } from '../auth/presentation/decorators/roles.decorator';
import { AdminReportsController } from './admin-reports.controller';
import { AdminReportsService } from './admin-reports.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

describe('AdminReportsController', () => {
  const service = {
    dashboard: jest.fn(),
    affiliatesSummary: jest.fn(),
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

  it('passes only the safe report identity to the service', () => {
    controller.attendance({ assemblyId: 3 }, request);

    expect(service.attendanceSummary).toHaveBeenCalledWith(
      { assemblyId: 3 },
      { id: 12, fullName: 'Persona Administradora' },
    );
  });

  it('passes only the safe report identity to the dashboard facade', () => {
    controller.dashboard(request);

    expect(service.dashboard).toHaveBeenCalledWith({
      id: 12,
      fullName: 'Persona Administradora',
    });
  });

  it('keeps all admin report endpoints restricted to administrators', () => {
    expect(Reflect.getMetadata(ROLES_KEY, AdminReportsController)).toEqual([
      'Administrador',
    ]);
  });
});
