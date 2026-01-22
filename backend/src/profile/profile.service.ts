// src/profile/profile.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserEntity, UserRole } from '../users/entities/user.entity';
import { DoctorProfileEntity } from '../profiles/doctor/entities/doctor-profile.entity';
import { PatientProfileEntity } from '../profiles/patient/entities/patient-profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

// src/profile/profile.service.ts
@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
    @InjectRepository(DoctorProfileEntity) private doctorRepo: Repository<DoctorProfileEntity>,
    @InjectRepository(PatientProfileEntity) private patientRepo: Repository<PatientProfileEntity>,
    private dataSource: DataSource,
  ) {}

  async getProfile(userId: string, role: UserRole) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException();

    
    let specificProfile: DoctorProfileEntity | PatientProfileEntity | null = null;

    if (role === UserRole.DOCTOR) {
      specificProfile = await this.doctorRepo.findOne({ where: { user: { id: userId } } });
    } else {
      specificProfile = await this.patientRepo.findOne({ where: { user: { id: userId } } });
    }

    return { ...user, profile: specificProfile };
  }

  async updateProfile(userId: string, role: UserRole, dto: UpdateProfileDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Update Identity (User table)
      const { specialty, consultationFee, office, age, gender, ...identityData } = dto;
      await queryRunner.manager.update(UserEntity, userId, identityData);

      // 2. Update Role Data (Specific table)
      if (role === UserRole.DOCTOR) {
        const doctorData = { specialty, consultationFee, office };
        await queryRunner.manager.update(DoctorProfileEntity, { user: { id: userId } }, doctorData);
      } else {
        const patientData = { age, gender };
        await queryRunner.manager.update(PatientProfileEntity, { user: { id: userId } }, patientData);
      }

      await queryRunner.commitTransaction();
      return this.getProfile(userId, role);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}