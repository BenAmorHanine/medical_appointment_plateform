import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/components/home.component';
import { DoctorHomeComponent } from './features/doctor-home/doctor-home.component';
import { PatientConsultationsComponent } from './features/patient-consultations/patient-consultations.component';
import { authGuard } from './features/auth/guards/auth.guard';

export const routes: Routes = [
  // PUBLIC ROUTES 
  { path: '', component: HomeComponent },
  
  // AUTH ROUTES (Lazy loaded)
  { 
    path: 'auth', 
    loadChildren: () => import('./features/auth/auth-routing.module').then(m => m.AuthRoutingModule) 
  },

  // PROTECTED ROUTES (Auth guard)
  { 
    path: 'doctor-home/:doctorId', 
    component: DoctorHomeComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'patient-consultations/:patientId/:appointmentId', 
    component: PatientConsultationsComponent, 
    canActivate: [authGuard] 
  },

  // FALLBACKS
  { path: '**', redirectTo: '/auth/login' }
];
