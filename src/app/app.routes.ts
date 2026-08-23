import { Routes } from '@angular/router';
import { ResumeFormComponent } from './components/resume-form/resume-form.component';
import { LoginComponent } from './components/login/login.component';
import { PendingApprovalComponent } from './components/pending-approval/pending-approval.component';
import { PaymentComponent } from './components/payment/payment.component';
import { LandingComponent } from './components/landing/landing.component';
import { authGuard } from './guards/auth.guard';
import { paymentGuard } from './guards/payment.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'pending-approval', component: PendingApprovalComponent },
  { path: 'payment', component: PaymentComponent, canActivate: [authGuard] },
  { path: 'app', component: ResumeFormComponent, canActivate: [authGuard, paymentGuard] },
  { path: '**', redirectTo: '' }
];
