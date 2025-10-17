import { Component } from '@angular/core';
import { Database } from '../../services/database';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  formData = {
    email: '',
    password: '',
  };

  error: string = '';
  errors: string[] = [];

  constructor(private database: Database, private router: Router) { }

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
      next: (response) => {
        // On success, redirect to dashboard
        this.router.navigate(['/dashboard-33810672']);
      },
      error: (err) => {
        console.error('Authentication error:', err);
        this.error = err.error?.message || 'Authentication failed, please try again.';
      }
    });
  }
}
