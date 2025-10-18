import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Database, Recipe, RecipeResponse } from '../../../services/database';

const STUDENT_ID = "33810672";

@Component({
    selector: 'app-recipe-detail',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './recipe-detail.html',
    styleUrls: ['./recipe-detail.css']
})
export class RecipeDetail implements OnInit {
    recipe: Recipe | null = null;
    loading: boolean = true;
    error: string = '';
    STUDENT_ID = STUDENT_ID;

    constructor(
        private database: Database,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit(): void {
        // Get recipe ID from route parameter
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadRecipe(id);
        } else {
            this.error = 'No recipe ID provided';
            this.loading = false;
        }
    }

    loadRecipe(id: string): void {
        this.loading = true;
        this.error = '';

        const userId = localStorage.getItem('userId');
        if (!userId) {
            this.error = 'User not logged in';
            this.loading = false;
            return;
        }

        this.database.getRecipeById(id, userId).subscribe({
            next: (response: RecipeResponse) => {
                if (response.success && response.data) {
                    this.recipe = response.data;
                } else {
                    this.error = response.error || 'Failed to load recipe';
                }
                this.loading = false;
            },
            error: (err: any) => {
                console.error('Error fetching recipe:', err);
                this.error = 'Failed to load recipe. Please try again.';
                this.loading = false;
            }
        });
    }

    editRecipe(): void {
        if (this.recipe && this.recipe._id) {
            this.router.navigate([`/recipe/edit-${STUDENT_ID}`, this.recipe._id]);
        }
    }

    backToList(): void {
        this.router.navigate([`/recipe/recipes-${STUDENT_ID}`]);
    }

    // Get badge color based on difficulty
    getDifficultyClass(difficulty: string): string {
        switch (difficulty.toLowerCase()) {
            case 'easy':
                return 'text-bg-success';
            case 'medium':
                return 'text-bg-warning';
            case 'hard':
                return 'text-bg-danger';
            default:
                return 'text-bg-secondary';
        }
    }
}
