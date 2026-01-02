import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VisitHistoryComponent } from './component/visit-history/visit-history.component';
import { authGuard } from '../auth/guards/auth.guard';


const routes: Routes = [
  {
    path: '',
    component: VisitHistoryComponent,
    canActivate: [authGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VisitHistoryRoutingModule {}
