import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository ,LessThan} from 'typeorm';
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
    // Vérifier le médecin existe
    const doctor = await this.doctorRepository.findOne({
  where: {
    user: {
      id: createDto.doctorId,  // l'UUID du user
    },
  },
  relations: ['user'],  // important pour que TypeORM sache que user existe
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

  async findAvailableSlots(doctorId: string, date: string): Promise<AvailabilityEntity[]> {
    return await this.repository.find({
      where: { 
        doctorId, 
        date: new Date(date),
        bookedSlots: LessThan(5) // Slots disponibles
      }
    });
  }
}
