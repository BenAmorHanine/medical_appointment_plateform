import { Routes } from '@angular/router';
import { DoctorHomeComponent } from './features/doctor-home/doctor-home.component';
import { PatientConsultationsComponent } from './features/patient-consultations/patient-consultations.component';

export const routes: Routes = [
  { path: 'doctor-home/:id', component: DoctorHomeComponent },
  { path: 'patient-consultations/:patientId/:appointmentId', component: PatientConsultationsComponent },
  { path: '', redirectTo: '/doctor-home/bfc9a8bb-6ae7-4d46-94d8-29844d7bb076', pathMatch: 'full' },
];
