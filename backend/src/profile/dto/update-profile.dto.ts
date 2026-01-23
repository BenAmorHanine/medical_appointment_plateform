import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean } from 'class-validator';
import { UserGender } from '../../profiles/patient/entities/patient-profile.entity';

export class UpdateProfileDto extends PartialType(CreateUserDto){

  // Nested role-specific data (All optional for PATCH)
  @IsOptional() @IsString() specialty?: string;
  @IsOptional() @IsNumber() consultationDuration?: number;
  @IsOptional() @IsNumber() consultationFee?: number;
  @IsOptional() @IsBoolean() available?: boolean;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsString() office?: string;
  @IsOptional() @IsNumber() age?: number;
  @IsOptional() @IsEnum(UserGender) gender?: UserGender;
}