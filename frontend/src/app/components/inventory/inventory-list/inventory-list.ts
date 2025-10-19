import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Database, InventoryItem, InventoryListResponse, InventoryResponse } from '../../../services/database';
import { ToastNotificationComponent } from '../../shared/toast-notification/toast-notification';

const STUDENT_ID = "33810672";

@Component({
    selector: 'app-inventory-list',
    standalone: true,
    imports: [CommonModule, RouterModule, ToastNotificationComponent, DatePipe],
    templateUrl: './inventory-list.html',
    styleUrls: ['./inventory-list.css']
})
export class InventoryList implements OnInit {
    @ViewChild(ToastNotificationComponent) toastComponent!: ToastNotificationComponent;
    @ViewChild('deleteConfirmModal') deleteConfirmModal!: any;

    inventory: InventoryItem[] = [];
    loading: boolean = true;
    error: string = '';
    toastMessage: string = '';
    userId: string = '';
    STUDENT_ID = STUDENT_ID;
    LOW_STOCK_THRESHOLD: number = 5;
    SOON_TO_EXPIRED_THRESHOLD: number = 3;

    // Filtering and sorting options
    filterOption: string = 'all'; // 'all', 'expired', 'expiring-soon', 'low-stock'
    sortOption: string = 'expiration-asc'; // 'expiration-asc', 'expiration-desc', 'category', 'name', 'cost-asc', 'cost-desc'

    // Inventory item to be deleted - for confirmation modal
    itemToDelete: InventoryItem | null = null;

    constructor(
        private database: Database,
        private router: Router,
        private route: ActivatedRoute,
        private modalService: NgbModal
    ) { }

    // Calculate total inventory value
    get totalInventoryValue(): number {
        return this.inventory.reduce((total, item) => total + (item.cost * item.quantity), 0);
    }

    // Get filtered and sorted inventory
    get filteredInventory(): InventoryItem[] {
        let filtered = this.inventory;

        // Apply filter
        switch (this.filterOption) {
            case 'expired':
                filtered = filtered.filter(item => this.isExpired(item.expirationDate));
                break;
            case 'expiring-soon':
                filtered = filtered.filter(item => this.isExpiringsoon(item.expirationDate) && !this.isExpired(item.expirationDate));
                break;
            case 'low-stock':
                filtered = filtered.filter(item => item.quantity <= this.LOW_STOCK_THRESHOLD);
                break;
            case 'all':
            default:
                // No filtering
                break;
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (this.sortOption) {
                case 'expiration-asc':
                    return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
                case 'expiration-desc':
                    return new Date(b.expirationDate).getTime() - new Date(a.expirationDate).getTime();
                case 'category':
                    return a.category.localeCompare(b.category);
                case 'name':
                    return a.ingredientName.localeCompare(b.ingredientName);
                case 'cost-asc':
                    return a.cost - b.cost;
                case 'cost-desc':
                    return b.cost - a.cost;
                default:
                    return 0;
            }
        });

        return filtered;
    }

    ngOnInit(): void {
        // Get userId from route query parameters
        this.route.queryParams.subscribe(params => {
            this.userId = params['userId'];
            if (params['message']) {
                this.showToast(params['message']);
            }
            // Load inventory whenever userId changes
            if (this.userId) {
                this.loadInventory();
            }
        });
    }

    loadInventory(): void {
        this.loading = true;
        this.error = '';

        if (!this.userId) {
            this.error = 'User not logged in';
            this.loading = false;
            return;
        }

        this.database.getAllInventory(this.userId).subscribe({
            next: (response: InventoryListResponse) => {
                if (response.success && response.data) {
                    this.inventory = response.data;
                } else {
                    this.error = response.error || 'Failed to load inventory';
                }
                this.loading = false;
            },
            error: (err: any) => {
                console.error('Error fetching inventory:', err);
                this.error = 'Failed to load inventory. Please try again.';
                this.loading = false;
            }
        });
    }

    // Navigate to add inventory page
    addInventory(): void {
        this.router.navigate([`/inventory/add-${STUDENT_ID}`], {
            queryParams: { userId: this.userId }
        });
    }

    // Handle filter change
    onFilterChange(event: any): void {
        this.filterOption = event.target.value;
    }

    // Handle sort change
    onSortChange(event: any): void {
        this.sortOption = event.target.value;
    }

    // Navigate to edit inventory page
    editInventory(id: string): void {
        this.router.navigate([`/inventory/edit-${STUDENT_ID}`, id], {
            queryParams: { userId: this.userId }
        });
    }

    // Open delete confirmation modal
    confirmDelete(item: InventoryItem): void {
        this.itemToDelete = item;
        this.modalService.open(this.deleteConfirmModal, {
            centered: true,
            backdrop: 'static'
        });
    }

    // Cancel deletion
    cancelDelete(modal: any): void {
        modal.dismiss('cancel');
        this.itemToDelete = null;
    }

    // Perform deletion
    deleteInventory(modal: any): void {
        if (!this.itemToDelete || !this.itemToDelete._id) return;

        if (!this.userId) {
            this.error = 'User not logged in';
            modal.close();
            return;
        }

        const id = this.itemToDelete._id;
        const name = this.itemToDelete.ingredientName;

        this.database.deleteInventory(id, this.userId).subscribe({
            next: (response: InventoryResponse) => {
                if (response.success) {
                    this.showToast(`"${name}" deleted successfully`);
                    this.loadInventory(); // Reload the list
                    modal.close('deleted');
                    this.itemToDelete = null;
                } else {
                    this.error = response.error || 'Failed to delete inventory item';
                    modal.close();
                    this.itemToDelete = null;
                }
            },
            error: (err: any) => {
                console.error('Error deleting inventory:', err);
                this.error = 'Failed to delete inventory item. Please try again.';
                modal.close();
                this.itemToDelete = null;
            }
        });
    }

    isLowStock(quantity: number): boolean {
        return quantity <= this.LOW_STOCK_THRESHOLD;
    }

    // Check if item is expiring soon (within 7 days)
    isExpiringsoon(expirationDate: string | Date): boolean {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expDate = new Date(expirationDate);
        expDate.setHours(0, 0, 0, 0);
        const daysUntilExpiry = (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry <= this.SOON_TO_EXPIRED_THRESHOLD && daysUntilExpiry >= 0;
    }

    // Check if item is expired
    isExpired(expirationDate: string | Date): boolean {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expDate = new Date(expirationDate);
        expDate.setHours(0, 0, 0, 0);
        return expDate.getTime() < today.getTime();
    }

    // Pad inventory ID with zeros
    padInventoryId(inventoryId: string | undefined): string {
        if (!inventoryId) return 'N/A';
        const numericPart = inventoryId.replace('I-', '');
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
