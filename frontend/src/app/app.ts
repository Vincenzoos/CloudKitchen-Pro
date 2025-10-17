import { Component, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('A3 CloudKitchen Pro');
  user: any = null;

  constructor(private router: Router) {
    this.loadUser();
    // Listen for storage changes from other tabs/windows and manual updates
    window.addEventListener('storage', () => this.loadUser());
    // Also listen for custom storage event (same window/tab)
    window.addEventListener('userUpdated', () => this.loadUser());
  }

  private loadUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        this.user = JSON.parse(userStr);
      } catch (e) {
        console.error('Failed to parse user from localStorage:', e);
        this.user = null;
      }
    } else {
      this.user = null;
    }
  }

  logout() {
    // Clear localStorage
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    this.user = null;
    // Redirect to login with message
    this.router.navigate(['/user/login-33810672'], {
      queryParams: { message: 'Logged out successfully' }
    });
  }
}
