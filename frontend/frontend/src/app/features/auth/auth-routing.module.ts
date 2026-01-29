import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { PasswordResetRequestComponent } from './pages/password-reset-request/password-reset-request.component';
import { PasswordResetVerifyComponent } from './pages/password-reset-verify/password-reset-verify.component';
import { PasswordResetNewComponent } from './pages/password-reset-new/password-reset-new.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'password-reset-request', component: PasswordResetRequestComponent },
  { path: 'password-reset-verify', component: PasswordResetVerifyComponent },
  { path: 'password-reset-new', component: PasswordResetNewComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
