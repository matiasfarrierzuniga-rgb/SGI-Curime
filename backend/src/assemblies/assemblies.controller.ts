import {
  Body,
  Controller,
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
import { Roles } from '../auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/presentation/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/domain/entities/auth-user';
import { AssembliesService } from './assemblies.service';
import { CreateAssemblyDto, UpdateAssemblyDto } from './dto/assembly.dto';
import { QueryAssembliesDto } from './dto/query-assemblies.dto';
import { RecordAttendanceDto } from './dto/record-attendance.dto';
type AuthRequest = Request & { user: AuthenticatedUser };
@Controller('assemblies')
@Roles('Administrador')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssembliesController {
  constructor(private readonly service: AssembliesService) {}
  @Post() create(@Body() dto: CreateAssemblyDto, @Req() req: AuthRequest) {
    return this.service.create(dto, req.user.id, this.context(req));
  }
  @Get() findAll(@Query() q: QueryAssembliesDto) {
    return this.service.findAll(q);
  }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
  @Patch(':id') update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAssemblyDto,
    @Req() req: AuthRequest,
  ) {
    return this.service.update(id, dto, req.user.id, this.context(req));
  }
  @Get(':id/attendance') attendance(@Param('id', ParseIntPipe) id: number) {
    return this.service.getAttendance(id);
  }
  @Put(':id/attendance') record(
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
