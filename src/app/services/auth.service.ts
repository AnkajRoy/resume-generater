import { Injectable, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

export interface Profile {
  id: string;
  email: string;
  approved: boolean;
  role: 'free' | 'premium';
  is_paid: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  session = signal<Session | null>(null);
  profile = signal<Profile | null>(null);

  private initPromise: Promise<void>;

  constructor(private supabase: SupabaseService) {
    this.initPromise = this.init();
  }

  /** Resolves once the initial session restore (from local storage) has completed. */
  ready(): Promise<void> {
    return this.initPromise;
  }

  isAuthenticated(): boolean {
    return !!this.session();
  }

  isApproved(): boolean {
    return this.profile()?.approved === true;
  }

  isPremium(): boolean {
    return this.profile()?.role === 'premium';
  }

  /** True once the user can reach the actual generator: premium bypasses payment entirely. */
  hasAccess(): boolean {
    return this.isPremium() || this.profile()?.is_paid === true;
  }

  async signUp(email: string, password: string): Promise<{ error: string | null }> {
    // Without this, Supabase defaults the confirmation-email redirect to
    // window.location.origin alone — which drops the "/resume-generater/"
    // path on a GitHub Pages project site, sending users to a 404. Reading
    // the app's actual <base href> keeps this correct in dev and prod alike.
    const baseHref = document.querySelector('base')?.getAttribute('href') ?? '/';
    const emailRedirectTo = window.location.origin + baseHref;

    const { error } = await this.supabase.client.auth.signUp({
      email,
      password,
      options: { emailRedirectTo }
    });
    return { error: error?.message ?? null };
  }

  async signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    if (data.session) {
      this.session.set(data.session);
      await this.loadProfile(data.session.user.id);
    }
    return { error: null };
  }

  async signOut(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this.session.set(null);
    this.profile.set(null);
  }

  async requestPasswordReset(email: string): Promise<{ error: string | null }> {
    const baseHref = document.querySelector('base')?.getAttribute('href') ?? '/';
    const redirectTo = `${window.location.origin}${baseHref}reset-password`;
    const { error } = await this.supabase.client.auth.resetPasswordForEmail(email, { redirectTo });
    return { error: error?.message ?? null };
  }

  /** Sets a new password — requires an active session (normal, or the temporary one from a reset-link click). */
  async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase.client.auth.updateUser({ password: newPassword });
    return { error: error?.message ?? null };
  }

  private init(): Promise<void> {
    // Wait for the client's first INITIAL_SESSION event rather than calling
    // getSession() directly — that event only fires after Supabase has
    // finished detecting/consuming any session tokens in the URL (e.g. from
    // an email-confirmation redirect), so the guard never checks too early.
    //
    // IMPORTANT: never call another Supabase client method synchronously
    // inside this callback — the client holds an internal lock while it
    // runs, and a nested call (like loadProfile's query) needing that same
    // lock will deadlock forever. Deferring via setTimeout lets the lock
    // release first.
    return new Promise<void>(resolve => {
      this.supabase.client.auth.onAuthStateChange((event, session) => {
        this.session.set(session);
        if (session) {
          // Deferred (not awaited here) to dodge the deadlock above, but
          // ready() must still wait for it to finish — otherwise guards can
          // run isApproved()/hasAccess() against a still-null profile right
          // after a page refresh.
          setTimeout(async () => {
            await this.loadProfile(session.user.id);
            if (event === 'INITIAL_SESSION') {
              resolve();
            }
          }, 0);
        } else {
          this.profile.set(null);
          if (event === 'INITIAL_SESSION') {
            resolve();
          }
        }
      });
    });
  }

  private async loadProfile(userId: string): Promise<void> {
    const { data } = await this.supabase.client
      .from('profiles')
      .select('id, email, approved, role, is_paid')
      .eq('id', userId)
      .single();
    this.profile.set((data as Profile) ?? null);
  }

  /** Re-fetches the current user's profile — call after claiming a payment so hasAccess() stays accurate. */
  async refreshProfile(): Promise<void> {
    const userId = this.session()?.user.id;
    if (userId) {
      await this.loadProfile(userId);
    }
  }
}
