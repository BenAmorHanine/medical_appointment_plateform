import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DoctorSendNotificationComponent } from './components/doctor-send-notification/doctor-send-notification.component';

const routes: Routes = [
  {
    path: '',
    component: DoctorSendNotificationComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DoctorNotificationRoutingModule {}
