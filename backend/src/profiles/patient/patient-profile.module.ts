import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientProfileService } from './patient-profile.service';
import { PatientProfileController } from './patient-profile.controller';
import { PatientProfileEntity } from './entities/patient-profile.entity';
import { UsersModule } from '../../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([PatientProfileEntity]), UsersModule],
  providers: [PatientProfileService],
  controllers: [PatientProfileController],
  exports: [PatientProfileService],
})
export class PatientProfileModule {}
