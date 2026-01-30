import { Controller, Get, Post, Body, UsePipes, ValidationPipe, Delete, Param, Patch, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UpdateAppointmentDto } from './dto/update-aapointment.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService,) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('patient')
  @UsePipes(ValidationPipe)
  create(@Body() dto: CreateAppointmentDto) {
    return this.service.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.service.findAll();
  }

  @Get('doctor/:doctorId')
  @UseGuards(JwtAuthGuard)
  findByDoctor(@Param('doctorId') doctorId: string) {
    return this.service.findByDoctor(doctorId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get('patient/:patientId')
  @UseGuards(JwtAuthGuard)
  findByPatient(@Param('patientId') patientId: string) {
  return this.service.findByPatient(patientId);
}

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('patient', 'doctor', 'admin')
  async cancel(@Param('id') id: string) {
    return await this.service.cancel(id);
  }

  @Patch(':id/done')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('doctor', 'admin')
  async markAsDone(@Param('id') id: string) {
    return await this.service.markAsDone(id);
  }

   @Patch(':id')
   @UseInterceptors(
  FileInterceptor('file', { 
    storage: diskStorage({
      destination: './uploads/medical-docs', 
      filename: (_, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `doc-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, 
  }),
)
  update(
    @Param('id') id: string, 
    @Body() updateDto: UpdateAppointmentDto, 
    @UploadedFile() file?: Express.Multer.File
  ) {
    const updateData: any = { ...updateDto };
    
    if (file) {
      updateData.documentUrl = `/uploads/medical-docs/${file.filename}`;
    }
    
    return this.service.update(id, updateData);
  }
}
