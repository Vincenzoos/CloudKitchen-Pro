import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Database } from '../../services/database';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  formData = {
    email: '',
    password: '',
    fullname: '',
    role: '',
    phone: ''
  };
  error: string = '';
  errors: string[] = [];

  constructor(private database: Database, private router: Router) { }

  onSubmit() {
    this.error = '';
    this.errors = [];
    // Basic validation
    if (!this.formData.email || !this.formData.password || !this.formData.fullname || !this.formData.role || !this.formData.phone) {
      this.errors.push('All fields are required');
      return;
    }
    // Call register API
    this.database.registerUser(this.formData).subscribe({
      next: (response) => {
        // On success, redirect to login or dashboard
        // this.router.navigate(['/login-33810672']);
        this.router.navigate(['/dashboard-33810672']);
      },
      error: (err) => {
        console.error('Registration error:', err);
        this.error = err.error?.message || 'Registration failed, please try again.';
      }
    });
  }

  formatPhoneNumber(event: any) {
    const input = event.target;
    // Remove all non-digit characters except the '+' sign
    let phone = input.value.replace(/[^\d+]/g, '');

    // Ensure the phone number starts with +61
    if (phone.startsWith('0')) {
      phone = '+61';
    }
    // Add spacing to match the format +61 4xx xxx xxx
    if (phone.startsWith('+61') && phone.length > 4) {
      phone = phone.slice(0, 3) + ' ' + phone.slice(3, 6) + ' ' + phone.slice(6, 9) + ' ' + phone.slice(9, 12);
    }

    // Set the formatted value back to the input field
    input.value = phone.trim();
    // Update the model
    this.formData.phone = phone.trim();
  }
}
