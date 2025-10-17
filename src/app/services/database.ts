import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

const httpOptions = {
  headers: new HttpHeaders({ "Content-Type": "application/json" }),
};

// Add 
const API_URL = "http://localhost:8081/viet/api";

@Injectable({
  providedIn: 'root'
})
export class Database {
  constructor(private http: HttpClient) { }

  // Add backend API calls here
}