import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class UsageService {
  constructor(private supabase: SupabaseService, private auth: AuthService) {}

  /** Fire-and-forget: records one resume-generation event for the current user. */
  async recordGeneration(profileType: string, templateStyle: string): Promise<void> {
    const userId = this.auth.session()?.user.id;
    if (!userId) return;

    await this.supabase.client.from('resume_generations').insert({
      user_id: userId,
      profile_type: profileType,
      template_style: templateStyle
    });
  }

  /** Total resumes generated across all users — safe to show publicly (no per-row data exposed). */
  async getTotalCount(): Promise<number> {
    const { data, error } = await this.supabase.client.rpc('total_resume_generations');
    if (error || data == null) return 0;
    return Number(data);
  }
}
