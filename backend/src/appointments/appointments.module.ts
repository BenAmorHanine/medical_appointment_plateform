import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentEntity } from './entities/appointment.entity';
import { AvailabilityEntity } from '../availability/entities/availability.entity';
import { UsersModule } from '../users/users.module';  
import { PatientProfileEntity } from '../profiles/patient/entities/patient-profile.entity';
import { DoctorProfileEntity } from '../profiles/doctor/entities/doctor-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppointmentEntity,
      AvailabilityEntity, PatientProfileEntity,DoctorProfileEntity 
    ]),
    UsersModule, 
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService,],
  exports: [AppointmentsService],  
})
export class AppointmentsModule {}
