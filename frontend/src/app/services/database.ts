import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

const httpOptions = {
  headers: new HttpHeaders({ "Content-Type": "application/json" }),
};

// Backend URL configuration
const BASE_API_URL = "http://localhost:8081/api";
const STUDENT_ID = "33810672";

// Recipe interface to match backend model
export interface Recipe {
  _id?: string;
  recipeId?: string;
  userId?: string;
  title: string;
  chef: string;
  ingredients: string[];
  instructions: string[];
  mealType: string;
  cuisineType: string;
  prepTime: number;
  difficulty: string;
  servings: number;
  createdDate?: Date;
}

// Response interfaces
export interface RecipeResponse {
  success: boolean;
  data?: Recipe;
  message?: string;
  error?: string;
  errors?: string[];
}

export interface RecipesListResponse {
  success: boolean;
  data?: Recipe[];
  count?: number;
  error?: string;
}

export interface FormOptionsResponse {
  success: boolean;
  data?: {
    mealTypes: string[];
    cuisineTypes: string[];
    difficultyTypes: string[];
  };
  error?: string;
}

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

  // Get current user info - verifies user is logged in with backend
  getCurrentUser(userId: string): Observable<any> {
    return this.http.get(`${BASE_API_URL}/user/me-${STUDENT_ID}?userId=${encodeURIComponent(userId)}`, httpOptions);
  }

  // Get dashboard data
  getDashboardData(userId: string) {
    return this.http.get(`${BASE_API_URL}/?userId=${encodeURIComponent(userId)}`);
  }

  // ============================================
  // RECIPE METHODS
  // ============================================

  // Get all recipes for the logged-in user
  getAllRecipes(userId: string): Observable<RecipesListResponse> {
    return this.http.get<RecipesListResponse>(
      `${BASE_API_URL}/recipe/recipes-${STUDENT_ID}?userId=${encodeURIComponent(userId)}`,
      httpOptions
    );
  }

  // Get a single recipe by ID
  getRecipeById(id: string, userId: string): Observable<RecipeResponse> {
    return this.http.get<RecipeResponse>(
      `${BASE_API_URL}/recipe/edit-${STUDENT_ID}/${id}?userId=${encodeURIComponent(userId)}`,
      httpOptions
    );
  }

  // Create a new recipe
  createRecipe(recipe: Recipe, userId: string): Observable<RecipeResponse> {
    return this.http.post<RecipeResponse>(
      `${BASE_API_URL}/recipe/add-${STUDENT_ID}?userId=${encodeURIComponent(userId)}`,
      recipe,
      httpOptions
    );
  }

  // Update an existing recipe
  updateRecipe(id: string, recipe: Recipe, userId: string): Observable<RecipeResponse> {
    return this.http.put<RecipeResponse>(
      `${BASE_API_URL}/recipe/edit-${STUDENT_ID}/${id}?userId=${encodeURIComponent(userId)}`,
      recipe,
      httpOptions
    );
  }

  // Delete a recipe
  deleteRecipe(id: string, userId: string): Observable<RecipeResponse> {
    return this.http.delete<RecipeResponse>(
      `${BASE_API_URL}/recipe/delete-${STUDENT_ID}/${id}?userId=${encodeURIComponent(userId)}`,
      httpOptions
    );
  }

  // Get form options (meal types, cuisine types, difficulty types)
  getRecipeFormOptions(): Observable<FormOptionsResponse> {
    return this.http.get<FormOptionsResponse>(
      `${BASE_API_URL}/recipe/form-options-${STUDENT_ID}`,
      httpOptions
    );
  }
}