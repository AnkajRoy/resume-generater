import { Routes } from '@angular/router';
import { ResumeFormComponent } from './components/resume-form/resume-form.component';

export const routes: Routes = [
  { path: '', component: ResumeFormComponent },
  { path: '**', redirectTo: '' }
];
