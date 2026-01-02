import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/components/home.component';
import { DoctorHomeComponent } from './features/doctor-home/doctor-home.component';
import { PatientConsultationsComponent } from './features/patient-consultations/patient-consultations.component';
import { authGuard } from './features/auth/guards/auth.guard';
import { ContactComponent } from './features/contact/components/contact.component';
import { DoctorsComponent } from './features/doctors/components/doctors.component';
import { AppointmentsComponent } from './features/appointments/appointments.component';

export const routes: Routes = [
  // PUBLIC ROUTES 
  { path: '', component: HomeComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'doctors', component: DoctorsComponent },


  
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
  { path: 'appointments', component: AppointmentsComponent },
  { 
    path: 'patient-consultations/:patientId/:appointmentId', 
    component: PatientConsultationsComponent, 
    canActivate: [authGuard] 
  },

  // FALLBACKS
  { path: '**', redirectTo: '/' }
];
