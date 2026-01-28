import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientProfileService } from './patient-profile.service';
import { PatientProfileController } from './patient-profile.controller';
import { AdminPatientsController } from './admin-patients.controller';
import { PatientProfileEntity } from './entities/patient-profile.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PatientProfileEntity, UserEntity])],
  providers: [PatientProfileService],
  controllers: [
    PatientProfileController,
    AdminPatientsController,
  ],
  exports: [PatientProfileService],
})
export class PatientProfileModule {}
