import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException } from '@nestjs/common';
import { ConsultationEntity } from '../consultations/entities/consultation.entity';
import { AppointmentEntity } from '../appointments/entities/appointment.entity';
import { PatientProfileEntity } from '../profiles/patient/entities/patient-profile.entity';
import { VisitHistoryDto } from './dto/visit-history.dto';
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

async getHistoryByUserId(userId: string, page = 1, limit = 10) {
  const patientProfile = await this.patientProfileRepository.findOne({
    where: { user: { id: userId } },
  });

  if (!patientProfile) {
    return {
      blocked: false,
      absenceCount: 0,
      page,
      limit,
      total: 0,
      totalPages: 0,
      history: [],
    };
  }

  return this.getHistoryByPatient(patientProfile.id, page, limit);
}



 async getHistoryForDoctor(
  patientId: string,
  doctorUserId: string,
  page = 1,
  limit = 10,
) {
  const doctorProfile = await this.doctorProfileRepository.findOneOrFail({
    select: { id: true },
    where: { user: { id: doctorUserId } },
  });

  const qb = this.consultationRepository
    .createQueryBuilder('c')
    .where('c.patientId = :patientId', { patientId })
    .andWhere('c.doctorProfileId = :doctorProfileId', {
      doctorProfileId: doctorProfile.id,
    })
    .orderBy('c.createdAt', 'DESC')
    .skip((page - 1) * limit)
    .take(limit);

  const [consultations, total] = await qb.getManyAndCount();

  let absenceCount = 0;

  const history = consultations.map(c => ({
    consultationId: c.id,
    date: c.createdAt,
    type: c.type,
    status: 'EFFECTUE', 
    ordonnanceUrl: c.ordonnanceUrl || undefined,
    certificatUrl: c.certificatUrl || undefined,
  }));

  return {
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
  blocked: false,
  absenceCount,
  history,
};

}


/*
async getPatientsOfDoctor(
  doctorUserId: string,
  page = 1,
  limit = 10,
) {
  const doctorProfile = await this.doctorProfileRepository.findOneOrFail({
    where: { user: { id: doctorUserId } },
    select: { id: true },
  });

  const qb = this.consultationRepository
    .createQueryBuilder('c')
    .innerJoin(
      PatientProfileEntity,
      'p',
      'p.id = c.patientId',
    )
    .innerJoin('p.user', 'u')
    .where('c.doctorProfileId = :doctorId', {
      doctorId: doctorProfile.id,
    })
    .groupBy('p.id')
    .addGroupBy('u.firstName')
    .addGroupBy('u.lastName')
    .orderBy('MAX(c.createdAt)', 'DESC');

  // ✅ total AVANT pagination
  const total = await qb.getCount();

  // ✅ pagination
  const data = await qb
    .select([
      'p.id AS patientId',
      "CONCAT(u.firstName, ' ', u.lastName) AS fullName",
      'COUNT(c.id) AS visits',
      'MAX(c.createdAt) AS lastVisit',
    ])
    .skip((page - 1) * limit)
    .take(limit)
    .getRawMany();

  return {
    page,
    limit,
    total,
    data,
  };
}
*/
async getPatientsOfDoctor(
  doctorUserId: string,
  page = 1,
  limit = 10,
) {
  const doctorProfile = await this.doctorProfileRepository.findOneOrFail({
    where: { user: { id: doctorUserId } },
    select: { id: true },
  });

  // ✅ Compter les patients distincts AVANT groupBy
  const totalQuery = this.consultationRepository
    .createQueryBuilder('c')
    .innerJoin(PatientProfileEntity, 'p', 'p.id = c.patientId')
    .where('c.doctorProfileId = :doctorId', {
      doctorId: doctorProfile.id,
    })
    .select('COUNT(DISTINCT p.id)', 'count');

  const totalResult = await totalQuery.getRawOne();
  const total = parseInt(totalResult.count);

  // ✅ Query avec pagination
  const data = await this.consultationRepository
    .createQueryBuilder('c')
    .innerJoin(PatientProfileEntity, 'p', 'p.id = c.patientId')
    .innerJoin('p.user', 'u')
    .where('c.doctorProfileId = :doctorId', {
      doctorId: doctorProfile.id,
    })
    .groupBy('p.id')
    .addGroupBy('u.firstName')
    .addGroupBy('u.lastName')
    .orderBy('MAX(c.createdAt)', 'DESC')
    .select([
      'p.id AS patientId',
      "CONCAT(u.firstName, ' ', u.lastName) AS fullName",
      'COUNT(c.id) AS visits',
      'MAX(c.createdAt) AS lastVisit',
    ])
    .skip((page - 1) * limit)
    .take(limit)
    .getRawMany();

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    data,
  };
}

/*
 async getHistoryByPatient(
  patientId: string,
  page = 1,
  limit = 10,
) {
  const [consultations, total] =
    await this.consultationRepository.findAndCount({
      where: { patientId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
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
      ordonnanceUrl: consultation.ordonnanceUrl || undefined,
      certificatUrl: consultation.certificatUrl || undefined,
    });
  }

  return {
    //blocked: absenceCount >= this.ABSENCE_LIMIT,
    absenceCount,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    history,
  };
}*/

async getHistoryByPatient(
  patientId: string,
  page = 1,
  limit = 10,
) {
  const [consultations, total] =
    await this.consultationRepository.findAndCount({
      where: { patientId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

  const history: VisitHistoryDto[] = consultations.map(c => ({
    consultationId: c.id,
    date: c.createdAt,
    type: c.type,
    status: 'EFFECTUE',
    ordonnanceUrl: c.ordonnanceUrl || undefined,
    certificatUrl: c.certificatUrl || undefined,
  }));

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    history,
  };
}

/*
async markAbsent(consultationId: string) {
  const consultation = await this.consultationRepository.findOne({
    where: { id: consultationId },
  });

  if (!consultation) {
    throw new NotFoundException('Consultation introuvable');
  }

  consultation.visitStatus = VisitStatus.ABSENT;

  await this.consultationRepository.save(consultation);

  return { success: true };
}
*/
}