import { Injectable, signal } from '@angular/core';

// Static credential check for now — will be replaced by real authentication later.
const VALID_EMAIL = 'ankajkuray@gmail.com';
const VALID_PASSWORD = 'ankaj2001';
const STORAGE_KEY = 'resume_app_authenticated';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authenticated = signal<boolean>(sessionStorage.getItem(STORAGE_KEY) === 'true');

  isAuthenticated(): boolean {
    return this.authenticated();
  }

  login(email: string, password: string): boolean {
    const ok = email.trim().toLowerCase() === VALID_EMAIL && password === VALID_PASSWORD;
    if (ok) {
      this.authenticated.set(true);
      sessionStorage.setItem(STORAGE_KEY, 'true');
    }
    return ok;
  }

  logout(): void {
    this.authenticated.set(false);
    sessionStorage.removeItem(STORAGE_KEY);
  }
}
