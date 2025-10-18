import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Database, Recipe, RecipesListResponse, RecipeResponse } from '../../../services/database';

const STUDENT_ID = "33810672";

@Component({
    selector: 'app-recipe-list',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './recipe-list.html',
    styleUrls: ['./recipe-list.css']
})
export class RecipeList implements OnInit {
    recipes: Recipe[] = [];
    loading: boolean = true;
    error: string = '';
    successMessage: string = '';
    STUDENT_ID = STUDENT_ID;

    // Recipe to be deleted - for confirmation modal
    recipeToDelete: Recipe | null = null;

    constructor(
        private database: Database,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadRecipes();
    }

    loadRecipes(): void {
        this.loading = true;
        this.error = '';

        const userId = localStorage.getItem('userId');
        if (!userId) {
            this.error = 'User not logged in';
            this.loading = false;
            return;
        }

        this.database.getAllRecipes(userId).subscribe({
            next: (response: RecipesListResponse) => {
                if (response.success && response.data) {
                    this.recipes = response.data;
                } else {
                    this.error = response.error || 'Failed to load recipes';
                }
                this.loading = false;
            },
            error: (err: any) => {
                console.error('Error fetching recipes:', err);
                this.error = 'Failed to load recipes. Please try again.';
                this.loading = false;
            }
        });
    }

    // Navigate to add recipe page
    addRecipe(): void {
        this.router.navigate([`/recipe/add-${STUDENT_ID}`]);
    }

    // Navigate to view recipe details
    viewRecipe(id: string): void {
        this.router.navigate([`/recipe/detail-${STUDENT_ID}`, id]);
    }

    // Navigate to edit recipe page
    editRecipe(id: string): void {
        this.router.navigate([`/recipe/edit-${STUDENT_ID}`, id]);
    }

    // Open delete confirmation modal
    confirmDelete(recipe: Recipe): void {
        this.recipeToDelete = recipe;
        // Open Bootstrap modal
        const modalElement = document.getElementById('deleteConfirmModal');
        if (modalElement) {
            const modal = new (window as any).bootstrap.Modal(modalElement);
            modal.show();
        }
    }

    // Cancel deletion
    cancelDelete(): void {
        this.recipeToDelete = null;
        const modalElement = document.getElementById('deleteConfirmModal');
        if (modalElement) {
            const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
            modal?.hide();
        }
    }

    // Perform deletion
    deleteRecipe(): void {
        if (!this.recipeToDelete || !this.recipeToDelete._id) return;

        const userId = localStorage.getItem('userId');
        if (!userId) {
            this.error = 'User not logged in';
            return;
        }

        const id = this.recipeToDelete._id;
        const title = this.recipeToDelete.title;

        this.database.deleteRecipe(id, userId).subscribe({
            next: (response: RecipeResponse) => {
                if (response.success) {
                    this.successMessage = `Recipe "${title}" deleted successfully`;
                    this.loadRecipes(); // Reload the list
                    this.cancelDelete(); // Close modal

                    // Auto-dismiss success message after 3 seconds
                    setTimeout(() => {
                        this.successMessage = '';
                    }, 3000);
                } else {
                    this.error = response.error || 'Failed to delete recipe';
                    this.cancelDelete();
                }
            },
            error: (err: any) => {
                console.error('Error deleting recipe:', err);
                this.error = 'Failed to delete recipe. Please try again.';
                this.cancelDelete();
            }
        });
    }

    // Get badge color based on difficulty
    getDifficultyClass(difficulty: string): string {
        switch (difficulty.toLowerCase()) {
            case 'easy':
                return 'bg-success';
            case 'medium':
                return 'bg-warning text-dark';
            case 'hard':
                return 'bg-danger';
            default:
                return 'bg-secondary';
        }
    }

    // Format date to readable string
    formatDate(date: Date | undefined): string {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString();
    }

    // Pad recipe ID with zeros
    padRecipeId(recipeId: string | undefined): string {
        if (!recipeId) return 'N/A';
        const numericPart = recipeId.replace('R-', '');
        return numericPart.padStart(5, '0');
    }
}
