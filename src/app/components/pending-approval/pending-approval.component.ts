import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-pending-approval',
  standalone: true,
  imports: [],
  templateUrl: './pending-approval.component.html',
  styleUrl: './pending-approval.component.css'
})
export class PendingApprovalComponent implements OnInit {
  checking = signal(false);

  constructor(private auth: AuthService, private router: Router) {}

  async ngOnInit() {
    await this.auth.ready();
    this.redirectIfNoLongerPending();
  }

  async checkAgain() {
    this.checking.set(true);
    await this.auth.refreshProfile();
    this.checking.set(false);
    this.redirectIfNoLongerPending();
  }

  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }

  private redirectIfNoLongerPending() {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
    } else if (this.auth.isApproved()) {
      this.router.navigate([this.auth.hasAccess() ? '/app' : '/payment']);
    }
  }
}
