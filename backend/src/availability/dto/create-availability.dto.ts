import { IsDateString, IsString, IsInt, Min, IsUUID } from 'class-validator';

export class CreateAvailabilityDto {
  @IsDateString()
  date: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsUUID()
  doctorId: string;
}
