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
  CapabilityGuard,
  JwtAuthGuard,
  RequireCapabilities,
  type AuthenticatedUser,
} from '../auth';
import {
  CreateVentureDto,
  QueryVenturesDto,
  UpdateVentureDto,
} from './dto/venture.dto';
import { EntrepreneurshipService } from './entrepreneurship.service';

type AuthRequest = Request & { user: AuthenticatedUser };

@Controller('ventures')
@UseGuards(JwtAuthGuard, CapabilityGuard)
export class EntrepreneurshipController {
  constructor(private readonly service: EntrepreneurshipService) {}

  @Get()
  @RequireCapabilities('ent.ventures.read')
  findAll(@Query() query: QueryVenturesDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @RequireCapabilities('ent.ventures.read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @RequireCapabilities('ent.ventures.create')
  create(@Body() dto: CreateVentureDto, @Req() req: AuthRequest) {
    return this.service.create(dto, req.user.id, this.context(req));
  }

  @Patch(':id')
  @RequireCapabilities('ent.ventures.update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVentureDto,
    @Req() req: AuthRequest,
  ) {
    return this.service.update(id, dto, req.user.id, this.context(req));
  }

  private context(req: Request) {
    return { ipAddress: req.ip, userAgent: req.get('user-agent') };
  }
}
