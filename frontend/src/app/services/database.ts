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
  registerUser(data: any) {
    console.log("Registering user with data:", data);
    return this.http.post(`${BASE_API_URL}/user/register-${STUDENT_ID}`, data, httpOptions);
  }
}