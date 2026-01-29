import { Controller, Get, Post, Body, UsePipes, ValidationPipe, Delete, Param, Patch, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

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
}
