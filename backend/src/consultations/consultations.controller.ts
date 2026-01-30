import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
  StreamableFile,
  Header,
  HttpStatus,
  HttpException,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { createReadStream } from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('consultations')
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor')
  create(@Body() dto: CreateConsultationDto) {
    return this.consultationsService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll() {
    return this.consultationsService.findAll();
  }

  @Get('doctor/:doctorId')
  @UseGuards(JwtAuthGuard)
  findByDoctor(@Param('doctorId') doctorId: string) {
    return this.consultationsService.findByDoctor(doctorId);
  }

  @Get('patient/:patientId')
  @UseGuards(JwtAuthGuard)
  findByPatient(@Param('patientId') patientId: string) {
    return this.consultationsService.findByPatient(patientId);
  }

  @Get(':id/ordonnance')
  @UseGuards(JwtAuthGuard)
  @Header('Content-Type', 'application/pdf')
  async getOrdonnance(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const pdfPath = await this.consultationsService.getOrdonnancePath(id);
    const file = createReadStream(pdfPath);

    res.set({
      'Content-Disposition': `attachment; filename="ordonnance-${id}.pdf"`,
    });

    return new StreamableFile(file);
  }

  @Get(':id/certificat')
  @UseGuards(JwtAuthGuard)
  @Header('Content-Type', 'application/pdf')
  async getCertificat(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const pdfPath = await this.consultationsService.getCertificatPath(id);
    const file = createReadStream(pdfPath);

    res.set({
      'Content-Disposition': `attachment; filename="certificat-${id}.pdf"`,
    });

    return new StreamableFile(file);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.consultationsService.findOne(id);
  }
  }
