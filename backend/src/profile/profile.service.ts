import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserEntity, UserRole } from '../users/entities/user.entity';
import { DoctorProfileEntity } from '../profiles/doctor/entities/doctor-profile.entity';
import { PatientProfileEntity } from '../profiles/patient/entities/patient-profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

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
  // ===== Step 0: Helper to remove undefined fields =====
  function stripUndefined(obj: any) {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v !== undefined)
    );
  }

  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // ===== Step 1: Update Identity (User table) =====
    const { specialty, consultationDuration, consultationFee, office, age, gender, ...identityData } = dto;
    const cleanIdentityData = stripUndefined(identityData); // <-- remove undefined fields
    if (Object.keys(cleanIdentityData).length) {
      await queryRunner.manager.update(UserEntity, userId, cleanIdentityData);
    }

    // ===== Step 2: Update Role-Specific Data =====
    if (role === UserRole.DOCTOR) {
      const doctorData = stripUndefined({ specialty, consultationDuration, consultationFee, office });
      if (Object.keys(doctorData).length) { // <-- only update if there is something
        await queryRunner.manager.update(
          DoctorProfileEntity,
          { user: { id: userId } },
          doctorData
        );
      }
    } else {
      const patientData = stripUndefined({ age, gender });
      if (Object.keys(patientData).length) { // <-- only update if there is something
        await queryRunner.manager.update(
          PatientProfileEntity,
          { user: { id: userId } },
          patientData
        );
      }
    }

    // ===== Step 3: Commit transaction =====
    await queryRunner.commitTransaction();

    // ===== Step 4: Return updated profile =====
    return this.getProfile(userId, role);
  } catch (err) {
    // ===== Step 5: Safe catch to avoid instanceof error =====
    await queryRunner.rollbackTransaction();
    throw new Error(err?.message || 'Unknown error while updating profile');
  } finally {
    await queryRunner.release();
  }
}

/*
  async updateProfile(userId: string, role: UserRole, dto: UpdateProfileDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Update Identity (User table)
      const { specialty, consultationDuration, consultationFee, office, age, gender, ...identityData } = dto;
      await queryRunner.manager.update(UserEntity, userId, identityData);

      // 2. Update Role Data (Specific table)
      if (role === UserRole.DOCTOR) {
        const doctorData = { specialty, consultationDuration, consultationFee, office };
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
  }*/
}