import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VisitHistoryService } from './visit-history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { PatientHistoryQueryDto } from './dto/patient-history-query.dto';
import { UserEntity } from '../users/entities/user.entity'; // Ajustez selon votre structure

@ApiTags('Visit History')
@ApiBearerAuth()
@Controller('visit-history')
@UseGuards(JwtAuthGuard)
export class VisitHistoryController {
  constructor(private readonly visitHistoryService: VisitHistoryService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user visit history' })
  getMyHistory(
    @GetUser() user: UserEntity,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.visitHistoryService.getHistoryByUserId(
      user.id,
      pagination.page,
      pagination.limit,
    );
  }

  @Get('doctor/patients')
  @UseGuards(RolesGuard)
  @Roles('doctor')
  @ApiOperation({ summary: 'Get all patients of the current doctor' })
  getDoctorPatients(
    @GetUser() user: UserEntity,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.visitHistoryService.getPatientsOfDoctor(
      user.id,
      pagination.page,
      pagination.limit,
    );
  }

  @Get('doctor/patient-history')
  @UseGuards(RolesGuard)
  @Roles('doctor')
  @ApiOperation({ summary: 'Get visit history of a specific patient (doctor only)' })
  @ApiQuery({ name: 'patientId', type: String, format: 'uuid', required: true })
  getPatientHistoryForDoctor(
    @GetUser() user: UserEntity,
    @Query() query: PatientHistoryQueryDto,
  ) {
    return this.visitHistoryService.getHistoryForDoctor(
      query.patientId,
      user.id,
      query.page,
      query.limit,
    );
  }
}