import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Database, RecipeResponse, FormOptionsResponse } from '../../../services/database';

const STUDENT_ID = "33810672";

// TODO: Look at w10 on how to use  Confirmation Dialogs with ng-bootstrap, might need to replace toast with that
@Component({
    selector: 'app-recipe-edit',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './recipe-edit.html',
    styleUrls: ['./recipe-edit.css']
})
export class RecipeEdit implements OnInit {
    formData = {
        title: '',
        chef: '',
        prepTime: '',
        mealType: '',
        cuisineType: '',
        difficulty: '',
        servings: '',
        ingredients: '',
        instructions: ''
    };

    loading = false;
    loadingRecipe = true;
    error = '';
    errors: string[] = [];

    recipeId: string = '';
    userId: string = '';

    // Form options from backend
    mealTypes: string[] = [];
    cuisineTypes: string[] = [];
    difficultyTypes: string[] = [];

    STUDENT_ID = STUDENT_ID;

    constructor(
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

        // Get userId from route query parameters
        this.route.queryParams.subscribe(params => {
            this.userId = params['userId'];
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

        if (!this.userId) {
            this.error = 'User not logged in';
            this.loadingRecipe = false;
            return;
        }

        this.database.getRecipeById(id, this.userId).subscribe({
            next: (response: RecipeResponse) => {
                if (response.success && response.data) {
                    const recipe = response.data;

                    // Pre-populate form with recipe data
                    this.formData = {
                        title: recipe.title,
                        chef: recipe.chef,
                        prepTime: recipe.prepTime.toString(),
                        mealType: recipe.mealType,
                        cuisineType: recipe.cuisineType,
                        difficulty: recipe.difficulty,
                        servings: recipe.servings.toString(),
                        // Join arrays with newlines for textarea
                        ingredients: recipe.ingredients.join('\n'),
                        instructions: recipe.instructions.join('\n')
                    };
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

    onSubmit(): void {
        this.errors = [];
        this.error = '';

        // Check if form options are loaded
        if (this.mealTypes.length === 0 || this.cuisineTypes.length === 0 || this.difficultyTypes.length === 0) {
            this.error = 'Form options are still loading. Please wait a moment and try again.';
            return;
        }

        this.loading = true;

        if (!this.userId) {
            this.error = 'User not logged in';
            this.loading = false;
            return;
        }

        // Prepare recipe data with kebab-case keys for backend compatibility
        const recipe: any = {
            title: this.formData.title,
            chef: this.formData.chef,
            'prep-time': parseInt(this.formData.prepTime),
            'meal-type': this.formData.mealType,
            'cuisine-type': this.formData.cuisineType,
            difficulty: this.formData.difficulty,
            servings: parseInt(this.formData.servings),
            // Split ingredients and instructions by newline
            ingredients: this.formData.ingredients.split('\n').map((i: string) => i.trim()).filter((i: string) => i),
            instructions: this.formData.instructions.split('\n').map((i: string) => i.trim()).filter((i: string) => i)
        };

        // Call API to update recipe
        this.database.updateRecipe(this.recipeId, recipe, this.userId).subscribe({
            next: (response: RecipeResponse) => {
                if (response.success) {
                    // Navigate back to recipes list with success message
                    const title = recipe.title || 'Recipe';
                    this.router.navigate([`/recipe/recipes-${STUDENT_ID}`], {
                        queryParams: { userId: this.userId, message: `Recipe "${title}" updated successfully` }
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
        this.router.navigate([`/recipe/recipes-${STUDENT_ID}`], {
            queryParams: { userId: this.userId }
        });
    }
}
