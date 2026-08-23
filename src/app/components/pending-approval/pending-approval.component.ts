import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-pending-approval',
  standalone: true,
  imports: [],
  templateUrl: './pending-approval.component.html',
  styleUrl: './pending-approval.component.css'
})
export class PendingApprovalComponent {
  constructor(private auth: AuthService, private router: Router) {}

  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }
}
