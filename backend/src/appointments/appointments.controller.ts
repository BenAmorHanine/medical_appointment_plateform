import { Controller, Get, Post, Body, UsePipes, ValidationPipe, Delete ,Param} from '@nestjs/common';
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

  @Delete(':id')
  async cancel(@Param('id') id: string) {
    return await this.service.cancel(id);
  }
}
