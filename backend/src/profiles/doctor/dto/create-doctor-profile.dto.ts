/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateDoctorProfileDto {
  @IsNotEmpty()
  @IsString()
  specialty: string;

  @IsInt()
  @Min(15)
  consultationDuration: number;

  @IsOptional()
  @IsString()
  office?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNotEmpty()
  @IsUUID()
  userId: string;
}
