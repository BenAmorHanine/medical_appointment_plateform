import { Controller, Get, Post, Body, Delete, Param, Patch, UseGuards, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination.dto';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('patient')
  create(@Body() dto: CreateAppointmentDto) {
    return this.service.create(dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  findAll(@Query() query: PaginationQueryDto) {
  return this.service.findAll(query);
}

  @Get('doctor/:doctorId')
  findDoctorAppointments(@Param('doctorId') doctorId: string) {
    return this.service.findDoctorAppointments(doctorId);
  }

  @Get('patient/:patientId')
  findPatientAppointments(@Param('patientId') patientId: string) {
    return this.service.findPatientAppointments(patientId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('patient', 'doctor', 'admin')
  async cancel(@Param('id') id: string) {
    return await this.service.cancel(id);
  }

  @Patch(':id/done')
  @UseGuards(RolesGuard)
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
