/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';

export class CreatePatientProfileDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsNotEmpty()
  @IsUUID()
  userId: string;
}
