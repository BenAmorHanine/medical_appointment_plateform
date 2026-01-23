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
} from '@nestjs/common';
import type { Response } from 'express';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { createReadStream } from 'fs';

@Controller('consultations')
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Post()
  create(@Body() dto: CreateConsultationDto) {
    return this.consultationsService.create(dto);
  }

  @Get()
  findAll() {
    return this.consultationsService.findAll();
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
  findOne(@Param('id') id: string) {
    return this.consultationsService.findOne(id);
  }
}
