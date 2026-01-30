import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter'; // ← AJOUTER
import { AppointmentEntity, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AvailabilityEntity } from '../availability/entities/availability.entity';
import {
  AppointmentCreatedEvent,
  AppointmentCancelledEvent,
} from './events/appointment.events';
import { Brackets } from 'typeorm'; 
import { DataSource } from 'typeorm';
import { PatientProfileEntity } from '../profiles/patient/entities/patient-profile.entity';
import { DoctorProfileEntity } from '../profiles/doctor/entities/doctor-profile.entity';
@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(AppointmentEntity)
    private readonly repository: Repository<AppointmentEntity>,
    @InjectRepository(AvailabilityEntity)
    private readonly availabilityRepository: Repository<AvailabilityEntity>,
    private dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
   
  ) {}

  async findAll(): Promise<AppointmentEntity[]> {
    return await this.repository.find({
      order: { appointmentDate: 'ASC', startTime: 'ASC' },
    });
  }

  
  async findOne(id: string): Promise<AppointmentEntity & { doctorId: string }> {
    const appointment = await this.repository.findOne({
      where: { id },
    });
    if (!appointment) {
      throw new NotFoundException('Rendez-vous introuvable');
    }
    const availability = await this.availabilityRepository.findOne({
      where: { id: appointment.availabilityId },
    });
    if (!availability) {
      throw new NotFoundException('Créneau associé introuvable');
    }
    return { ...appointment, doctorId: availability.doctorId };
  }



// rdv par patient
  async findByPatient(patientId: string): Promise<(AppointmentEntity & { doctorName: string })[]> {
    const appointments = await this.repository.find({
      where: { patientId },
      order: { appointmentDate: 'ASC', startTime: 'ASC' },
    });

    if (appointments.length === 0) return [];

    const uniqueAvailabilityIds = [...new Set(appointments.map(a => a.availabilityId))];
    const availabilities = await this.availabilityRepository.find({
      where: { id: In(uniqueAvailabilityIds) },
      relations: ['doctor', 'doctor.user']
    });

    const doctorNameMap = new Map<string, string>();
    availabilities.forEach(avail => {
      const fullName = avail.doctor?.user 
        ? `${avail.doctor.user.firstName || ''} ${avail.doctor.user.lastName || ''}`.trim() 
        : 'Dr. Unknown';
      doctorNameMap.set(avail.id, fullName);
    });

    return appointments.map(apt => ({
      ...apt,
      doctorName: doctorNameMap.get(apt.availabilityId) || 'Dr. Unknown'
    }));
}

//rdv par doc
  async findByDoctor(doctorId: string): Promise<(AppointmentEntity & { patientName: string })[]> {
    const availabilities = await this.availabilityRepository.find({ where: { doctorId } });
    if (availabilities.length === 0) return [];

    const availabilityIds = availabilities.map(a => a.id);
    const appointments = await this.repository.find({
      where: { availabilityId: In(availabilityIds) },
      order: { appointmentDate: 'ASC', startTime: 'ASC' },
    });

    const uniquePatientIds = [...new Set(appointments.map(a => a.patientId).filter(Boolean))];
    if (uniquePatientIds.length === 0) {
      return appointments.map(apt => ({ ...apt, patientName: 'Patient inconnu' }));
    }

    //recurpérer les noms dpuis users
    const users = await this.dataSource
      .getRepository('users')
      .createQueryBuilder('user')
      .where('user.id IN (:...ids)', { ids: uniquePatientIds })
      .select(['user.id', 'user.firstName', 'user.lastName'])
      .getMany();

    const patientNameMap = new Map<string, string>();
    users.forEach(user => {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
        `Patient ${user.id.substring(0, 8)}...`;
      patientNameMap.set(user.id, fullName);
    });

    return appointments.map(apt => ({
      ...apt,
      patientName: patientNameMap.get(apt.patientId!) || `Patient ${apt.patientId?.substring(0, 8)}...`,
    }));
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

  // Créer appointment
  const appointment = this.repository.create({
    appointmentDate: availability.date,
    startTime: availability.startTime,
    endTime: availability.endTime,
    status: AppointmentStatus.RESERVED,
    patientId: createDto.patientId,
    availabilityId: createDto.availabilityId,
  });

  const saved = await this.repository.save(appointment);
  
  // Update availability
  availability.bookedSlots++;
  await this.availabilityRepository.save(availability);

  // 🔥 ÉMETTRE L'ÉVÉNEMENT avec userId du doctor
  console.log('🚀 Emitting appointment.created event...');
  console.log('📍 Doctor userId:', availability.doctor.user.id);
  this.eventEmitter.emit(
    'appointment.created',
    new AppointmentCreatedEvent(
      saved.id,
      saved.patientId,
      availability.doctor.user.id, 
      saved.appointmentDate,
    ),
  );

  return saved;
}
    async cancel(appointmentId: string): Promise<AppointmentEntity> {
  const appointment = await this.repository.findOne({ 
    where: { id: appointmentId } 
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
    console.log('🚀 Emitting appointment.cancelled event...');
    this.eventEmitter.emit(
      'appointment.cancelled',
      new AppointmentCancelledEvent(
        appointment.id,
        appointment.patientId,
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
  }
