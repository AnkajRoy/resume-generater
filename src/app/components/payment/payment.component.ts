import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PaymentService, RESUME_PRICE_INR } from '../../services/payment.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css'
})
export class PaymentComponent implements OnInit, OnDestroy {
  price = RESUME_PRICE_INR;
  revealed = signal(false);
  claiming = signal(false);
  claimed = signal(false);
  error = '';

  secondsLeft = signal(180);
  private timerHandle: ReturnType<typeof setInterval> | null = null;

  constructor(private auth: AuthService, private payment: PaymentService, private router: Router) {}

  ngOnInit() {
    // If access was already granted (premium, or already verified elsewhere), skip this page entirely.
    if (this.auth.hasAccess()) {
      this.router.navigate(['/app']);
      return;
    }

    this.timerHandle = setInterval(() => {
      this.secondsLeft.update(s => Math.max(0, s - 1));
      if (this.secondsLeft() === 0 && this.timerHandle) {
        clearInterval(this.timerHandle);
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
    }
  }

  get timeDisplay(): string {
    const s = this.secondsLeft();
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  reveal() {
    this.revealed.set(true);
  }

  async markPaid() {
    this.claiming.set(true);
    this.error = '';
    const { error } = await this.payment.claimPayment();
    this.claiming.set(false);
    if (error) {
      this.error = error;
      return;
    }
    this.claimed.set(true);
  }

  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }
}
