import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
  UsePipes,
  ValidationPipe,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import * as fs from 'fs';

@Controller('consultations')
export class ConsultationsController {
  constructor(
    private readonly consultationsService: ConsultationsService,
  ) {}

  @Post()
  @UsePipes(ValidationPipe)
  async create(@Body() createConsultationDto: CreateConsultationDto) {
    return await this.consultationsService.create(createConsultationDto);
  }

  @Get()
  async findAll() {
    return await this.consultationsService.findAll();
  }

  @Get('doctor/:doctorId')
  async findByDoctor(@Param('doctorId') doctorId: string) {
    return await this.consultationsService.findByDoctor(doctorId);
  }

  @Get('patient/:patientId')
  async findByPatient(@Param('patientId') patientId: string) {
    return await this.consultationsService.findByPatient(patientId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.consultationsService.findOne(id);
  }

  @Get(':id/ordonnance')
  async getOrdonnance(@Param('id') id: string, @Res() res: Response) {
    try {
      const pdfPath = await this.consultationsService.getOrdonnancePath(id);
      const file = fs.createReadStream(pdfPath);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="ordonnance-${id}.pdf"`,
      );
      
      file.pipe(res);
    } catch (error) {
      res.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: error.message,
      });
    }
  }

  @Get(':id/certificat')
  async getCertificat(@Param('id') id: string, @Res() res: Response) {
    try {
      const pdfPath = await this.consultationsService.getCertificatPath(id);
      const file = fs.createReadStream(pdfPath);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="certificat-${id}.pdf"`,
      );
      
      file.pipe(res);
    } catch (error) {
      res.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: error.message,
      });
    }
  }
}

