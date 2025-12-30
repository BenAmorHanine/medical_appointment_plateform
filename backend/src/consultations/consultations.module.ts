import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsultationsController } from './consultations.controller';
import { ConsultationsService } from './consultations.service';
import { ConsultationEntity } from './entities/consultation.entity';
import { AppointmentEntity } from '../appointments/entities/appointment.entity';
import { DoctorProfileEntity } from '../profiles/doctor/entities/doctor-profile.entity';
import { PatientProfileEntity } from '../profiles/patient/entities/patient-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ConsultationEntity, AppointmentEntity, DoctorProfileEntity, PatientProfileEntity])],
  controllers: [ConsultationsController],
  providers: [ConsultationsService],
  exports: [ConsultationsService],
})
export class ConsultationsModule {}

