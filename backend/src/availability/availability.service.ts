import { Injectable, NotFoundException,BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AvailabilityEntity } from './entities/availability.entity';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { DoctorProfileEntity } from '../profiles/doctor/entities/doctor-profile.entity';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(AvailabilityEntity)
    private readonly repository: Repository<AvailabilityEntity>,
    @InjectRepository(DoctorProfileEntity)
    private readonly doctorRepository: Repository<DoctorProfileEntity>,
  ) {}

  async create(createDto: CreateAvailabilityDto): Promise<AvailabilityEntity> {
    const doctor = await this.doctorRepository.findOne({
      where: { id: createDto.doctorId },
    });
    if (!doctor) throw new NotFoundException('Médecin introuvable');

    const availability = this.repository.create(createDto);
    availability.doctor = doctor;
    availability.bookedSlots = 0;
    
    return await this.repository.save(availability);
  }

  async findAll(): Promise<AvailabilityEntity[]> {
    return await this.repository.find({ relations: ['doctor'] });
  }

  async findDoctorAvailabilities(doctorId: string): Promise<AvailabilityEntity[]> {
    return await this.repository.find({
      where: { doctorId },
      relations: ['doctor']
    });
  }

  async findAvailableSlots(
    doctorId: string,
    date: string
  ) {
    return this.repository
      .createQueryBuilder('a')
      .where('a.doctorId = :doctorId', { doctorId })
      .andWhere('a.date = :date', { date })
      .andWhere('a.bookedSlots < a.capacity')
      .getMany();
  }

  async remove(id: string): Promise<void> {
  const result = await this.repository.delete(id);
  
  if (result.affected === 0) {
    throw new NotFoundException(`Slot ${id} non trouvé`);
  }
}
}
