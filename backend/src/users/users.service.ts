import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { DoctorProfileService } from '../profiles/doctor/doctor-profile.service';
import { PatientProfileService } from '../profiles/patient/patient-profile.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
    private readonly doctorProfileService: DoctorProfileService,
    private readonly patientProfileService: PatientProfileService,
  ) {}

  // Récupérer tous les utilisateurs
  async findAll(): Promise<UserEntity[]> {
    return await this.repository.find();
  }

  // Récupérer un utilisateur par ID
  async findOne(id: string): Promise<UserEntity> {
    const user = await this.repository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'id ${id} introuvable`);
    }
    return user;
  }

  // Créer un utilisateur
  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const user = this.repository.create(createUserDto);
    const savedUser = await this.repository.save(user);

    // Créer automatiquement le profil selon le rôle
    if (savedUser.role === UserRole.DOCTOR) {
      await this.doctorProfileService.create({
        userId: savedUser.id,
        specialty: 'General Practitioner', // Valeur par défaut
        consultationDuration: 30, // Valeur par défaut
        consultationFee: 50.0, // Valeur par défaut
        office: 'Unknown', // Valeur par défaut
      });
    } else if (savedUser.role === UserRole.PATIENT) {
      await this.patientProfileService.create({
        userId: savedUser.id,
      });
    }

    return savedUser;
  }
  // Mettre à jour un utilisateur
  async update(id: string, updateUserDto: Partial<CreateUserDto>): Promise<UserEntity> {
    const user = await this.repository.preload({
      id,
      ...updateUserDto,
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'id ${id} introuvable`);
    } 
    return await this.repository.save(user);
  }


  // Supprimer un utilisateur
  async remove(id: string): Promise<UserEntity> {
    const user = await this.findOne(id);
    return await this.repository.remove(user);
  }
}
