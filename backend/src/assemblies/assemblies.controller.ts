import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  CapabilityGuard,
  JwtAuthGuard,
  RequireCapabilities,
  type AuthenticatedUser,
} from '../auth';
import { AssembliesService } from './assemblies.service';
import { CreateAssemblyDto, UpdateAssemblyDto } from './dto/assembly.dto';
import { QueryAssembliesDto } from './dto/query-assemblies.dto';
import { RecordAttendanceDto } from './dto/record-attendance.dto';
import { UpdateConvocationsDto } from './dto/update-convocations.dto';

type AuthRequest = Request & { user: AuthenticatedUser };

@Controller('assemblies')
@UseGuards(JwtAuthGuard, CapabilityGuard)
export class AssembliesController {
  constructor(private readonly service: AssembliesService) {}

  @Post()
  @RequireCapabilities('adm.assemblies.manage')
  create(@Body() dto: CreateAssemblyDto, @Req() req: AuthRequest) {
    return this.service.create(dto, req.user.id, this.context(req));
  }

  @Get()
  @RequireCapabilities('adm.assemblies.read')
  findAll(@Query() query: QueryAssembliesDto) {
    return this.service.findAll(query);
  }

  @Get('mine')
  findMine(@Req() req: AuthRequest) {
    if (!req.user.canAccessErp)
      throw new ForbiddenException('Internal access required');
    return this.service.findMine(req.user.id);
  }

  @Get('eligible-affiliates')
  @RequireCapabilities('adm.assemblies.read')
  eligibleAffiliates() {
    return this.service.listEligibleAffiliates();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    if (!req.user.canAccessErp)
      throw new ForbiddenException('Internal access required');
    return this.service.findOneAllowed(id, req.user.id, req.user.role);
  }

  @Patch(':id')
  @RequireCapabilities('adm.assemblies.manage')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAssemblyDto,
    @Req() req: AuthRequest,
  ) {
    return this.service.update(id, dto, req.user.id, this.context(req));
  }

  @Get(':id/convocations')
  @RequireCapabilities('adm.assemblies.read')
  convocations(@Param('id', ParseIntPipe) id: number) {
    return this.service.getConvocations(id);
  }

  @Put(':id/convocations')
  @RequireCapabilities('adm.assemblies.manage')
  replaceConvocations(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateConvocationsDto,
    @Req() req: AuthRequest,
  ) {
    return this.service.replaceConvocations(
      id,
      dto.affiliateIds,
      req.user.id,
      this.context(req),
    );
  }

  @Post(':id/start')
  @RequireCapabilities('adm.assemblies.manage')
  start(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.start(id, req.user.id, this.context(req));
  }

  @Post(':id/complete')
  @RequireCapabilities('adm.assemblies.manage')
  complete(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.complete(id, req.user.id, this.context(req));
  }

  @Delete(':id')
  @RequireCapabilities('adm.assemblies.manage')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.remove(id, req.user.id, this.context(req));
  }

  @Get(':id/quorum')
  @RequireCapabilities('adm.assemblies.read')
  quorum(@Param('id', ParseIntPipe) id: number) {
    return this.service.getQuorum(id);
  }

  @Get(':id/attendance')
  @RequireCapabilities('adm.assemblies.read')
  attendance(@Param('id', ParseIntPipe) id: number) {
    return this.service.getAttendance(id);
  }

  @Put(':id/attendance')
  @RequireCapabilities('adm.assemblies.manage')
  record(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RecordAttendanceDto,
    @Req() req: AuthRequest,
  ) {
    return this.service.recordAttendance(
      id,
      dto,
      req.user.id,
      this.context(req),
    );
  }

  private context(req: Request) {
    return { ipAddress: req.ip, userAgent: req.get('user-agent') };
  }
}
