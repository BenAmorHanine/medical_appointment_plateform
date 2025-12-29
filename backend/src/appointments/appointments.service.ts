import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentEntity, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AvailabilityEntity } from '../availability/entities/availability.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(AppointmentEntity)
    private readonly repository: Repository<AppointmentEntity>,
    @InjectRepository(AvailabilityEntity)
    private readonly availabilityRepository: Repository<AvailabilityEntity>,
  ) {}

  async findAll(): Promise<AppointmentEntity[]> {
    return await this.repository.find();
  }

  async create(createDto: CreateAppointmentDto): Promise<AppointmentEntity> {
    // Vérifier availability
    const availability = await this.availabilityRepository.findOne({
      where: { id: createDto.availabilityId }
    });
    
    if (!availability) {
      throw new NotFoundException('Créneau introuvable');
    }
    if (availability.bookedSlots >= availability.capacity) {
      throw new BadRequestException('Créneau complet');
    }

    // Créer appointment SIMPLE
    const appointment = this.repository.create({
      appointmentDate: availability.date,
      startTime: availability.startTime,
      endTime: availability.endTime,
      status: AppointmentStatus.RESERVED,
      patientId: createDto.patientId,
      availabilityId: createDto.availabilityId 
    });

    const saved = await this.repository.save(appointment);
    
    // Update availability
    availability.bookedSlots++;
    await this.availabilityRepository.save(availability);

    return saved;
  }
}
