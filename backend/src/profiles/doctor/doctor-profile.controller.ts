import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { DoctorProfileService } from './doctor-profile.service';
import { CreateDoctorProfileDto } from './dto/create-doctor-profile.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('doctor-profiles')
export class DoctorProfileController {
  constructor(private readonly doctorProfileService: DoctorProfileService) {}

  @Get()
  findAll(@Query('specialty') specialty?: string) {
    if (specialty) {
      return this.doctorProfileService.findBySpecialty(specialty);
    }
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

@Post('rate')
@UseGuards(AuthGuard('jwt'))
async rateDoctor(
  @Body() body: { doctorId: string; score: number },
  @Req() req
) {
  if (req.user.role !== 'patient') {
    throw new ForbiddenException('Access denied: Only patients can rate our medical staff.');
  }

  return this.doctorProfileService.updateRating(body.doctorId, body.score);
}

}
