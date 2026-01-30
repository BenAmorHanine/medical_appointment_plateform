import { ConsultationEntity } from '../../consultations/entities/consultation.entity';
import { VisitHistoryDto } from '../dto/visit-history.dto';

export class VisitHistoryMapper {
  static toDto(consultation: ConsultationEntity): VisitHistoryDto {
    return {
      consultationId: consultation.id,
      date: consultation.createdAt,
      type: consultation.type,
      status: 'EFFECTUE',
      ordonnanceUrl: consultation.ordonnanceUrl || undefined,
      certificatUrl: consultation.certificatUrl || undefined,
    };
  }
}
