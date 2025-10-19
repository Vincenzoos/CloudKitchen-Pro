import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Database, RecipeResponse, FormOptionsResponse } from '../../../services/database';

const STUDENT_ID = "33810672";

@Component({
    selector: 'app-recipe-add',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './recipe-add.html',
    styleUrls: ['./recipe-add.css']
})
export class RecipeAdd implements OnInit {
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
    error = '';
    errors: string[] = [];
    userId: string = '';
    currentUser: any = null;

    // Form options from backend
    mealTypes: string[] = [];
    cuisineTypes: string[] = [];
    difficultyTypes: string[] = [];

    STUDENT_ID = STUDENT_ID;

    constructor(
        private database: Database,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        // Get userId from route query parameters
        this.route.queryParams.subscribe(params => {
            this.userId = params['userId'];
            if (this.userId) {
                this.loadCurrentUser();
            }
        });

        // Load form options
        this.loadFormOptions();
    }

    private loadCurrentUser(): void {
        this.database.getCurrentUser(this.userId).subscribe({
            next: (response: any) => {
                if (response.success && response.user) {
                    this.currentUser = response.user;
                    this.formData.chef = this.currentUser.fullname;
                    console.log('Current user loaded:', this.currentUser);
                }
            },
            error: (err: any) => {
                console.error('Error loading current user:', err);
            }
        });
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
            chef: this.currentUser ? this.currentUser.fullname : this.formData.chef,
            'prep-time': parseInt(this.formData.prepTime),
            'meal-type': this.formData.mealType,
            'cuisine-type': this.formData.cuisineType,
            difficulty: this.formData.difficulty,
            servings: parseInt(this.formData.servings),
            // Split ingredients and instructions by newline
            ingredients: this.formData.ingredients.split('\n').map((i: string) => i.trim()).filter((i: string) => i),
            instructions: this.formData.instructions.split('\n').map((i: string) => i.trim()).filter((i: string) => i)
        };

        // Call API to create recipe
        this.database.createRecipe(recipe, this.userId).subscribe({
            next: (response: RecipeResponse) => {
                if (response.success) {
                    // Navigate back to recipes list with success message
                    const title = recipe.title || 'Recipe';
                    this.router.navigate([`/recipe/recipes-${STUDENT_ID}`], {
                        queryParams: { userId: this.userId, message: `Recipe "${title}" created successfully` }
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
        this.router.navigate([`/recipe/recipes-${STUDENT_ID}`], {
            queryParams: { userId: this.userId }
        });
    }
}
