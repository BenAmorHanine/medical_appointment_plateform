import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class PatientHistoryQueryDto extends PaginationQueryDto {
  @ApiProperty({
    description: 'UUID of the patient',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'Patient ID must be a valid UUID' })
  patientId: string;
}