import { Component, signal, OnInit } from '@angular/core';
import { Router, RouterOutlet, ActivatedRoute } from '@angular/router';
import { Database } from './services/database';
import { HeaderComponent } from './components/shared/header/header';
import { FooterComponent } from './components/shared/footer/footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('A3 CloudKitchen Pro');
  userId: string = '';
  user: any = null;

  constructor(private router: Router, private route: ActivatedRoute, private database: Database) { }

  ngOnInit() {
    // Listen for query parameter changes to capture userId and load user info
    this.route.queryParams.subscribe(params => {
      this.userId = params['userId'] || '';
      if (this.userId) {
        this.loadUserInfo();
      } else {
        this.user = null;
      }
    });
  }

  private loadUserInfo() {
    this.database.getCurrentUser(this.userId).subscribe({
      next: (response: any) => {
        if (response.success && response.user) {
          this.user = response.user;
        } else {
          // User verification failed, redirect to login
          console.warn('User verification failed, redirecting to login');
          this.userId = '';
          this.user = null;
          this.router.navigate(['/user/login-33810672'], {
            queryParams: { message: 'Session expired or invalid. Please log in again.' }
          });
        }
      },
      error: (err: any) => {
        console.error('Error loading user info:', err);
        // Redirect to login on error (e.g., user not found, not logged in, server error)
        this.userId = '';
        this.user = null;
        this.router.navigate(['/user/login-33810672'], {
          queryParams: { message: 'Session expired or invalid. Please log in again.' }
        });
      }
    });
  }

  logout() {
    // Call backend to set isLoggedIn to false
    if (this.userId) {
      this.database.logoutUser(this.userId).subscribe({
        next: (response: any) => {
          console.log('Logout successful:', response);
          // Clear userId and redirect to login
          this.userId = '';
          this.router.navigate(['/user/login-33810672'], {
            queryParams: { message: 'Logged out successfully' }
          });
        },
        error: (err: any) => {
          console.error('Logout error:', err);
          // Still redirect to login even if backend call fails
          this.userId = '';
          this.router.navigate(['/user/login-33810672'], {
            queryParams: { message: 'Logged out successfully' }
          });
        }
      });
    } else {
      // No userId, just redirect to login
      this.router.navigate(['/user/login-33810672']);
    }
  }
}
