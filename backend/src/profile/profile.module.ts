import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { UserEntity } from '../users/entities/user.entity';
import { DoctorProfileEntity } from '../profiles/doctor/entities/doctor-profile.entity';
import { PatientProfileEntity } from '../profiles/patient/entities/patient-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, DoctorProfileEntity, PatientProfileEntity])
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}