import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter'; 
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

async findByDoctor(doctorId: string): Promise<Array<AppointmentEntity & { doctorName: string, patientName: string }>> {
  const availabilities = await this.availabilityRepository.find({ 
    where: { doctorId },
    relations: ['doctor', 'doctor.user']
  });
  
  if (availabilities.length === 0) return [];

  const availabilityIds = availabilities.map(a => a.id);
  const appointments = await this.repository.find({ 
    where: { availabilityId: In(availabilityIds) } 
  });

  const reserved: Array<AppointmentEntity & { doctorName: string, patientName: string }> = [];

  for (const appointment of appointments.filter(a => a.status === AppointmentStatus.RESERVED)) {
    const availability = await this.availabilityRepository.findOne({
      where: { id: appointment.availabilityId },
      relations: ['doctor', 'doctor.user']
    });

  
    const patientName = `Patient ${appointment.patientId.substring(0, 8)}...`;
    
    if (availability && availability.doctor && availability.doctor.user) {
      reserved.push({
        ...appointment,
        doctorName: availability.doctor.user.username,
        patientName: patientName
      });
    }
  }

  return reserved;
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


  const appointmentDate = new Date(availability.date);
  appointmentDate.setUTCHours(0, 0, 0, 0); 
  appointmentDate.setHours(12, 0, 0, 0); 

  const appointment = this.repository.create({
    appointmentDate,
    startTime: availability.startTime,
    endTime: availability.endTime,
    status: AppointmentStatus.RESERVED,
    patientId: createDto.patientId,
    availabilityId: createDto.availabilityId,
  });


    const saved = await this.repository.save(appointment);
    
    availability.bookedSlots++;
    await this.availabilityRepository.save(availability);

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

    const availability = await this.availabilityRepository.findOne({
      where: { id: appointment.availabilityId },
      relations: ['doctor', 'doctor.user'], 
    });

    if (availability) {
      availability.bookedSlots = Math.max(0, availability.bookedSlots - 1);
      await this.availabilityRepository.save(availability);
      this.eventEmitter.emit(
        'appointment.cancelled',
        new AppointmentCancelledEvent(
          appointment.id,
          appointment.patientId,
          availability.doctor.user.id, 
        ),
      );
    }

    return appointment;
  }

async findByPatient(patientId: string) {
  const appointments = await this.repository.find({
    where: { patientId },
  });

  const result: Array<AppointmentEntity & { doctorName: string }> = [];

  for (const appointment of appointments) {
    const availability = await this.availabilityRepository.findOne({
      where: { id: appointment.availabilityId },
      relations: ['doctor', 'doctor.user'],
    });

    if (availability && availability.doctor && availability.doctor.user) {
      result.push({
        ...appointment,
        doctorName: availability.doctor.user.username, 
      });
    }
  }

  return result;
}


}
