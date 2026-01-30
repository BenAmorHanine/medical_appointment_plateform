import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VisitHistoryComponent } from './component/visit-history/visit-history.component';
import { authGuard } from '../auth/guards/auth.guard';
import { DoctorPatientsComponent } from './component/doctor-patients/doctor-patients.component';

/*
const routes: Routes = [
  // 👤 Patient
  {
    path: '',
    component: VisitHistoryComponent,
  },

  // 👨‍⚕️ Médecin → liste des patients
  {
    path: 'doctor',
    component: DoctorPatientsComponent,
  },
   {
  path: 'history/doctor/patient',
  component: VisitHistoryComponent,
}
,
/*
  // 👨‍⚕️ Médecin → historique d’un patient
  {
    path: 'doctor/patient/:patientId',
    component: VisitHistoryComponent,
  },

 
];
*/

const routes: Routes = [
  {
    path: '',
    component: VisitHistoryComponent,
  },
  {
    path: 'doctor',
    component: DoctorPatientsComponent,
  },
  {
    path: 'doctor/patient',
    component: VisitHistoryComponent,
  },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VisitHistoryRoutingModule {}
