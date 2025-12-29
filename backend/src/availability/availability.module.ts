import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { AvailabilityEntity } from './entities/availability.entity';
import { DoctorProfileEntity } from '../profiles/doctor/entities/doctor-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AvailabilityEntity,
      DoctorProfileEntity,
    ]),
  ],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
