import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SiteHeaderComponent } from '../shared/site-header/site-header.component';
import { SiteFooterComponent } from '../shared/site-footer/site-footer.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SiteHeaderComponent, SiteFooterComponent],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent {
  form: FormGroup;
  loading = signal(false);
  done = signal(false);
  error = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { password, confirmPassword } = this.form.value;
    if (password !== confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    this.loading.set(true);
    this.error = '';

    await this.auth.ready();
    const { error } = await this.auth.updatePassword(password);
    this.loading.set(false);

    if (error) {
      this.error = error;
      return;
    }

    this.done.set(true);
    setTimeout(() => this.router.navigate(['/']), 2000);
  }
}
