import { ConsultationEntity } from '../../consultations/entities/consultation.entity';

export interface DoctorPatientDto {
  patientId: string;
  fullName: string;
  visits: number;
  lastVisit: Date;
}

export class DoctorPatientMapper {
  static groupByPatient(
    consultations: ConsultationEntity[],
  ): DoctorPatientDto[] {
    const map = new Map<string, DoctorPatientDto>();

    for (const c of consultations) {
      const patientId = c.patient.id;

      if (!map.has(patientId)) {
        map.set(patientId, {
          patientId,
          fullName: `${c.patient.user.firstName} ${c.patient.user.lastName}`,
          visits: 1,
          lastVisit: c.createdAt,
        });
      } else {
        const entry = map.get(patientId)!;
        entry.visits++;
        if (c.createdAt > entry.lastVisit) {
          entry.lastVisit = c.createdAt;
        }
      }
    }

    return Array.from(map.values());
  }
}
