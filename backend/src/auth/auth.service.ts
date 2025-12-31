import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity, UserRole } from '../users/entities/user.entity'; 
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'username', 'password', 'role'],
    });

    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async login(user: any): Promise<any> {
    const payload = { 
      sub: user.id, 
      email: user.email, 
      username: user.username,
      role: user.role 
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<any> {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const user = this.userRepository.create({
      username: registerDto.username,
      email: registerDto.email,
      password: registerDto.password,
      role: registerDto.role,
    });

    const savedUser = await this.userRepository.save(user);
    const { password, ...result } = savedUser;

    const payload = { sub: result.id, email: result.email, role: result.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: result,
    };
  }
}
