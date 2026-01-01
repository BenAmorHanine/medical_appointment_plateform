import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { AppointmentEntity } from '../appointments/entities/appointment.entity';
import { ConsultationEntity } from '../consultations/entities/consultation.entity';
import { UserRole } from '../users/entities/user.entity'; 
@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(AppointmentEntity)
    private readonly appointmentRepository: Repository<AppointmentEntity>,
    @InjectRepository(ConsultationEntity)
    private readonly consultationRepository: Repository<ConsultationEntity>,
  ) {}
    async getStats() {
    const totalPatients = await this.userRepository.count({ 
      where: { role: UserRole.PATIENT }  // Utilise l'enum
    });
    const totalDoctors = await this.userRepository.count({ 
      where: { role: UserRole.DOCTOR }    // Utilise l'enum
    });
    const totalAppointments = await this.appointmentRepository.count();
    const totalConsultations = await this.consultationRepository.count();

    return {
      totalPatients,
      totalDoctors,
      totalAppointments,
      totalConsultations,
    };
  }
}