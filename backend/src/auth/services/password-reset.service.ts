import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../users/entities/user.entity';
import { EmailService } from './email.service';
import {
  InvalidResetCodeException,
  ExpiredResetCodeException,
  InvalidResetTokenException,
  UserNotFoundException,
} from '../exceptions/password-reset.exception';

interface PasswordResetPayload {
  sub: string;
  type: 'password_reset';
}

interface PasswordResetResponse {
  message: string;
}

interface VerifyCodeResponse {
  token: string;
}

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  private readonly RESET_CODE_LENGTH = 6;
  private readonly RESET_CODE_EXPIRY_MINUTES = 15;
  private readonly TEMP_TOKEN_EXPIRY = '10m';
  private readonly CODE_HASH_ROUNDS = 10;
  private readonly PASSWORD_HASH_ROUNDS = 12;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async requestPasswordReset(email: string): Promise<PasswordResetResponse> {
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new UserNotFoundException();
    }

    const resetCode = this.generateResetCode();
    const expiresAt = this.calculateExpiryTime(this.RESET_CODE_EXPIRY_MINUTES);
    const hashedCode = await this.hashCode(resetCode, this.CODE_HASH_ROUNDS);

    user.resetCode = hashedCode;
    user.resetCodeExpiresAt = expiresAt;
    await this.userRepository.save(user);

    this.emailService.sendPasswordResetEmail(email, resetCode, user.firstName || 'User')
      .catch((error) => {
        this.logger.error(`Failed to send email to ${email}`);
      });

    return { message: 'Reset code sent to your email. It expires in 15 minutes.' };
  }

  async verifyResetCode(email: string, code: string): Promise<VerifyCodeResponse> {
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new InvalidResetCodeException();
    }

    if (!user?.resetCode || !user.resetCodeExpiresAt) {
      throw new InvalidResetCodeException();
    }

    const now = new Date();
    if (now > user.resetCodeExpiresAt) {
      await this.clearResetCode(user);
      throw new ExpiredResetCodeException();
    }

    const isValid = await bcrypt.compare(code, user.resetCode);
    if (!isValid) {
      throw new InvalidResetCodeException();
    }

    const tempToken = this.jwtService.sign(
      { sub: user.id, type: 'password_reset' } as PasswordResetPayload,
      { expiresIn: this.TEMP_TOKEN_EXPIRY },
    );
    
    return { token: tempToken };
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<PasswordResetResponse> {
    const payload = await this.verifyResetToken(token);
    
    const user = await this.userRepository.findOne({ where: { id: payload.sub } });

    if (!user) {
      throw new InvalidResetTokenException();
    }
    
    user.password = await this.hashCode(newPassword, this.PASSWORD_HASH_ROUNDS);
    await this.clearResetCode(user);
    await this.userRepository.save(user);
    
    return { message: 'Password reset successfully. You can now login with your new password.' };
  }

  private async clearResetCode(user: UserEntity): Promise<void> {
    user.resetCode = null;
    user.resetCodeExpiresAt = null;
  }

  private generateResetCode(): string {
    const min = Math.pow(10, this.RESET_CODE_LENGTH - 1);
    const max = Math.pow(10, this.RESET_CODE_LENGTH) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  private async hashCode(code: string, rounds: number): Promise<string> {
    return bcrypt.hash(code, rounds);
  }

  private calculateExpiryTime(minutes: number): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  private async findUserByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });
  }

  private async verifyResetToken(token: string): Promise<PasswordResetPayload> {
    try {
      const payload = this.jwtService.verify<PasswordResetPayload>(token);
      if (payload.type !== 'password_reset') {
        throw new InvalidResetTokenException();
      }
      return payload;
    } catch {
      throw new InvalidResetTokenException();
    }
  }
}
