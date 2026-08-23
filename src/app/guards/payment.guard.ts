import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Runs after authGuard on /app — assumes the user is already authenticated + approved.
// Premium users bypass this entirely; everyone else must have a verified payment.
export const paymentGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.ready();

  if (!auth.hasAccess()) {
    router.navigate(['/payment']);
    return false;
  }

  return true;
};
