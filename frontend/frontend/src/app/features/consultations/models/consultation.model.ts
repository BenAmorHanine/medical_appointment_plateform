export enum ConsultationType {
    STANDARD = 'standard',
    CONTROLE = 'controle',
    URGENCE = 'urgence',
}

export interface Consultation {
    id: string;
    patientId: string;
    doctorProfileId: string;
    type: ConsultationType;
    duration: number;
    appointmentId: string | null;
    pdfUrl: string | null;
    medicament: string | null;
    joursRepos: number | null;
    ordonnanceUrl: string | null;
    certificatUrl: string | null;
    createdAt: string;
    updatedAt: string;
}
