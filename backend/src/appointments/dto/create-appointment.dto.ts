import { IsUUID, IsOptional, IsEnum } from 'class-validator';
import { AppointmentStatus } from '../entities/appointment.entity';

export class CreateAppointmentDto {
  @IsUUID()
  availabilityId: string;

  @IsUUID()
  patientId: string;

}
