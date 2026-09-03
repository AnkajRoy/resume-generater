import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [],
  templateUrl: './site-header.component.html',
  styleUrl: './site-header.component.css'
})
export class SiteHeaderComponent {
  @Input() showLogout = false;
  @Input() brandTitle = 'AK ResumeBuilder';
  @Input() brandSubtitle = 'Career-ready resumes';

  constructor(private router: Router, private auth: AuthService) {}

  goHome() {
    this.router.navigate(['/']);
  }

  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }
}
