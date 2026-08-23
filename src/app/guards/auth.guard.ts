import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.ready();

  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  if (!auth.isApproved()) {
    router.navigate(['/pending-approval']);
    return false;
  }

  return true;
};
