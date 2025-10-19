import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Database, InventoryItem, InventoryResponse, InventoryFormOptionsResponse } from '../../../services/database';

const STUDENT_ID = "33810672";

@Component({
    selector: 'app-inventory-edit',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './inventory-edit.html',
    styleUrls: ['./inventory-edit.css']
})
export class InventoryEdit implements OnInit {
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
    loadingItem = true;
    error = '';
    errors: string[] = [];

    inventoryId: string = '';
    userId: string = '';

    // Form options from backend
    allowedUnits: string[] = [];
    allowedCategories: string[] = [];
    allowedLocations: string[] = [];

    STUDENT_ID = STUDENT_ID;

    constructor(
        private database: Database,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit(): void {
        // Get inventory ID from route
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) {
            this.error = 'No inventory item ID provided';
            this.loadingItem = false;
            return;
        }

        this.inventoryId = id;

        // Get userId from route query parameters
        this.route.queryParams.subscribe(params => {
            this.userId = params['userId'];
        });

        // Load form options and inventory data
        this.loadFormOptions();
        this.loadInventoryItem(id);
    }

    loadFormOptions(): void {
        this.database.getInventoryFormOptions().subscribe({
            next: (response: InventoryFormOptionsResponse) => {
                if (response.success && response.data) {
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

    loadInventoryItem(id: string): void {
        this.loadingItem = true;
        this.error = '';

        if (!this.userId) {
            this.error = 'User not logged in';
            this.loadingItem = false;
            return;
        }

        this.database.getInventoryById(id, this.userId).subscribe({
            next: (response: InventoryResponse) => {
                if (response.success && response.data) {
                    const item = response.data;

                    // Pre-populate form with inventory data
                    this.formData = {
                        ingredientName: item.ingredientName,
                        category: item.category,
                        quantity: item.quantity.toString(),
                        unitMeasurement: item.unit,
                        purchaseDate: new Date(item.purchaseDate).toISOString().split('T')[0],
                        expirationDate: new Date(item.expirationDate).toISOString().split('T')[0],
                        location: item.location,
                        purchaseCost: item.cost.toString()
                    };
                } else {
                    this.error = response.error || 'Failed to load inventory item';
                }
                this.loadingItem = false;
            },
            error: (err: any) => {
                console.error('Error fetching inventory:', err);
                this.error = 'Failed to load inventory item. Please try again.';
                this.loadingItem = false;
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

        // Call API to update inventory item
        this.database.updateInventory(this.inventoryId, inventory, this.userId).subscribe({
            next: (response: InventoryResponse) => {
                if (response.success) {
                    // Navigate back to inventory list with success message
                    const name = inventory.ingredientName || 'Item';
                    this.router.navigate([`/inventory/inventories-${STUDENT_ID}`], {
                        queryParams: { userId: this.userId, message: `"${name}" updated successfully` }
                    });
                } else {
                    this.errors = response.errors || [response.error || 'Failed to update inventory item'];
                    this.loading = false;
                }
            },
            error: (err: any) => {
                console.error('Error updating inventory:', err);
                this.error = err.error?.error || 'Failed to update inventory item. Please try again.';
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
