import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { CapabilityGuard, JwtAuthGuard, RequireCapabilities, type AuthenticatedUser } from '../auth';
import { CreateBoardAppointmentDto, UpdateBoardAppointmentDto } from './dto/board-appointment.dto';
import { CreateBoardTermDto, UpdateBoardTermDto } from './dto/board-term.dto';
import { PersonCandidatesQueryDto } from './dto/person-candidates.dto';
import { InstitutionalBoardService } from './institutional-board.service';
type AuthRequest = Request & { user: AuthenticatedUser };

@Controller('institutional-board')
@UseGuards(JwtAuthGuard, CapabilityGuard)
export class InstitutionalBoardController {
  constructor(private readonly service: InstitutionalBoardService) {}
  @Get('terms') @RequireCapabilities('adm.institutional-board.read') listTerms() { return this.service.listTerms(); }
  @Get('terms/:id') @RequireCapabilities('adm.institutional-board.read') getTerm(@Param('id', ParseIntPipe) id: number) { return this.service.getTerm(id); }
  @Get('person-candidates') @RequireCapabilities('adm.institutional-board.read') candidates(@Query() q: PersonCandidatesQueryDto) { return this.service.findPersonCandidates(q.query); }
  @Post('terms') @RequireCapabilities('adm.institutional-board.manage') createTerm(@Body() dto: CreateBoardTermDto, @Req() req: AuthRequest) { return this.service.createTerm(dto, req.user.id, this.context(req)); }
  @Patch('terms/:id') @RequireCapabilities('adm.institutional-board.manage') updateTerm(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBoardTermDto, @Req() req: AuthRequest) { return this.service.updateTerm(id, dto, req.user.id, this.context(req)); }
  @Post('terms/:termId/appointments') @RequireCapabilities('adm.institutional-board.manage') createAppointment(@Param('termId', ParseIntPipe) termId: number, @Body() dto: CreateBoardAppointmentDto, @Req() req: AuthRequest) { return this.service.createAppointment(termId, dto, req.user.id, this.context(req)); }
  @Patch('appointments/:id') @RequireCapabilities('adm.institutional-board.manage') updateAppointment(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBoardAppointmentDto, @Req() req: AuthRequest) { return this.service.updateAppointment(id, dto, req.user.id, this.context(req)); }
  private context(req: Request) { return { ipAddress: req.ip, userAgent: req.get('user-agent') }; }
}
