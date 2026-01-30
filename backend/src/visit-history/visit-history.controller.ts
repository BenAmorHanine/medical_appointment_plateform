import { Controller, Get,Patch, Param, Query,UseGuards } from '@nestjs/common';
import { VisitHistoryService } from './visit-history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('visit-history')
export class VisitHistoryController {
  constructor(private readonly visitHistoryService: VisitHistoryService) {}

  //  PATIENT : voit uniquement SON historique
@Get('me')
@UseGuards(JwtAuthGuard)
getMyHistory(
  @GetUser() user: any,
  @Query('page') page = 1,
  @Query('limit') limit = 10,
) {
  return this.visitHistoryService.getHistoryByUserId(
    user.id,
    Number(page),
    Number(limit),
  );
}

@Get('doctor/patients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('doctor')
getDoctorPatients(
  @GetUser() user: any,
  @Query('page') page = 1,
  @Query('limit') limit = 10,
) {
  return this.visitHistoryService.getPatientsOfDoctor(
    user.id,
    Number(page),
    Number(limit),
  );
}

@Get('doctor/patient-history')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('doctor')
getPatientHistoryForDoctor(
  @GetUser() user: any,
  @Query('patientId') patientId: string,
  @Query('page') page = 1,
  @Query('limit') limit = 10,
) {
  return this.visitHistoryService.getHistoryForDoctor(
    patientId,
    user.id,
    Number(page),
    Number(limit),
  );
}
/*
@Patch('consultation/:id/absent')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('doctor')
markConsultationAbsent(@Param('id') id: string) {
  return this.visitHistoryService.markAbsent(id);
}
*/

}