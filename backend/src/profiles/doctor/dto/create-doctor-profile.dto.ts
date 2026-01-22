/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  IsBoolean,
  IsNumber,
  Max,
} from 'class-validator';

export class CreateDoctorProfileDto {
  @IsNotEmpty()
  @IsString()
  specialty: string;

  @IsInt()
  @Min(15)
  consultationDuration: number;

  @IsNumber()
  @Min(0)
  consultationFee: number;

  @IsOptional()
  @IsString()
  office?: string;



    @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsNumber({})
  @Min(0)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @IsNotEmpty()
  @IsUUID()
  userId: string;
}
