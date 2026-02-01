// consultations/consultations.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsultationsController } from './consultations.controller';
import { ConsultationsService } from './consultations.service';
import { ConsultationEntity } from './entities/consultation.entity';
import { AppointmentEntity } from '../appointments/entities/appointment.entity';
import { DoctorProfileEntity } from '../profiles/doctor/entities/doctor-profile.entity';
import { PatientProfileEntity } from '../profiles/patient/entities/patient-profile.entity';
import { PdfService } from './services/pdf.services';
import { AppointmentsModule } from '../appointments/appointments.module';
import { DoctorProfileModule } from '../profiles/doctor/doctor-profile.module';
import { PatientProfileModule } from '../profiles/patient/patient-profile.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConsultationEntity,
      AppointmentEntity,
      DoctorProfileEntity,
      PatientProfileEntity,
    ]),
    AppointmentsModule,
    DoctorProfileModule,
    PatientProfileModule,
  ],
  controllers: [ConsultationsController],
  providers: [ConsultationsService, PdfService],
  exports: [ConsultationsService, PdfService],
})
export class ConsultationsModule {}
