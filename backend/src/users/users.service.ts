import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
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
    return await this.repository.save(user);
  }

  // Mettre à jour un utilisateur (cours page 225)
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.repository.preload({
      id,
      ...updateUserDto,
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'id ${id} introuvable`);
    }

    return await this.repository.save(user);
  }

  // Supprimer un utilisateur (cours page 229)
  async remove(id: string): Promise<UserEntity> {
    const user = await this.findOne(id);
    return await this.repository.remove(user);
  }
}
