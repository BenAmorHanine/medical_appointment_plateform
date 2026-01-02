import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException } from '@nestjs/common';
import { ConsultationEntity } from '../consultations/entities/consultation.entity';
import { AppointmentEntity } from '../appointments/entities/appointment.entity';
import { PatientProfileEntity } from '../profiles/patient/entities/patient-profile.entity';
import { VisitHistoryDto, VisitStatus } from './dto/visit-history.dto';
import { DoctorProfileEntity } from '../profiles/doctor/entities/doctor-profile.entity';

@Injectable()
export class VisitHistoryService {
  private readonly ABSENCE_LIMIT = 3;

  constructor(
    @InjectRepository(ConsultationEntity)
    private readonly consultationRepository: Repository<ConsultationEntity>,

    @InjectRepository(AppointmentEntity)
    private readonly appointmentRepository: Repository<AppointmentEntity>,

    @InjectRepository(PatientProfileEntity)
    private readonly patientProfileRepository: Repository<PatientProfileEntity>,
    @InjectRepository(DoctorProfileEntity)
    private readonly doctorProfileRepository: Repository<DoctorProfileEntity>
  ) {}

async getHistoryByUserId(userId: string) {
  try {
    const { id } = await this.patientProfileRepository.findOneOrFail({
      where: { user: { id: userId } },
    });

    return this.getHistoryByPatient(id);
  } catch {
    throw new NotFoundException('Patient profile not found');
  }
}

 async getHistoryForDoctor(patientId: string, doctorUserId: string) {
  const doctorProfile = await this.doctorProfileRepository.findOneOrFail({
    select: { id: true },
    where: { user: { id: doctorUserId } },
  });

  const hasConsulted = await this.consultationRepository.exist({
    where: {
      patientId,
      doctorId: doctorProfile.id,
    },
  });

  if (!hasConsulted) {
    throw new ForbiddenException(
      'You are not allowed to view this patient history',
    );
  }

  return this.getHistoryByPatient(patientId);
}



  async getHistoryByPatient(patientId: string) {
    const consultations = await this.consultationRepository.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
    });

    let absenceCount = 0;
    const history: VisitHistoryDto[] = [];

    for (const consultation of consultations) {
      let status: VisitStatus = 'EFFECTUE';

      if (consultation.appointmentId) {
        const appointment = await this.appointmentRepository.findOne({
          where: { id: consultation.appointmentId },
        });

        if (appointment) {
          if (appointment.status === 'cancelled') {
            status = 'ANNULE';
          } else if (
            appointment.status !== 'done' &&
            consultation.createdAt < new Date()
          ) {
            status = 'ABSENT';
            absenceCount++;
          }
        }
      }

      history.push({
        consultationId: consultation.id,
        date: consultation.createdAt,
        type: consultation.type,
        status,
      });
    }

    return {
      blocked: absenceCount >= this.ABSENCE_LIMIT,
      absenceCount,
      history,
    };
  }
}
