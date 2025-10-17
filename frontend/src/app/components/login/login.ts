import { Component, OnInit } from '@angular/core';
import { Database } from '../../services/database';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  formData = {
    email: '',
    password: '',
  };

  error: string = '';
  errors: string[] = [];
  msg: string = '';

  constructor(private database: Database, private router: Router, private route: ActivatedRoute) { }

  ngOnInit() {
    // Check for success message from registration
    this.route.queryParams.subscribe(params => {
      if (params['message']) {
        this.msg = params['message'];
        this.showToast();
      }
    });
  }

  onSubmit() {
    this.error = '';
    this.errors = [];
    // Basic validation
    if (!this.formData.email || !this.formData.password) {
      this.errors.push('All fields are required');
      return;
    }
    // Call login API
    this.database.loginUser(this.formData).subscribe({
      next: (response: any) => {
        console.log('Login successful:', response);
        // Store userId in localStorage
        localStorage.setItem('userId', response.userId);
        // Store user object in localStorage
        localStorage.setItem('user', JSON.stringify(response.user));
        // Dispatch custom event to notify App component
        window.dispatchEvent(new Event('userUpdated'));
        // Set success message and show toast
        this.msg = response.message || 'Successfully logged in!';
        this.showToast();

        // Navigate to dashboard/home/index page with message
        this.router.navigate(['/'], {
          queryParams: { message: this.msg }
        });
      },
      error: (err) => {
        console.error('Authentication error:', err);
        // Handle different error response formats
        if (err.error?.errors && Array.isArray(err.error.errors)) {
          // Validation errors (array)
          this.errors = err.error.errors;
        } else if (err.error?.error) {
          // Single error message
          this.error = err.error.error;
        } else {
          // Fallback
          this.error = 'Authentication failed, please try again.';
        }
      }
    });
  }

  private showToast() {
    console.log('Login showToast called with message:', this.msg);
    const toastEl = document.getElementById('msgToast');
    console.log('Login toast element found:', !!toastEl);

    if (toastEl && this.msg.trim() !== '') {
      // Using Bootstrap's Toast API
      const bootstrap = (window as any).bootstrap;
      console.log('Login Bootstrap available:', !!bootstrap);

      if (bootstrap && bootstrap.Toast) {
        const toast = new bootstrap.Toast(toastEl, { delay: 2000 });
        toast.show();
        console.log('Login toast shown');
      } else {
        console.warn('Bootstrap Toast not available');
      }
    } else {
      console.warn('Toast element not found');
    }
  }
}
