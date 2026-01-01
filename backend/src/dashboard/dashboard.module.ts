import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { UserEntity } from '../users/entities/user.entity';
import { AppointmentEntity } from '../appointments/entities/appointment.entity';
import { ConsultationEntity } from '../consultations/entities/consultation.entity';
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, AppointmentEntity, ConsultationEntity])],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
