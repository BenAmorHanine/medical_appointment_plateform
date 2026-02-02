import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException } from '@nestjs/common';
import { ConsultationEntity } from '../consultations/entities/consultation.entity';
import { AppointmentEntity } from '../appointments/entities/appointment.entity';
import { PatientProfileEntity } from '../profiles/patient/entities/patient-profile.entity';
import { VisitHistoryDto } from './dto/visit-history.dto';
import { DoctorProfileEntity } from '../profiles/doctor/entities/doctor-profile.entity';
import { VisitHistoryMapper } from './mappers/visit-history.mapper';
import { DoctorPatientMapper } from './mappers/doctor-patient.mapper';
import { FindOptionsWhere, FindOptionsRelations } from 'typeorm';

@Injectable()
export class VisitHistoryService {

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

async getHistoryByUserId(userId: string, page = 1, limit = 10) {
  const patientProfile = await this.patientProfileRepository.findOne({
    where: { user: { id: userId } },
  });

  if (!patientProfile) {
    return {
  
      page,
      limit,
      total: 0,
      totalPages: 0,
      history: [],
    };
  }

  return this.getHistoryByPatient(patientProfile.id, page, limit);
}



private async getPaginatedHistory(
  where: FindOptionsWhere<ConsultationEntity>,
  page = 1,
  limit = 10,
  relations?: FindOptionsRelations<ConsultationEntity>,
) {
  const [consultations, total] =
    await this.consultationRepository.findAndCount({
      where,
      relations,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

  const history = consultations.map(VisitHistoryMapper.toDto);

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    history,
  };
}



async getHistoryForDoctor(
  patientId: string,
  doctorUserId: string,
  page = 1,
  limit = 10,
) {
  const doctorProfile = await this.doctorProfileRepository.findOneOrFail({
    where: { user: { id: doctorUserId } },
    select: { id: true },
  });

  return this.getPaginatedHistory(
    {
      patientId,
      doctorProfileId: doctorProfile.id,
    },
    page,
    limit,
  );
}


async getPatientsOfDoctor(
  doctorUserId: string,
  page = 1,
  limit = 10,
) {
  const doctorProfile = await this.doctorProfileRepository.findOneOrFail({
    where: { user: { id: doctorUserId } },
    select: { id: true },
  });

  const consultations = await this.consultationRepository.find({
    where: { doctorProfileId: doctorProfile.id },
    relations: {
      patient: {
        user: true,
      },
    },
    order: { createdAt: 'DESC' },
  });

  const allPatients = DoctorPatientMapper.groupByPatient(consultations);

  const total = allPatients.length;
  const data = allPatients.slice(
    (page - 1) * limit,
    page * limit,
  );

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    data,
  };
}


async getHistoryByPatient(
  patientId: string,
  page = 1,
  limit = 10,
) {
  return this.getPaginatedHistory(
    { patientId },
    page,
    limit,
  );
}
}