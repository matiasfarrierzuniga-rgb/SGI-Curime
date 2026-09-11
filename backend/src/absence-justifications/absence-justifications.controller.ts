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
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth';
import type { AuthenticatedUser } from '../auth';
import { AbsenceJustificationsService } from './absence-justifications.service';
import {
  CreateJustificationDto,
  DecisionJustificationDto,
  ApproveJustificationDto,
  QueryJustificationsDto,
  RegisterAffiliateJustificationDto,
  RejectJustificationDto,
} from './dto/justification.dto';
type AuthRequest = Request & { user: AuthenticatedUser };
@Controller()
export class AbsenceJustificationsController {
  constructor(private readonly service: AbsenceJustificationsService) {}
  @Roles('Administrador')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('assemblies/:assemblyId/justifications')
  create(
    @Param('assemblyId', ParseIntPipe) assemblyId: number,
    @Body() dto: CreateJustificationDto,
    @Req() req: AuthRequest,
  ) {
    return this.service.create(assemblyId, dto, req.user.id, this.context(req));
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('attachment', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @Post('me/absence-justifications')
  registerMine(
    @Body() payload: RegisterAffiliateJustificationDto,
    @UploadedFile()
    file:
      | { originalname: string; mimetype: string; size: number; buffer: Buffer }
      | undefined,
    @Req() req: AuthRequest,
  ) {
    return this.service.registerMine(
      payload,
      file,
      req.user.id,
      this.context(req),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/absence-justifications')
  findMine(@Query() q: QueryJustificationsDto, @Req() req: AuthRequest) {
    return this.service.findMine(q, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('attachment', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @Post('affiliates/:affiliateId/absence-justifications')
  registerForAffiliate(
    @Param('affiliateId', ParseIntPipe) affiliateId: number,
    @Body() payload: RegisterAffiliateJustificationDto,
    @UploadedFile()
    file:
      | { originalname: string; mimetype: string; size: number; buffer: Buffer }
      | undefined,
    @Req() req: AuthRequest,
  ) {
    return this.service.registerFromAffiliate(
      payload.assemblyId,
      affiliateId,
      payload,
      file,
      req.user.id,
      this.context(req),
    );
  }
  @Roles('Administrador')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('absence-justifications')
  findAll(@Query() q: QueryJustificationsDto) {
    return this.service.findAll(q);
  }

  @UseGuards(JwtAuthGuard)
  @Get('absence-justifications/:id/evidence/file')
  getEvidenceFile(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthRequest,
  ): Promise<StreamableFile> {
    return this.service
      .getEvidenceFile(id, { id: req.user.id, role: req.user.role })
      .then(
        ({ stream, mimeType, fileName }) =>
          new StreamableFile(stream, {
            type: mimeType,
            disposition: `inline; filename="${fileName.replace(/"/g, '')}"`,
          }),
      );
  }

  @UseGuards(JwtAuthGuard)
  @Get('affiliates/:affiliateId/absence-justifications')
  findForAffiliate(
    @Param('affiliateId', ParseIntPipe) affiliateId: number,
    @Query() q: QueryJustificationsDto,
    @Req() req: AuthRequest,
  ) {
    return this.service.findForAffiliate(affiliateId, q, req.user.id);
  }

  @Roles('Administrador')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('absence-justifications/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('absence-justifications/:id/evidence')
  getEvidence(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.getEvidence(id, {
      id: req.user.id,
      role: req.user.role,
    });
  }

  @Roles('Administrador')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('absence-justifications/:id/decision')
  decide(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DecisionJustificationDto,
    @Req() req: AuthRequest,
  ) {
    return this.service.decide(
      id,
      dto.status,
      dto.observation ?? null,
      req.user.id,
      this.context(req),
    );
  }

  @Roles('Administrador')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('absence-justifications/:id/approve')
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveJustificationDto,
    @Req() req: AuthRequest,
  ) {
    return this.service.approve(
      id,
      dto.observation ?? null,
      req.user.id,
      this.context(req),
    );
  }

  @Roles('Administrador')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('absence-justifications/:id/reject')
  reject(
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
