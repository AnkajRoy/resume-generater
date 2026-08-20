import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'resume-generater';

  constructor(private auth: AuthService, private router: Router) {}

  get isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
