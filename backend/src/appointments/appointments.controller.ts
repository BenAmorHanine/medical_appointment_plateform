import { Controller, Get, Post, Body, UsePipes, ValidationPipe, Delete, Param, Patch } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  @Post()
  @UsePipes(ValidationPipe)
  create(@Body() dto: CreateAppointmentDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('doctor/:doctorId')
  findByDoctor(@Param('doctorId') doctorId: string) {
    return this.service.findByDoctor(doctorId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get('patient/:patientId')
  findByPatient(@Param('patientId') patientId: string) {
  return this.service.findByPatient(patientId);
}


  @Delete(':id')
  async cancel(@Param('id') id: string) {
    return await this.service.cancel(id);
  }

  @Patch(':id/done')
  async markAsDone(@Param('id') id: string) {
    return await this.service.markAsDone(id);
  }
}
