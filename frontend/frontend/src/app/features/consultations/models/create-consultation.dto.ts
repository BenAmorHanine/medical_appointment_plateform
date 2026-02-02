import { ConsultationType } from './consultation.model';

export interface CreateConsultationDto {
    patientId: string;
    doctorProfileId: string;
    type: ConsultationType;
    duration?: number;
    appointmentId?: string;
    medicament?: string;
    joursRepos?: number;
}
