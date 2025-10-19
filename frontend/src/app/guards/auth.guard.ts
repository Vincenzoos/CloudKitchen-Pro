import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Database } from '../services/database';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(private router: Router, private database: Database) { }

    async canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Promise<boolean> {
        // Check if userId is provided in query parameters
        const queryParams = state.root.queryParams;
        const userId = queryParams['userId'];

        if (!userId) {
            // No user ID provided, redirect to login
            this.router.navigate(['/user/login-33810672']);
            return false;
        }

        try {
            // Verify with backend that user is actually logged in
            const response = await firstValueFrom(this.database.verifyUserLogin(userId));

            if (response.success && response.user) {
                // User is logged in on backend, allow access
                return true;
            } else {
                // User not logged in on backend, redirect to login
                this.router.navigate(['/user/login-33810672']);
                return false;
            }
        } catch (error) {
            // Backend verification failed, redirect to login
            console.error('Auth verification failed:', error);
            this.router.navigate(['/user/login-33810672']);
            return false;
        }
    }
}
