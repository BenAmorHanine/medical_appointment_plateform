import { IsEmail, IsString, MinLength, IsEnum, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user.entity'; 

export class RegisterDto {
  @ApiProperty({ example: 'dr_john_doe' })
  @IsString()
  @Length(3, 50)
  username: string;

  @ApiProperty({ example: 'doctor@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: ['admin', 'doctor', 'patient'], example: 'doctor' })
  @IsEnum(UserRole)
  role: UserRole;
}
