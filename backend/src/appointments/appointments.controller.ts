import { Controller, Get, Post, Body, UsePipes, ValidationPipe, Delete, Param, Query } from '@nestjs/common'; 
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
  findAll(@Query('patientId') patientId?: string) {
    if (patientId) {
      return this.service.findByPatient(patientId);
    }
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

  

  @Delete(':id')
  async cancel(@Param('id') id: string) {
    return await this.service.cancel(id);
  }
}
