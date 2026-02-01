import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { PatientProfileService } from './patient-profile.service';
import { CreatePatientProfileDto } from './dto/create-patient-profile.dto';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';

@Controller('patient-profiles')
export class PatientProfileController {
  constructor(private readonly patientProfileService: PatientProfileService) {}

  @Get()
  findAll() {
    return this.patientProfileService.findAll();
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.patientProfileService.findByUserId(userId);
  }
  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.patientProfileService.findOne(id);
  }


  @Post()
  create(@Body() createPatientProfileDto: CreatePatientProfileDto) {
    return this.patientProfileService.create(createPatientProfileDto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updatePatientProfileDto: UpdatePatientProfileDto,
  ) {
    return this.patientProfileService.update(id, updatePatientProfileDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.patientProfileService.remove(id);
  }
}
