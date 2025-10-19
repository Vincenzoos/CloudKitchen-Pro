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

// Inventory interface to match backend model
export interface InventoryItem {
  _id?: string;
  inventoryId?: string;
  userId?: string;
  ingredientName: string;
  category: string;
  quantity: number;
  unit: string;
  purchaseDate: string | Date;
  expirationDate: string | Date;
  location: string;
  cost: number;
  createdDate?: string | Date;
}

// Inventory Response interfaces
export interface InventoryResponse {
  success: boolean;
  data?: InventoryItem;
  message?: string;
  error?: string;
  errors?: string[];
}

export interface InventoryListResponse {
  success: boolean;
  data?: InventoryItem[];
  count?: number;
  error?: string;
}

export interface InventoryFormOptionsResponse {
  success: boolean;
  data?: {
    allowedUnits: string[];
    allowedCategories: string[];
    allowedLocations: string[];
  };
  error?: string;
}

export interface HealthAnalysisResponse {
  success: boolean;
  data?: {
    healthScore: number;
    concerns: string[];
    benefits: string[];
    suggestions: string[];
    alternatives: { [key: string]: string };
  };
  error?: string;
}

export interface TranslationResponse {
  success: boolean;
  data?: {
    translatedIngredients: string[];
    translatedInstructions: string[];
  };
  error?: string;
}

export interface TextToSpeechResponse {
  success: boolean;
  data?: {
    audioBase64: string;
    contentType: string;
    recipeTitle: string;
  };
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class Database {
  constructor(private http: HttpClient) { }

  // Add backend API calls here

  // ============================================
  // AUTH API CALLS
  // ============================================
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
  // RECIPE API CALLS
  // ============================================

  // Get all recipes for the logged-in user
  getAllRecipes(userId: string): Observable<RecipesListResponse> {
    return this.http.get<RecipesListResponse>(
      `${BASE_API_URL}/recipe/recipes-${STUDENT_ID}?userId=${encodeURIComponent(userId)}`,
      httpOptions
    );
  }

  // Get a single recipe by ID for viewing (no ownership check)
  getRecipeForView(id: string, userId: string): Observable<RecipeResponse> {
    return this.http.get<RecipeResponse>(
      `${BASE_API_URL}/recipe/view-${STUDENT_ID}/${id}?userId=${encodeURIComponent(userId)}`,
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


  // ============================================
  // HD TASK 1 - AI HEALTH ANALYSIS
  // ============================================

  // Analyze recipe health using AI
  analyzeRecipeHealth(ingredients: string[], userId: string): Observable<HealthAnalysisResponse> {
    return this.http.post<HealthAnalysisResponse>(
      `${BASE_API_URL}/recipe/analyze-health-${STUDENT_ID}?userId=${encodeURIComponent(userId)}`,
      { ingredients },
      httpOptions
    );
  }


  // ============================================
  // HD TASK 2 - GOOGLE TRANSLATION API
  // ============================================

  // Translate recipe ingredients and instructions
  translateRecipe(ingredients: string[], instructions: string[], targetLanguage: string, userId: string): Observable<TranslationResponse> {
    return this.http.post<TranslationResponse>(
      `${BASE_API_URL}/recipe/translate-${STUDENT_ID}?userId=${encodeURIComponent(userId)}`,
      { ingredients, instructions, targetLanguage },
      httpOptions
    );
  }

  // ============================================
  // HD TASK 3 - TEXT-TO-SPEECH API
  // ============================================

  // Generate speech for recipe instructions
  generateRecipeSpeech(instructions: string[], recipeTitle: string, userId: string, options?: any): Observable<TextToSpeechResponse> {
    return this.http.post<TextToSpeechResponse>(
      `${BASE_API_URL}/recipe/text-to-speech-${STUDENT_ID}?userId=${encodeURIComponent(userId)}`,
      {
        instructions,
        recipeTitle,
        languageCode: options?.languageCode || 'en-US',
        voiceName: options?.voiceName || 'en-US-Neural2-A',
        speakingRate: options?.speakingRate || 1.0
      },
      httpOptions
    );
  }
  // ============================================
  // INVENTORY API CALLS
  // ============================================

  // Get all inventory items for the logged-in user
  getAllInventory(userId: string): Observable<InventoryListResponse> {
    return this.http.get<InventoryListResponse>(
      `${BASE_API_URL}/inventory/inventories-${STUDENT_ID}?userId=${encodeURIComponent(userId)}`,
      httpOptions
    );
  }

  // Get a single inventory item by ID
  getInventoryById(id: string, userId: string): Observable<InventoryResponse> {
    return this.http.get<InventoryResponse>(
      `${BASE_API_URL}/inventory/edit-${STUDENT_ID}/${id}?userId=${encodeURIComponent(userId)}`,
      httpOptions
    );
  }

  // Create a new inventory item
  createInventory(item: InventoryItem, userId: string): Observable<InventoryResponse> {
    return this.http.post<InventoryResponse>(
      `${BASE_API_URL}/inventory/add-${STUDENT_ID}?userId=${encodeURIComponent(userId)}`,
      item,
      httpOptions
    );
  }

  // Update an existing inventory item
  updateInventory(id: string, item: InventoryItem, userId: string): Observable<InventoryResponse> {
    return this.http.post<InventoryResponse>(
      `${BASE_API_URL}/inventory/edit-${STUDENT_ID}/${id}?userId=${encodeURIComponent(userId)}`,
      item,
      httpOptions
    );
  }

  // Delete an inventory item
  deleteInventory(id: string, userId: string): Observable<InventoryResponse> {
    return this.http.post<InventoryResponse>(
      `${BASE_API_URL}/inventory/delete-${STUDENT_ID}?userId=${encodeURIComponent(userId)}`,
      { id },
      httpOptions
    );
  }

  // Get inventory form options (units, categories, locations)
  getInventoryFormOptions(): Observable<InventoryFormOptionsResponse> {
    return this.http.get<InventoryFormOptionsResponse>(
      `${BASE_API_URL}/inventory/form-options-${STUDENT_ID}`,
      httpOptions
    );
  }
}