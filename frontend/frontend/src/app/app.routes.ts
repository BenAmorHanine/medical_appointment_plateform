import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/components/home.component';
import { PatientConsultationsComponent } from './features/patient-consultations/patient-consultations.component';
import { authGuard } from './features/auth/guards/auth.guard';
import { doctorGuard } from './features/auth/guards/doctor.guard';
import { patientGuard } from './features/auth/guards/patient.guard';
import { ContactComponent } from './features/contact/components/contact.component';
import { DoctorsComponent } from './features/doctors/components/doctors.component';
import { AppointmentsComponent } from './features/appointments/appointments.component';
import { DoctorAvailabilityComponent } from './features/appointments/doctor-availability/doctor-availability.component';
import { BookAppointmentComponent } from './features/appointments/book-appointment/book-appointment.component';
import { ProfileComponent } from './features/profile/profile/profile.component';
import { DashboardComponent } from './features/dashboard/components/dashboard.component';
import { AdminPatientsComponent } from './features/patients/components/admin-patients.component';

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

  { path: 'history',
    loadChildren: () =>
      import('./features/visit-history/visit-history.module')
        .then(m => m.VisitHistoryModule),
  },

  // PROTECTED ROUTES - Patient & Doctor
  {
    path: 'appointments',
    component: AppointmentsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'book',
    component: BookAppointmentComponent,
    canActivate: [authGuard, patientGuard]
  },
  {
    path: 'consultation',
    component: PatientConsultationsComponent,
    canActivate: [authGuard, patientGuard]
  },

  // PROTECTED ROUTES - Doctor Only
  {
    path: 'doctor/availability',
    component: DoctorAvailabilityComponent,
    canActivate: [authGuard, doctorGuard]
  },

  // PROTECTED ROUTES - All Authenticated Users
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard]
  },

  // PROTECTED ROUTES - Admin Only
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'patients',
    component: AdminPatientsComponent,
    canActivate: [authGuard]
  },

  // FALLBACKS
  { path: '**', redirectTo: '/' }
];
