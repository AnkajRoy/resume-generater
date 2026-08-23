import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export const RESUME_PRICE_INR = 100;

@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private supabase: SupabaseService, private auth: AuthService) {}

  /** Records a payment claim (status stays 'pending' until manually verified in Supabase). */
  async claimPayment(): Promise<{ error: string | null }> {
    const userId = this.auth.session()?.user.id;
    if (!userId) {
      return { error: 'Not signed in.' };
    }

    const { error } = await this.supabase.client.from('payments').insert({
      user_id: userId,
      amount: RESUME_PRICE_INR,
      currency: 'INR',
      status: 'pending'
    });

    return { error: error?.message ?? null };
  }
}
