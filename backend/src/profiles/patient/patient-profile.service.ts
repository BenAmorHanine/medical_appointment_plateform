import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientProfileEntity } from './entities/patient-profile.entity';
import { CreatePatientProfileDto } from './dto/create-patient-profile.dto';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';

@Injectable()
export class PatientProfileService {
  constructor(
    @InjectRepository(PatientProfileEntity)
    private readonly repository: Repository<PatientProfileEntity>,
  ) {}

  private generateMedicalRecordNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `PAT-${timestamp}-${random}`;
  }

  async findAll(): Promise<PatientProfileEntity[]> {
    return await this.repository.find({ relations: ['user'] });
  }

  async findOne(id: string): Promise<PatientProfileEntity> {
    const profile = await this.repository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException(`Profil patient avec l'id ${id} introuvable`);
    }

    return profile;
  }

  async create(
    createPatientProfileDto: CreatePatientProfileDto,
  ): Promise<PatientProfileEntity> {
    const profile = this.repository.create(createPatientProfileDto);
    profile.medicalRecordNumber = this.generateMedicalRecordNumber();
    return await this.repository.save(profile);
  }

  async update(
    id: string,
    updatePatientProfileDto: UpdatePatientProfileDto,
  ): Promise<PatientProfileEntity> {
    const profile = await this.repository.preload({
      id,
      ...updatePatientProfileDto,
    });

    if (!profile) {
      throw new NotFoundException(`Profil patient avec l'id ${id} introuvable`);
    }

    return await this.repository.save(profile);
  }

  async remove(id: string): Promise<PatientProfileEntity> {
    const profile = await this.findOne(id);
    return await this.repository.remove(profile);
  }
}
