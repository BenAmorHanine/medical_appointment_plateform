import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  StreamableFile,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { createReadStream } from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@Controller('consultations')
@UseGuards(JwtAuthGuard)
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('doctor')
  create(@Body() dto: CreateConsultationDto) {
    return this.consultationsService.create(dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  findAll(@Query() query: PaginationQueryDto) {
    return this.consultationsService.findAll(query);
  }

  @Get('doctor/:doctorId')
  findByDoctor(@Param('doctorId') doctorId: string) {
    return this.consultationsService.findByDoctor(doctorId);
  }

  @Get('patient/:patientId')
  findByPatient(@Param('patientId') patientId: string) {
    return this.consultationsService.findByPatient(patientId);
  }

  @Get(':id/ordonnance')
  async getOrdonnance(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return this.servePdf(id, 'ordonnance', res);
  }

  @Get(':id/certificat')
  async getCertificat(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    return this.servePdf(id, 'certificat', res);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.consultationsService.findOne(id);
  }

  /**
   * Helper method pour servir les fichiers PDF
   * StreamableFile est une classe NestJS qui permet d'envoyer des fichiers efficacement.
   */
  private async servePdf(
    id: string,
    type: 'ordonnance' | 'certificat',
    res: Response,
  ): Promise<StreamableFile> {
    const { path, filename } = await this.consultationsService.servePdfFile(
      id,
      type,
    );

    return new StreamableFile(createReadStream(path), {
      type: 'application/pdf',
      disposition: `attachment; filename="${filename}"`,
    });
  }
}
