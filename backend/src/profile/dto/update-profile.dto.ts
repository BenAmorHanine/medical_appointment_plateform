import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean } from 'class-validator';
import { UserGender } from '../../profiles/patient/entities/patient-profile.entity';
import { Type, Transform } from 'class-transformer';

export class UpdateProfileDto extends PartialType(CreateUserDto) {

  // Nested role-specific data (All optional for PATCH)
  @IsOptional() @IsString() specialty?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  consultationDuration?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  consultationFee?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  available?: boolean;

  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsString() office?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  age?: number;

  @IsOptional() @IsEnum(UserGender) gender?: UserGender;
}