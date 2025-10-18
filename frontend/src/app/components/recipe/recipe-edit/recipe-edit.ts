import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Database, Recipe, RecipeResponse, FormOptionsResponse } from '../../../services/database';

const STUDENT_ID = "33810672";

@Component({
    selector: 'app-recipe-edit',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './recipe-edit.html',
    styleUrls: ['./recipe-edit.css']
})
export class RecipeEdit implements OnInit {
    recipeForm!: FormGroup;
    submitted = false;
    loading = false;
    loadingRecipe = true;
    error = '';
    errors: string[] = [];

    recipeId: string = '';

    // Form options from backend
    mealTypes: string[] = [];
    cuisineTypes: string[] = [];
    difficultyTypes: string[] = [];

    STUDENT_ID = STUDENT_ID;

    constructor(
        private formBuilder: FormBuilder,
        private database: Database,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit(): void {
        // Get recipe ID from route
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) {
            this.error = 'No recipe ID provided';
            this.loadingRecipe = false;
            return;
        }

        this.recipeId = id;

        // Initialize form
        this.recipeForm = this.formBuilder.group({
            title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
            chef: [{ value: '', disabled: true }, Validators.required],
            prepTime: ['', [Validators.required, Validators.min(1), Validators.max(480)]],
            mealType: ['', Validators.required],
            cuisineType: ['', Validators.required],
            difficulty: ['', Validators.required],
            servings: ['', [Validators.required, Validators.min(1), Validators.max(20)]],
            ingredients: ['', Validators.required],
            instructions: ['', Validators.required]
        });

        // Load form options and recipe data
        this.loadFormOptions();
        this.loadRecipe(id);
    }

    loadFormOptions(): void {
        this.database.getRecipeFormOptions().subscribe({
            next: (response: FormOptionsResponse) => {
                if (response.success && response.data) {
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

    loadRecipe(id: string): void {
        this.loadingRecipe = true;
        this.error = '';

        const userId = localStorage.getItem('userId');
        if (!userId) {
            this.error = 'User not logged in';
            this.loadingRecipe = false;
            return;
        }

        this.database.getRecipeById(id, userId).subscribe({
            next: (response: RecipeResponse) => {
                if (response.success && response.data) {
                    const recipe = response.data;

                    // Pre-populate form with recipe data
                    this.recipeForm.patchValue({
                        title: recipe.title,
                        chef: recipe.chef,
                        prepTime: recipe.prepTime,
                        mealType: recipe.mealType,
                        cuisineType: recipe.cuisineType,
                        difficulty: recipe.difficulty,
                        servings: recipe.servings,
                        // Join arrays with newlines for textarea
                        ingredients: recipe.ingredients.join('\n'),
                        instructions: recipe.instructions.join('\n')
                    });
                } else {
                    this.error = response.error || 'Failed to load recipe';
                }
                this.loadingRecipe = false;
            },
            error: (err: any) => {
                console.error('Error fetching recipe:', err);
                this.error = 'Failed to load recipe. Please try again.';
                this.loadingRecipe = false;
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
            chef: this.recipeForm.get('chef')?.value, // Get disabled field value
            'prep-time': parseInt(formValue.prepTime),
            'meal-type': formValue.mealType,
            'cuisine-type': formValue.cuisineType,
            difficulty: formValue.difficulty,
            servings: parseInt(formValue.servings),
            // Split ingredients and instructions by newline
            ingredients: formValue.ingredients.split('\n').map((i: string) => i.trim()).filter((i: string) => i),
            instructions: formValue.instructions.split('\n').map((i: string) => i.trim()).filter((i: string) => i)
        };

        // Call API to update recipe
        this.database.updateRecipe(this.recipeId, recipe, userId).subscribe({
            next: (response: RecipeResponse) => {
                if (response.success) {
                    // Navigate back to recipes list with success message
                    const title = recipe.title || 'Recipe';
                    this.router.navigate([`/recipe/recipes-${STUDENT_ID}`], {
                        queryParams: { message: `Recipe "${title}" updated successfully` }
                    });
                } else {
                    this.errors = response.errors || [response.error || 'Failed to update recipe'];
                    this.loading = false;
                }
            },
            error: (err: any) => {
                console.error('Error updating recipe:', err);
                this.error = err.error?.error || 'Failed to update recipe. Please try again.';
                this.errors = err.error?.errors || [];
                this.loading = false;
            }
        });
    }

    cancel(): void {
        this.router.navigate([`/recipe/recipes-${STUDENT_ID}`]);
    }
}
