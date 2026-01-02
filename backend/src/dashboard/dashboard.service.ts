import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { AppointmentEntity } from '../appointments/entities/appointment.entity';
import { ConsultationEntity } from '../consultations/entities/consultation.entity';
import { UserRole } from '../users/entities/user.entity'; 
import { NotFoundException } from '@nestjs/common';

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
  async getAllUsers() {
  return this.userRepository.find({
    select: ['id', 'username', 'email', 'role', 'createdAt'],  // Champs safe
    order: { createdAt: 'DESC' }
  });
}


async changeUserRole(userId: string, newRole: string) {
  const user = await this.userRepository.findOne({ where: { id: userId } });
  if (!user) throw new NotFoundException('User not found');
  
  user.role = newRole as any; // Patient, Doctor, Admin
  return this.userRepository.save(user);
}

async deleteUser(userId: string) {
  const user = await this.userRepository.findOne({ where: { id: userId } });
  if (!user) throw new NotFoundException('User not found');
  
  await this.userRepository.softDelete(userId);
  return { message: 'User soft deleted successfully' };
}

}