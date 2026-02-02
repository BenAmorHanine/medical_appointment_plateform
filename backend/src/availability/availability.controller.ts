import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('availabilities')
@UseGuards(JwtAuthGuard)
export class AvailabilityController {
  constructor(private readonly service: AvailabilityService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('doctor')
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
  @UseGuards(RolesGuard)
  @Roles('doctor', 'admin')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
