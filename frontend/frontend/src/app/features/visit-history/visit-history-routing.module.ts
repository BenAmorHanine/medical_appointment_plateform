import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VisitHistoryComponent } from './component/visit-history/visit-history.component';
import { DoctorPatientsComponent } from './component/doctor-patients/doctor-patients.component';

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
