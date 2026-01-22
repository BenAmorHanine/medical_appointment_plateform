import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorProfileEntity } from './entities/doctor-profile.entity';
import { CreateDoctorProfileDto } from './dto/create-doctor-profile.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { UserEntity } from '../../users/entities/user.entity';

@Injectable()
export class DoctorProfileService {
  constructor(
    @InjectRepository(DoctorProfileEntity)
    private readonly repository: Repository<DoctorProfileEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findAll(): Promise<DoctorProfileEntity[]> {
    return await this.repository.find({ relations: ['user'] });
  }

  async findOne(id: string): Promise<DoctorProfileEntity> {
    const profile = await this.repository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException(`Profil médecin avec l'id ${id} introuvable`);
    }

    return profile;
  }

  async findByUserId(userId: string): Promise<DoctorProfileEntity | null> {
    return await this.repository
      .createQueryBuilder('doctorProfile')
      .leftJoinAndSelect('doctorProfile.user', 'user')
      .where('user.id = :userId', { userId })
      .getOne();
  }

  async create(
    createDoctorProfileDto: CreateDoctorProfileDto,
  ): Promise<DoctorProfileEntity> {
    // Vérifier que le user existe
    const user = await this.userRepository.findOne({
      where: { id: createDoctorProfileDto.userId },
    });

    if (!user) {
      throw new NotFoundException(
        `Utilisateur avec l'id ${createDoctorProfileDto.userId} introuvable`,
      );
    }

    const profile = this.repository.create({
      specialty: createDoctorProfileDto.specialty,
      consultationDuration: createDoctorProfileDto.consultationDuration,
      office: createDoctorProfileDto.office,
      user: user, // Assigner l'objet User, pas juste l'ID
    });

    return await this.repository.save(profile);
  }

  async update(
    id: string,
    updateDoctorProfileDto: UpdateDoctorProfileDto,
  ): Promise<DoctorProfileEntity> {
    const profile = await this.repository.preload({
      id,
      ...updateDoctorProfileDto,
    });

    if (!profile) {
      throw new NotFoundException(`Profil médecin avec l'id ${id} introuvable`);
    }

    return await this.repository.save(profile);
  }

  async remove(id: string): Promise<DoctorProfileEntity> {
    const profile = await this.findOne(id);
    return await this.repository.remove(profile);
  }

  async findFeatured(): Promise<DoctorProfileEntity[]> {
    return await this.repository.find({
      relations: ['user'],        
      take: 4,                     
      order: { id: 'DESC' }        
    });
  }
}
