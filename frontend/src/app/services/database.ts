import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

const httpOptions = {
  headers: new HttpHeaders({ "Content-Type": "application/json" }),
};

// Backend URL configuration
const BASE_API_URL = "http://localhost:8081/api";
const STUDENT_ID = "33810672";

@Injectable({
  providedIn: 'root'
})
export class Database {
  constructor(private http: HttpClient) { }

  // Add backend API calls here
  // Register user - returns observable of backend response
  registerUser(data: any) {
    console.log("Registering user with data:", data);
    return this.http.post(`${BASE_API_URL}/user/register-${STUDENT_ID}`, data, httpOptions);
  }

  // Login user - returns observable of backend response
  loginUser(data: { email: string; password: string }) {
    console.log('Logging in with', data.email);
    return this.http.post(`${BASE_API_URL}/user/login-${STUDENT_ID}`, data, httpOptions);
  }

  // Logout user - expects userId in query string
  logoutUser(userId: string) {
    return this.http.get(`${BASE_API_URL}/user/logout-${STUDENT_ID}?userId=${encodeURIComponent(userId)}`);
  }

  // Get dashboard data
  getDashboardData(userId: string) {
    return this.http.get(`${BASE_API_URL}/user/dashboard-${STUDENT_ID}?userId=${encodeURIComponent(userId)}`);
  }
}