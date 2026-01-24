import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { ConsultationType } from '../entities/consultation.entity';

export class CreateConsultationDto {
  @IsNotEmpty()
  @IsUUID()
  patientId: string;

  @IsNotEmpty()
  @IsUUID()
  doctorProfileId: string;

  @IsNotEmpty()
  @IsEnum(ConsultationType)
  type: ConsultationType;

  @IsOptional()
  @IsInt()
  @Min(5)
  duration?: number;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsOptional()
  @IsString()
  medicament?: string; // Médicament pour l'ordonnance

  @IsOptional()
  @IsInt()
  @Min(1)
  joursRepos?: number; // Nombre de jours de repos pour le certificat
}

