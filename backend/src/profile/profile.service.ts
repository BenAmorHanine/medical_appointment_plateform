import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserEntity, UserRole } from '../users/entities/user.entity';
import { DoctorProfileEntity } from '../profiles/doctor/entities/doctor-profile.entity';
import { PatientProfileEntity } from '../profiles/patient/entities/patient-profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';


@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
    @InjectRepository(DoctorProfileEntity) private doctorRepo: Repository<DoctorProfileEntity>,
    @InjectRepository(PatientProfileEntity) private patientRepo: Repository<PatientProfileEntity>,
    private dataSource: DataSource,
  ) { }

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

  /**
   * Main profile update method. Handles identity data, specific profile data, and image.
   * Uses a single transaction to ensure data integrity and avoid deadlocks.
   */
  async updateProfile(userId: string, role: UserRole, dto: UpdateProfileDto, file?: Express.Multer.File) {
    function stripClean(obj: any) {
      return Object.fromEntries(
        Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { specialty, consultationDuration, consultationFee, office, available, age, gender, ...identityData } = dto;

      // 1. Update User (Identity)
      const cleanIdentityData = stripClean(identityData);
      if (Object.keys(cleanIdentityData).length) {
        await queryRunner.manager.update(UserEntity, userId, cleanIdentityData);
      }

      // 2. Update Role-Specific Profile
      if (role === UserRole.DOCTOR) {
        const doctorData = stripClean({
          specialty,
          consultationDuration: consultationDuration ? Number(consultationDuration) : undefined,
          consultationFee: consultationFee ? Number(consultationFee) : undefined,
          office,
          available: (dto.available as any) === 'true' || dto.available === true
        });

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
      this.logger.error("Profile Update Failed", err.stack);
      throw new BadRequestException(err?.message || 'Update failed');
    } finally {
      await queryRunner.release();
    }
  }

  // Delegate to merged updateProfile method to avoid nested transactions
  async updateProfileWithImage(
    userId: string,
    role: UserRole,
    dto: UpdateProfileDto,
    file?: Express.Multer.File,
  ) {
    return this.updateProfile(userId, role, dto, file);
  }
}