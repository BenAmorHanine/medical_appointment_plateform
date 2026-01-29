import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserEntity, UserRole } from '../users/entities/user.entity';
import { DoctorProfileEntity } from '../profiles/doctor/entities/doctor-profile.entity';
import { PatientProfileEntity } from '../profiles/patient/entities/patient-profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { BadRequestException } from '@nestjs/common';


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
async updateProfile(userId: string, role: UserRole, dto: UpdateProfileDto, file?: Express.Multer.File) {
  // Helper to remove undefined or empty strings in FormData
  function stripClean(obj: any) {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
  }

  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    //Split DTO data
    const { specialty, consultationDuration, consultationFee, office, available, age, gender, ...identityData } = dto;

    //Update User (Identity) Table
    const cleanIdentityData = stripClean(identityData);
    if (Object.keys(cleanIdentityData).length) {
      await queryRunner.manager.update(UserEntity, userId, cleanIdentityData);
    }

    // Update Specific Profile Table
    if (role === UserRole.DOCTOR) {
      const doctorData = stripClean({
        specialty,
        consultationDuration: consultationDuration ? Number(consultationDuration) : undefined,
        consultationFee: consultationFee ? Number(consultationFee) : undefined,
        office,
        available: (dto.available as any) === 'true' || dto.available === true
      });

      // Handle file path if a new image was uploaded
      if (file) {
        doctorData.image = `uploads/doctors/${file.filename}`;
      }

      if (Object.keys(doctorData).length) {
        await queryRunner.manager.update(DoctorProfileEntity, { user: { id: userId } }, doctorData);
      }
    } else {
      const patientData = stripClean({ 
        age: age ? Number(age) : undefined, 
        gender 
      });
      if (Object.keys(patientData).length) {
        await queryRunner.manager.update(PatientProfileEntity, { user: { id: userId } }, patientData);
      }
    }

    await queryRunner.commitTransaction();
    return this.getProfile(userId, role);

  } catch (err) {
    await queryRunner.rollbackTransaction();
    console.error("DATABASE ERROR:", err);
    throw new BadRequestException(err?.message || 'Update failed');
  } finally {
    await queryRunner.release();
  }
}

async updateProfileWithImage(
  userId: string,
  role: UserRole,
  dto: UpdateProfileDto,
  file?: Express.Multer.File,
) {
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();

try {
  await this.updateProfile(userId, role, dto);

  if (file && role === UserRole.DOCTOR) {
    const imagePath = `uploads/doctors/${file.filename}`;

    await queryRunner.manager.update(
      DoctorProfileEntity,
      { user: { id: userId } },
      { image: imagePath },
    );
  }

  await queryRunner.commitTransaction();

  return this.getProfile(userId, role);
} catch (err) {
  await queryRunner.rollbackTransaction();
  console.error("REAL ERROR:", err);

  throw new BadRequestException(err?.message || 'Update failed');
} finally {
  await queryRunner.release();
}


}
}