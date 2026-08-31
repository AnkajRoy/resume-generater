import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UsageService } from '../../services/usage.service';
import { SiteHeaderComponent } from '../shared/site-header/site-header.component';
import { SiteFooterComponent } from '../shared/site-footer/site-footer.component';

type Mode = 'signin' | 'signup' | 'forgot';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SiteHeaderComponent, SiteFooterComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  form: FormGroup;
  mode = signal<Mode>('signin');
  loading = signal(false);
  error = '';
  info = '';
  totalGenerated = signal<number | null>(null);

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private usage: UsageService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.usage.getTotalCount().then(count => this.totalGenerated.set(count));
  }
  async loginWithGoogle() {
    this.loading.set(true);
    this.error = '';
    this.info = '';

    const { error } = await this.auth.signInWithGoogle();
    
    // If the browser redirects immediately, code execution pauses here.
    // We only explicitly turn off loading if the redirect initializes with an error.
    if (error) {
      this.loading.set(false);
      this.error = error;
    }
  }

  toggleMode() {
    this.mode.set(this.mode() === 'signin' ? 'signup' : 'signin');
    this.error = '';
    this.info = '';
  }

  showForgotPassword() {
    this.mode.set('forgot');
    this.error = '';
    this.info = '';
  }

  backToSignIn() {
    this.mode.set('signin');
    this.error = '';
    this.info = '';
  }

  async submit() {
    if (this.mode() === 'forgot') {
      await this.submitForgotPassword();
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error = '';
    this.info = '';
    const { email, password } = this.form.value;

    if (this.mode() === 'signin') {
      const { error } = await this.auth.signIn(email, password);
      this.loading.set(false);
      if (error) {
        this.error = error;
        return;
      }
      this.router.navigate([this.auth.isApproved() ? '/app' : '/pending-approval']);
    } else {
      const { error } = await this.auth.signUp(email, password);
      this.loading.set(false);
      if (error) {
        this.error = error;
        return;
      }
      this.info = 'Account created! Your access is pending approval — you\'ll be able to sign in once approved.';
      this.mode.set('signin');
      this.form.reset();
    }
  }

  private async submitForgotPassword() {
    const emailControl = this.form.get('email');
    if (emailControl?.invalid) {
      emailControl.markAsTouched();
      return;
    }

    this.loading.set(true);
    this.error = '';
    this.info = '';

    const { error } = await this.auth.requestPasswordReset(emailControl!.value);
    this.loading.set(false);

    if (error) {
      this.error = error;
      return;
    }
    this.info = 'Check your email for a password reset link.';
  }
}
