import { Controller, Get } from '@nestjs/common';
import { PatientProfileService } from './patient-profile.service';

@Controller('patients')
export class AdminPatientsController {
  constructor(
    private readonly patientProfileService: PatientProfileService,
  ) {}

  @Get()
  async findAllForAdmin() {
    const profiles = await this.patientProfileService.findAll();

    return profiles.map((p) => ({
      id: p.id,
      medicalRecordNumber: p.medicalRecordNumber,
      age: p.age,
      gender: p.gender,
      address: p.address,
      createdAt: p.createdAt,
      user: {
        id: p.user?.id,
        username: p.user?.username,
        email: p.user?.email,
        firstName: p.user?.firstName,
        lastName: p.user?.lastName,
      },
    }));
  }
}
