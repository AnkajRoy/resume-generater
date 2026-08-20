import { Routes } from '@angular/router';
import { ResumeFormComponent } from './components/resume-form/resume-form.component';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: ResumeFormComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
