import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorProfileService } from './doctor-profile.service';
import { DoctorProfileController } from './doctor-profile.controller';
import { DoctorProfileEntity } from './entities/doctor-profile.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DoctorProfileEntity, UserEntity]),
  ],
  providers: [DoctorProfileService],
  controllers: [DoctorProfileController],
  exports: [DoctorProfileService],
})
export class DoctorProfileModule {}
