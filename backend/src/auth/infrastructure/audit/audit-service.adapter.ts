import { Injectable } from '@nestjs/common';
import { AuditService } from '../../../audit/audit.service';
import type { AuditEvent, AuditPort } from '../../application/ports/audit.port';

@Injectable()
export class AuditServiceAdapter implements AuditPort {
  constructor(private readonly auditService: AuditService) {}

  async record(event: AuditEvent): Promise<void> {
    await this.auditService.log(event);
  }
}
