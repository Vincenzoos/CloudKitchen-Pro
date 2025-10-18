import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Database, Recipe, RecipeResponse, FormOptionsResponse } from '../../../services/database';

const STUDENT_ID = "33810672";

@Component({
    selector: 'app-recipe-add',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './recipe-add.html',
    styleUrls: ['./recipe-add.css']
})
export class RecipeAdd implements OnInit {
    recipeForm!: FormGroup;
    submitted = false;
    loading = false;
    error = '';
    errors: string[] = [];

    // Form options from backend
    mealTypes: string[] = [];
    cuisineTypes: string[] = [];
    difficultyTypes: string[] = [];

    STUDENT_ID = STUDENT_ID;

    // Get current user from localStorage
    currentUser: any = null;

    constructor(
        private formBuilder: FormBuilder,
        private database: Database,
        private router: Router
    ) {
        // Get current user
        const userStr = localStorage.getItem('user');
        if (userStr) {
            this.currentUser = JSON.parse(userStr);
        }
    }

    ngOnInit(): void {
        // Initialize form
        this.recipeForm = this.formBuilder.group({
            title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
            chef: [{ value: this.currentUser?.fullname || '', disabled: true }, Validators.required],
            prepTime: ['', [Validators.required, Validators.min(1), Validators.max(480)]],
            mealType: ['', Validators.required],
            cuisineType: ['', Validators.required],
            difficulty: ['', Validators.required],
            servings: ['', [Validators.required, Validators.min(1), Validators.max(20)]],
            ingredients: ['', Validators.required],
            instructions: ['', Validators.required]
        });

        // Load form options
        this.loadFormOptions();
    }

    loadFormOptions(): void {
        this.database.getRecipeFormOptions().subscribe({
            next: (response: FormOptionsResponse) => {
                if (response.success && response.data) {
                    console.log('Form options loaded:', response.data);
                    this.mealTypes = response.data.mealTypes;
                    this.cuisineTypes = response.data.cuisineTypes;
                    this.difficultyTypes = response.data.difficultyTypes;
                }
            },
            error: (err: any) => {
                console.error('Error loading form options:', err);
            }
        });
    }

    // Convenience getter for easy access to form fields
    get f() { return this.recipeForm.controls; }

    onSubmit(): void {
        this.submitted = true;
        this.errors = [];
        this.error = '';

        // Check if form options are loaded
        if (this.mealTypes.length === 0 || this.cuisineTypes.length === 0 || this.difficultyTypes.length === 0) {
            this.error = 'Form options are still loading. Please wait a moment and try again.';
            return;
        }

        // Stop if form is invalid
        if (this.recipeForm.invalid) {
            return;
        }

        this.loading = true;

        const userId = localStorage.getItem('userId');
        if (!userId) {
            this.error = 'User not logged in';
            this.loading = false;
            return;
        }

        // Prepare recipe data with kebab-case keys for backend compatibility
        const formValue = this.recipeForm.value;
        const recipe: any = {
            title: formValue.title,
            chef: this.currentUser?.fullname || formValue.chef,
            'prep-time': parseInt(formValue.prepTime),
            'meal-type': formValue.mealType,
            'cuisine-type': formValue.cuisineType,
            difficulty: formValue.difficulty,
            servings: parseInt(formValue.servings),
            // Split ingredients and instructions by newline
            ingredients: formValue.ingredients.split('\n').map((i: string) => i.trim()).filter((i: string) => i),
            instructions: formValue.instructions.split('\n').map((i: string) => i.trim()).filter((i: string) => i)
        };

        // Call API to create recipe
        this.database.createRecipe(recipe, userId).subscribe({
            next: (response: RecipeResponse) => {
                if (response.success) {
                    // Navigate back to recipes list with success message
                    const title = recipe.title || 'Recipe';
                    this.router.navigate([`/recipe/recipes-${STUDENT_ID}`], {
                        queryParams: { message: `Recipe "${title}" created successfully` }
                    });
                } else {
                    this.errors = response.errors || [response.error || 'Failed to create recipe'];
                    this.loading = false;
                }
            },
            error: (err: any) => {
                console.error('Error creating recipe:', err);
                this.error = err.error?.error || 'Failed to create recipe. Please try again.';
                this.errors = err.error?.errors || [];
                this.loading = false;
            }
        });
    }

    cancel(): void {
        this.router.navigate([`/recipe/recipes-${STUDENT_ID}`]);
    }
}
