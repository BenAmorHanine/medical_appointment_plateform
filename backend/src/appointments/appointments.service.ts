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
@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(AppointmentEntity)
    private readonly repository: Repository<AppointmentEntity>,
    @InjectRepository(AvailabilityEntity)
    private readonly availabilityRepository: Repository<AvailabilityEntity>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(): Promise<AppointmentEntity[]> {
    return await this.repository.find();
  }

  async findByDoctor(doctorId: string): Promise<AppointmentEntity[]> {
    // Récupérer les availabilities du médecin
    const availabilities = await this.availabilityRepository.find({
      where: { doctorId },
    });
    
    if (availabilities.length === 0) {
      return [];
    }
    
    const availabilityIds = availabilities.map(a => a.id);
    
    return await this.repository.find({
      where: { availabilityId: In(availabilityIds) },
      order: { appointmentDate: 'ASC', startTime: 'ASC' },
    });
  }
  async create(createDto: CreateAppointmentDto): Promise<AppointmentEntity> {
  // Vérifier availability avec relations
  const availability = await this.availabilityRepository.findOne({
    where: { id: createDto.availabilityId },
    relations: ['doctor', 'doctor.user'], // ← Charger doctor + user
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
      availability.doctor.user.id, // ← userId du doctor (pas doctorProfileId)
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
    relations: ['doctor', 'doctor.user'], // ← Ajouter relations
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
}
