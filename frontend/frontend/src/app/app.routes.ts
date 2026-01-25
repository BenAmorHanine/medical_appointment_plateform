import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/components/home.component';
import { PatientConsultationsComponent } from './features/patient-consultations/patient-consultations.component';
import { authGuard } from './features/auth/guards/auth.guard';
import { ContactComponent } from './features/contact/components/contact.component';
import { DoctorsComponent } from './features/doctors/components/doctors.component';
import { AppointmentsComponent } from './features/appointments/appointments.component';
import { DoctorAvailabilityComponent } from './features/appointments/doctor-availability/doctor-availability.component';
import { BookAppointmentComponent } from './features/appointments/book-appointment/book-appointment.component';
import { ProfileComponent } from './features/profile/profile/profile.component';
import { DashboardComponent } from './features/dashboard/components/dashboard.component';

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

  // PROTECTED ROUTES (Auth guard)
  { path: 'appointments', component: AppointmentsComponent },
  {
    path: 'doctor/availability',
    component: DoctorAvailabilityComponent,
    canActivate: [authGuard], // et plus tard [authGuard, doctorRoleGuard]
  },
  {
  path: 'book',
  component: BookAppointmentComponent,  
  canActivate: [authGuard],  // Patient connecté
},
  {
    path: 'consultation',
    component: PatientConsultationsComponent,
    canActivate: [authGuard]
  },
   {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard]

  },
   // NEW: ADMIN DASHBOARD
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard], // admin role checked inside component for now
  },

  // FALLBACKS
  { path: '**', redirectTo: '/' }
];
