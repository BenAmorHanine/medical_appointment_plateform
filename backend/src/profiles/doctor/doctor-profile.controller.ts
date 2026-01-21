import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { DoctorProfileService } from './doctor-profile.service';
import { CreateDoctorProfileDto } from './dto/create-doctor-profile.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';

@Controller('doctor-profiles')
export class DoctorProfileController {
  constructor(private readonly doctorProfileService: DoctorProfileService) {}

  @Get()
  findAll() {
    return this.doctorProfileService.findAll();
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.doctorProfileService.findByUserId(userId);
  }

  @Get('featured')
  findFeatured() {
    return this.doctorProfileService.findFeatured();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorProfileService.findOne(id);
  }

  @Post()
  @UsePipes(ValidationPipe)
  create(@Body() createDoctorProfileDto: CreateDoctorProfileDto) {
    return this.doctorProfileService.create(createDoctorProfileDto);
  }

  @Put(':id')
  @UsePipes(ValidationPipe)
  update(
    @Param('id') id: string,
    @Body() updateDoctorProfileDto: UpdateDoctorProfileDto,
  ) {
    return this.doctorProfileService.update(id, updateDoctorProfileDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.doctorProfileService.remove(id);
  }
}
