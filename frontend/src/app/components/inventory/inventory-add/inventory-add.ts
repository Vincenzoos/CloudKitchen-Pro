import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Database, InventoryItem, InventoryResponse, InventoryFormOptionsResponse } from '../../../services/database';

const STUDENT_ID = "33810672";

@Component({
    selector: 'app-inventory-add',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './inventory-add.html',
    styleUrls: ['./inventory-add.css']
})
export class InventoryAdd implements OnInit {
    formData = {
        ingredientName: '',
        category: '',
        quantity: '',
        unitMeasurement: '',
        purchaseDate: '',
        expirationDate: '',
        location: '',
        purchaseCost: ''
    };

    loading = false;
    error = '';
    errors: string[] = [];
    userId: string = '';

    // Form options from backend
    allowedUnits: string[] = [];
    allowedCategories: string[] = [];
    allowedLocations: string[] = [];

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
        });

        // Load form options
        this.loadFormOptions();

        // Set default dates
        const today = new Date();
        this.formData.purchaseDate = today.toISOString().split('T')[0];

        const sevenDaysLater = new Date(today);
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
        this.formData.expirationDate = sevenDaysLater.toISOString().split('T')[0];
    }

    loadFormOptions(): void {
        this.database.getInventoryFormOptions().subscribe({
            next: (response: InventoryFormOptionsResponse) => {
                if (response.success && response.data) {
                    console.log('Inventory form options loaded:', response.data);
                    this.allowedUnits = response.data.allowedUnits;
                    this.allowedCategories = response.data.allowedCategories;
                    this.allowedLocations = response.data.allowedLocations;
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
        if (this.allowedUnits.length === 0 || this.allowedCategories.length === 0 || this.allowedLocations.length === 0) {
            this.error = 'Form options are still loading. Please wait a moment and try again.';
            return;
        }

        this.loading = true;

        if (!this.userId) {
            this.error = 'User not logged in';
            this.loading = false;
            return;
        }

        // Prepare inventory data with kebab-case keys for backend compatibility
        const inventory: any = {
            ingredientName: this.formData.ingredientName,
            category: this.formData.category,
            quantity: parseFloat(this.formData.quantity),
            'unit-measurement': this.formData.unitMeasurement,
            'purchase-date': this.formData.purchaseDate,
            'expiration-date': this.formData.expirationDate,
            location: this.formData.location,
            'purchase-cost': parseFloat(this.formData.purchaseCost)
        };

        // Call API to create inventory item
        this.database.createInventory(inventory, this.userId).subscribe({
            next: (response: InventoryResponse) => {
                if (response.success) {
                    // Navigate back to inventory list with success message
                    const name = inventory.ingredientName || 'Item';
                    this.router.navigate([`/inventory/inventories-${STUDENT_ID}`], {
                        queryParams: { userId: this.userId, message: `"${name}" added successfully` }
                    });
                } else {
                    this.errors = response.errors || [response.error || 'Failed to create inventory item'];
                    this.loading = false;
                }
            },
            error: (err: any) => {
                console.error('Error creating inventory:', err);
                this.error = err.error?.error || 'Failed to create inventory item. Please try again.';
                this.errors = err.error?.errors || [];
                this.loading = false;
            }
        });
    }

    cancel(): void {
        this.router.navigate([`/inventory/inventories-${STUDENT_ID}`], {
            queryParams: { userId: this.userId }
        });
    }

    // Helper method to get today's date in YYYY-MM-DD format
    getTodayDate(): string {
        return new Date().toISOString().split('T')[0];
    }
}
