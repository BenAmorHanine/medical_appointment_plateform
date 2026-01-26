export type VisitStatus = 'EFFECTUE' | 'ANNULE' | 'ABSENT';

export interface VisitHistoryItem {
  consultationId: string;
  date: string;
  type: string;
  status: VisitStatus;
    ordonnanceUrl?: string;
  certificatUrl?: string;
}

export interface VisitHistoryResponse {
  blocked: boolean;
  absenceCount: number;
  history: VisitHistoryItem[];
}