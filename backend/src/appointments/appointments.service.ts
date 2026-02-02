import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter'; 
import { AppointmentEntity, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AvailabilityEntity } from '../availability/entities/availability.entity';
import {
  AppointmentCreatedEvent,
  AppointmentCancelledEvent,
} from './events/appointment.events';

import { PatientProfileEntity } from '../profiles/patient/entities/patient-profile.entity';
import { DoctorProfileEntity } from '../profiles/doctor/entities/doctor-profile.entity';
import { PaginationQueryDto } from 'src/common/dto/pagination.dto';
@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(PatientProfileEntity)
    private readonly patientRepository: Repository<PatientProfileEntity>,
    @InjectRepository(AppointmentEntity)
    private readonly repository: Repository<AppointmentEntity>,
    @InjectRepository(AvailabilityEntity)
    private readonly availabilityRepository: Repository<AvailabilityEntity>,
    private readonly eventEmitter: EventEmitter2,
   
  ) {}

async findAll(
  query?: PaginationQueryDto,
): Promise<{ data: AppointmentEntity[]; total: number; page: number; limit: number }> {

  const page = query?.page || 1;
  const limit = query?.limit || 20;

  const [data, total] = await this.repository.findAndCount({
    relations: ['patient', 'patient.user', 'doctor', 'doctor.user'],
    order: { appointmentDate: 'ASC', startTime: 'ASC' },
    skip: query?.skip,
    take: limit,
  });

  return { data, total, page, limit };
}


  
  async findOne(id: string): Promise<AppointmentEntity & { doctorId: string }> {
    const appointment = await this.repository.findOne({
      where: { id },
      relations: ['doctor', 'doctor.user', 'patient', 'patient.user'],
  });
    if (!appointment) {
      throw new NotFoundException('Rendez-vous introuvable');
    }
    return appointment;

  }

  findDoctorAppointments(doctorProfileId: string) {
    return this.repository.find({
      where: {
        doctor: { id: doctorProfileId },
      },
      relations: [
        'patient',
        'patient.user',
      ],
      order: {
        appointmentDate: 'ASC',
        startTime: 'ASC',
      },
    });
  }


  findPatientAppointments(patientProfileId: string) {
    return this.repository.find({
      where: {
        patient: { id: patientProfileId },
      },
      relations: [
        'doctor',
        'doctor.user',
      ],
      order: {
        appointmentDate: 'ASC',
        startTime: 'ASC',
      },
    });
  }


  async create(createDto: CreateAppointmentDto): Promise<AppointmentEntity> {
 
  const availability = await this.availabilityRepository.findOne({
    where: { id: createDto.availabilityId },
    relations: ['doctor', 'doctor.user'], 
  });
  
  if (!availability) {
    throw new NotFoundException('Créneau introuvable');
  }
  if (availability.bookedSlots >= availability.capacity) {
    throw new BadRequestException('Créneau complet');
  }

  const patient = await this.patientRepository.findOne({
  where: { id: createDto.patientId },
  relations: ['user'],
});

  if (!patient) {
    throw new NotFoundException('Patient introuvable');
  }

  // Créer appointment
  const appointment = this.repository.create({
    appointmentDate: availability.date,
    startTime: availability.startTime,
    endTime: availability.endTime,
    status: AppointmentStatus.RESERVED,
    patient:patient,
    patientId: patient.id,
    doctor:availability.doctor,
    availabilityId: createDto.availabilityId,
  });

  const saved = await this.repository.save(appointment);
  
  // Update availability
  availability.bookedSlots++;
  await this.availabilityRepository.save(availability);

  console.log(' Emitting appointment.created event...');
  console.log(' Doctor userId:', availability.doctor.user.id);
  this.eventEmitter.emit(
    'appointment.created',
    new AppointmentCreatedEvent(
      saved.id,
      saved.patient.user.id,
      availability.doctor.user.id, 
      saved.appointmentDate,
    ),
  );

  return saved;
}

  async cancel(appointmentId: string): Promise<AppointmentEntity> {
  const appointment = await this.repository.findOne({ 
    where: { id: appointmentId } ,
    relations: ['patient', 'patient.user'],
  });
  
  if (!appointment) throw new NotFoundException('RDV introuvable');
  if (appointment.status === AppointmentStatus.DONE) {  
    throw new BadRequestException('RDV terminé impossible à annuler');
  }

  appointment.status = AppointmentStatus.CANCELLED;    
  await this.repository.save(appointment);

  // Charger availability avec relations
  const availability = await this.availabilityRepository.findOne({
    where: { id: appointment.availabilityId },
    relations: ['doctor', 'doctor.user'], 
  });

  if (availability) {
    // Libérer le créneau
    availability.bookedSlots = Math.max(0, availability.bookedSlots - 1);
    await this.availabilityRepository.save(availability);

    // Émettre l'événement avec userId du doctor
    console.log(' Emitting appointment.cancelled event...');
    this.eventEmitter.emit(
      'appointment.cancelled',
      new AppointmentCancelledEvent(
        appointment.id,
        appointment.patient.user.id,
        availability.doctor.user.id, // ← userId du doctor
      ),
    );
  }

  return appointment;
}

  /**
   * Marque un rendez-vous comme terminé (done)
   */
  async markAsDone(appointmentId: string): Promise<AppointmentEntity> {
    const appointment = await this.repository.findOne({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Rendez-vous introuvable');
    }

    appointment.status = AppointmentStatus.DONE;
    await this.repository.save(appointment);

    return appointment;
  }

    
async update(id: string, updateData: Partial<AppointmentEntity>): Promise<AppointmentEntity> {
  const appointment = await this.repository.findOne({ where: { id } });
  
  if (!appointment) {
    throw new NotFoundException('Rendez-vous introuvable');
  }
  Object.assign(appointment, updateData);

  return await this.repository.save(appointment);
}
  }
