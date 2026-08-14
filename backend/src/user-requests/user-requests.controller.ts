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
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateUserRequestDto } from './dto/create-user-request.dto';
import { QueryUserRequestDto } from './dto/query-user-request.dto';
import {
  ApproveUserRequestDto,
  RejectUserRequestDto,
} from './dto/review-user-request.dto';
import { UserRequestsService } from './user-requests.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('user-requests')
export class UserRequestsController {
  constructor(private readonly service: UserRequestsService) {}

  @Post()
  create(@Body() dto: CreateUserRequestDto, @Req() request: Request) {
    return this.service.create(dto, this.context(request));
  }

  @Get()
  @Roles('Administrador')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll(@Query() query: QueryUserRequestDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles('Administrador')
  @UseGuards(JwtAuthGuard, RolesGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id/reject')
  @Roles('Administrador')
  @UseGuards(JwtAuthGuard, RolesGuard)
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectUserRequestDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.reject(id, dto.rejectionReason, request.user.id, this.context(request));
  }

  @Patch(':id/approve')
  @Roles('Administrador')
  @UseGuards(JwtAuthGuard, RolesGuard)
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveUserRequestDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.service.approve(id, dto, request.user.id, this.context(request));
  }
  private context(request: Request) { return { ipAddress: request.ip, userAgent: request.get('user-agent') }; }
}
