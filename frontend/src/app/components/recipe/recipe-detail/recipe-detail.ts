import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Database, Recipe, RecipeResponse, HealthAnalysisResponse, TranslationResponse } from '../../../services/database';
import { LanguageSelector } from '../../shared/language-selector/language-selector';
import { TextToSpeech } from '../text-to-speech/text-to-speech';

const STUDENT_ID = "33810672";

@Component({
    selector: 'app-recipe-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, LanguageSelector, TextToSpeech],
    templateUrl: './recipe-detail.html',
    styleUrls: ['./recipe-detail.css']
})
export class RecipeDetail implements OnInit {
    recipe: Recipe | null = null;
    loading: boolean = true;
    error: string = '';
    userId: string = '';
    STUDENT_ID = STUDENT_ID;

    // Health analysis properties
    healthAnalysis: any = null;
    analyzingHealth: boolean = false;
    healthAnalysisError: string = '';
    showHealthAnalysis: boolean = false;

    // Translation properties
    selectedLanguage: string = '';
    translatedIngredients: string[] = [];
    translatedInstructions: string[] = [];
    translating: boolean = false;
    translationError: string = '';
    showTranslation: boolean = false;

    constructor(
        private database: Database,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit(): void {
        // Get userId from route query parameters
        this.route.queryParams.subscribe(params => {
            this.userId = params['userId'];
        });

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

        if (!this.userId) {
            this.error = 'User not logged in';
            this.loading = false;
            return;
        }

        this.database.getRecipeForView(id, this.userId).subscribe({
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
            this.router.navigate([`/recipe/edit-${STUDENT_ID}`, this.recipe._id], {
                queryParams: { userId: this.userId }
            });
        }
    }

    backToList(): void {
        this.router.navigate([`/recipe/recipes-${STUDENT_ID}`], {
            queryParams: { userId: this.userId }
        });
    }

    // Analyze recipe health using AI
    analyzeHealth(): void {
        if (!this.recipe || !this.recipe.ingredients) {
            this.healthAnalysisError = 'No ingredients available for analysis';
            return;
        }

        this.analyzingHealth = true;
        this.healthAnalysisError = '';
        this.healthAnalysis = null;

        this.database.analyzeRecipeHealth(this.recipe.ingredients, this.userId).subscribe({
            next: (response: HealthAnalysisResponse) => {
                if (response.success && response.data) {
                    this.healthAnalysis = response.data;
                    this.showHealthAnalysis = true;
                } else {
                    this.healthAnalysisError = response.error || 'Failed to analyze recipe health';
                }
                this.analyzingHealth = false;
            },
            error: (err: any) => {
                console.error('Error analyzing health:', err);
                this.healthAnalysisError = 'Failed to analyze recipe health. Please try again.';
                this.analyzingHealth = false;
            }
        });
    }

    // Get health score color class
    getHealthScoreClass(score: number): string {
        if (score >= 8) return 'text-success';
        if (score >= 6) return 'text-warning';
        return 'text-danger';
    }

    // Get health score badge class
    getHealthScoreBadgeClass(score: number): string {
        if (score >= 8) return 'bg-success';
        if (score >= 6) return 'bg-warning';
        return 'bg-danger';
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

    // Handle language selection for translation
    onLanguageSelected(languageCode: string): void {
        this.selectedLanguage = languageCode;

        if (!languageCode) {
            // Clear translation
            this.showTranslation = false;
            this.translatedIngredients = [];
            this.translatedInstructions = [];
            this.translationError = '';
            return;
        }

        if (!this.recipe || !this.recipe.ingredients || !this.recipe.instructions) {
            this.translationError = 'No recipe data available for translation';
            return;
        }

        this.translateRecipe(languageCode);
    }

    // Translate recipe to selected language
    translateRecipe(targetLanguage: string): void {
        this.translating = true;
        this.translationError = '';
        this.translatedIngredients = [];
        this.translatedInstructions = [];

        this.database.translateRecipe(
            this.recipe!.ingredients,
            this.recipe!.instructions,
            targetLanguage,
            this.userId
        ).subscribe({
            next: (response: TranslationResponse) => {
                if (response.success && response.data) {
                    this.translatedIngredients = response.data.translatedIngredients;
                    this.translatedInstructions = response.data.translatedInstructions;
                    this.showTranslation = true;
                } else {
                    this.translationError = response.error || 'Failed to translate recipe';
                }
                this.translating = false;
            },
            error: (err: any) => {
                console.error('Error translating recipe:', err);
                this.translationError = 'Failed to translate recipe. Please try again.';
                this.translating = false;
            }
        });
    }
}
