import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '../auth';
import type { AuthenticatedUser } from '../auth';
import { AbsenceJustificationsService } from './absence-justifications.service';
import {
  CreateJustificationDto,
  QueryJustificationsDto,
  RejectJustificationDto,
} from './dto/justification.dto';
type AuthRequest = Request & { user: AuthenticatedUser };
@Controller()
@Roles('Administrador')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AbsenceJustificationsController {
  constructor(private readonly service: AbsenceJustificationsService) {}
  @Post('assemblies/:assemblyId/justifications') create(
    @Param('assemblyId', ParseIntPipe) assemblyId: number,
    @Body() dto: CreateJustificationDto,
    @Req() req: AuthRequest,
  ) {
    return this.service.create(assemblyId, dto, req.user.id, this.context(req));
  }
  @Get('absence-justifications') findAll(@Query() q: QueryJustificationsDto) {
    return this.service.findAll(q);
  }
  @Get('absence-justifications/:id') findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.findOne(id);
  }
  @Patch('absence-justifications/:id/approve') approve(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthRequest,
  ) {
    return this.service.approve(id, req.user.id, this.context(req));
  }
  @Patch('absence-justifications/:id/reject') reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectJustificationDto,
    @Req() req: AuthRequest,
  ) {
    return this.service.reject(
      id,
      dto.rejectionReason,
      req.user.id,
      this.context(req),
    );
  }
  private context(req: Request) {
    return { ipAddress: req.ip, userAgent: req.get('user-agent') };
  }
}
