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
        // Set success message and show toast
        this.msg = response.message || 'Successfully logged in!';
        this.showToast();

        // Navigate to dashboard after a short delay to show the toast
        setTimeout(() => {
          this.router.navigate(['/dashboard-33810672']);
        }, 2000);
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
    setTimeout(() => {
      const toastEl = document.getElementById('msgToast');
      if (toastEl && this.msg.trim() !== '') {
        // Using Bootstrap's Toast API
        // @ts-ignore - Bootstrap types may not be available
        const toast = new bootstrap.Toast(toastEl, { delay: 2000 });
        toast.show();
      }
    }, 100);
  }
}
