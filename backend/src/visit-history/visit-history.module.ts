import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisitHistoryService } from './visit-history.service';
import { VisitHistoryController } from './visit-history.controller';
import {  ConsultationEntity } from '../consultations/entities/consultation.entity';
import { AppointmentEntity } from '../appointments/entities/appointment.entity';
import { PatientProfileEntity } from '../profiles/patient/entities/patient-profile.entity';
import { DoctorProfileEntity } from '../profiles/doctor/entities/doctor-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ConsultationEntity, AppointmentEntity,PatientProfileEntity,DoctorProfileEntity])],
  controllers: [VisitHistoryController],
  providers: [VisitHistoryService],
})
export class VisitHistoryModule {}

