import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserEntity } from './entities/user.entity';
import { DoctorProfileModule } from '../profiles/doctor/doctor-profile.module';
import { PatientProfileModule } from '../profiles/patient/patient-profile.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    DoctorProfileModule,
    PatientProfileModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
