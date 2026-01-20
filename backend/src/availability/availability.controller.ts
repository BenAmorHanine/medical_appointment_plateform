import { Controller, Get, Post, Body, Param, UsePipes, ValidationPipe,Delete } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';

@Controller('availabilities')
export class AvailabilityController {
  constructor(private readonly service: AvailabilityService) {}

  @Post()
  @UsePipes(ValidationPipe)
  create(@Body() dto: CreateAvailabilityDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('doctor/:doctorId')
  findDoctorAvailabilities(@Param('doctorId') doctorId: string) {
    return this.service.findDoctorAvailabilities(doctorId);
  }

  @Get('doctor/:doctorId/date/:date')
  findAvailableSlots(@Param('doctorId') doctorId: string, @Param('date') date: string) {
    return this.service.findAvailableSlots(doctorId, date);
  }

@Delete(':id')
remove(@Param('id') id: string) {
  return this.service.remove(id);
}

}
