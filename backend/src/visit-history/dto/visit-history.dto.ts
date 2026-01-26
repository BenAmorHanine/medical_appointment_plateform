import { ConsultationType } from '../../consultations/entities/consultation.entity';

export type VisitStatus = 'EFFECTUE' | 'ABSENT' | 'ANNULE';

export class VisitHistoryDto {
  consultationId: string;
  date: Date;
  type: ConsultationType;
  status: VisitStatus;
  ordonnanceUrl?: string;
  certificatUrl?: string;
}

