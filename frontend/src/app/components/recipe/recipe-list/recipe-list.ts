import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Database, Recipe, RecipesListResponse, RecipeResponse } from '../../../services/database';
import { ToastNotificationComponent } from '../../shared/toast-notification/toast-notification';

const STUDENT_ID = "33810672";

@Component({
    selector: 'app-recipe-list',
    standalone: true,
    imports: [CommonModule, RouterModule, ToastNotificationComponent],
    templateUrl: './recipe-list.html',
    styleUrls: ['./recipe-list.css']
})
export class RecipeList implements OnInit {
    @ViewChild(ToastNotificationComponent) toastComponent!: ToastNotificationComponent;
    @ViewChild('deleteConfirmModal') deleteConfirmModal!: any;

    recipes: Recipe[] = [];
    loading: boolean = true;
    error: string = '';
    toastMessage: string = '';
    userId: string = '';
    STUDENT_ID = STUDENT_ID;

    // Recipe to be deleted - for confirmation modal
    recipeToDelete: Recipe | null = null;

    constructor(
        private database: Database,
        private router: Router,
        private route: ActivatedRoute,
        private modalService: NgbModal
    ) { }

    ngOnInit(): void {
        // Get userId from route query parameters
        this.route.queryParams.subscribe(params => {
            this.userId = params['userId'];
            if (params['message']) {
                this.showToast(params['message']);
            }
            // Load recipes whenever userId changes
            if (this.userId) {
                this.loadRecipes();
            }
        });
    }

    loadRecipes(): void {
        this.loading = true;
        this.error = '';

        if (!this.userId) {
            this.error = 'User not logged in';
            this.loading = false;
            return;
        }

        this.database.getAllRecipes(this.userId).subscribe({
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
        this.router.navigate([`/recipe/add-${STUDENT_ID}`], {
            queryParams: { userId: this.userId }
        });
    }

    // Navigate to view recipe details
    viewRecipe(id: string): void {
        this.router.navigate([`/recipe/detail-${STUDENT_ID}`, id], {
            queryParams: { userId: this.userId }
        });
    }

    // Navigate to edit recipe page
    editRecipe(id: string): void {
        this.router.navigate([`/recipe/edit-${STUDENT_ID}`, id], {
            queryParams: { userId: this.userId }
        });
    }

    // Open delete confirmation modal
    confirmDelete(recipe: Recipe): void {
        this.recipeToDelete = recipe;
        this.modalService.open(this.deleteConfirmModal, {
            centered: true,
            backdrop: 'static'
        });
    }

    // Cancel deletion
    cancelDelete(modal: any): void {
        modal.dismiss('cancel');
        this.recipeToDelete = null;
    }

    // Perform deletion
    deleteRecipe(modal: any): void {
        if (!this.recipeToDelete || !this.recipeToDelete._id) return;

        if (!this.userId) {
            this.error = 'User not logged in';
            modal.close();
            return;
        }

        const id = this.recipeToDelete._id;
        const title = this.recipeToDelete.title;

        this.database.deleteRecipe(id, this.userId).subscribe({
            next: (response: RecipeResponse) => {
                if (response.success) {
                    this.showToast(`Recipe "${title}" deleted successfully`);
                    this.loadRecipes(); // Reload the list
                    modal.close('deleted');
                    this.recipeToDelete = null;
                } else {
                    this.error = response.error || 'Failed to delete recipe';
                    modal.close();
                    this.recipeToDelete = null;
                }
            },
            error: (err: any) => {
                console.error('Error deleting recipe:', err);
                this.error = 'Failed to delete recipe. Please try again.';
                modal.close();
                this.recipeToDelete = null;
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

    // Pad recipe ID with zeros
    padRecipeId(recipeId: string | undefined): string {
        if (!recipeId) return 'N/A';
        const numericPart = recipeId.replace('R-', '');
        return numericPart.padStart(5, '0');
    }

    // Show toast notification
    private showToast(message: string): void {
        this.toastMessage = message;
        if (this.toastComponent) {
            this.toastComponent.message = message;
            this.toastComponent.show();
        }
    }
}
