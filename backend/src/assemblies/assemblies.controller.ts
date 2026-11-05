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
  RequireAnyCapabilities,
  type AuthenticatedUser,
} from '../auth';
import { AssembliesService } from './assemblies.service';
import { CreateAssemblyDto, UpdateAssemblyDto } from './dto/assembly.dto';
import { QueryAssembliesDto } from './dto/query-assemblies.dto';
import { RecordAttendanceDto } from './dto/record-attendance.dto';
import { UpdateConvocationsDto } from './dto/update-convocations.dto';
import { UpdateAssemblyCallsDto } from './dto/update-assembly-calls.dto';

type AuthRequest = Request & { user: AuthenticatedUser };

@Controller('assemblies')
@UseGuards(JwtAuthGuard, CapabilityGuard)
export class AssembliesController {
  constructor(private readonly service: AssembliesService) {}

  @Post()
  @RequireAnyCapabilities('governance.assembly.create', 'adm.assemblies.manage')
  create(@Body() dto: CreateAssemblyDto, @Req() req: AuthRequest) {
    return this.service.create(dto, req.user.id, this.context(req));
  }

  @Get()
  @RequireAnyCapabilities('governance.assembly.session', 'adm.assemblies.read')
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
  @RequireAnyCapabilities('governance.assembly.create', 'adm.assemblies.manage')
  eligibleAffiliates() {
    return this.service.listEligibleAffiliates();
  }

  @Get(':id')
  @RequireAnyCapabilities('governance.assembly.session', 'adm.assemblies.read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.detail(id);
  }

  @Patch(':id')
  @RequireAnyCapabilities('governance.assembly.create', 'adm.assemblies.manage')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAssemblyDto,
    @Req() req: AuthRequest,
  ) {
    return this.service.update(id, dto, req.user.id, this.context(req));
  }

  @Get(':id/convocations')
  @RequireAnyCapabilities('governance.assembly.session', 'adm.assemblies.read')
  convocations(@Param('id', ParseIntPipe) id: number) {
    return this.service.getConvocations(id);
  }

  @Get(':id/calls')
  @RequireAnyCapabilities('governance.assembly.session', 'adm.assemblies.read')
  calls(@Param('id', ParseIntPipe) id: number) {
    return this.service.getCalls(id);
  }

  @Put(':id/calls')
  @RequireAnyCapabilities('governance.assembly.create', 'adm.assemblies.manage')
  replaceCalls(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAssemblyCallsDto,
    @Req() req: AuthRequest,
  ) {
    return this.service.replaceCalls(id, dto.calls, req.user.id, this.context(req));
  }

  @Put(':id/convocations')
  @RequireAnyCapabilities('governance.assembly.create', 'adm.assemblies.manage')
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
  @RequireAnyCapabilities('governance.assembly.session', 'adm.assemblies.manage')
  start(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.start(id, req.user.id, this.context(req));
  }

  @Post(':id/complete')
  @RequireAnyCapabilities('governance.assembly.session', 'adm.assemblies.manage')
  complete(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.complete(id, req.user.id, this.context(req));
  }

  @Delete(':id')
  @RequireAnyCapabilities('governance.assembly.create', 'adm.assemblies.manage')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.remove(id, req.user.id, this.context(req));
  }

  @Get(':id/quorum')
  @RequireAnyCapabilities('governance.assembly.session', 'adm.assemblies.read')
  quorum(@Param('id', ParseIntPipe) id: number) {
    return this.service.getQuorum(id);
  }

  @Get(':id/attendance')
  @RequireAnyCapabilities('governance.assembly.session', 'adm.assemblies.read')
  attendance(@Param('id', ParseIntPipe) id: number) {
    return this.service.getAttendance(id);
  }

  @Put(':id/attendance')
  @RequireAnyCapabilities('governance.attendance.scan', 'adm.assemblies.manage')
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
