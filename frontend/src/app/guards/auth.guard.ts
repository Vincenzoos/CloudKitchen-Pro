import { CanActivateFn, Router } from '@angular/router';
import { Database } from '../services/database';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export const authGuard: CanActivateFn = async (route, state) => {
    const database = inject(Database);
    const router = inject(Router);

    // Check if userId is provided in query parameters
    const queryParams = state.root.queryParams;
    const userId = queryParams['userId'];

    if (!userId) {
        // No user ID provided, redirect to login with returnUrl
        return router.createUrlTree(['/user/login-33810672'], { queryParams: { returnUrl: state.url } });
    }

    try {
        // Verify with backend that user is actually logged in
        const response = await firstValueFrom(database.getCurrentUser(userId));

        if (response.success && response.user) {
            // User is logged in on backend, allow access
            return true;
        } else {
            // User not logged in on backend, redirect to login with returnUrl
            return router.createUrlTree(['/user/login-33810672'], { queryParams: { returnUrl: state.url } });
        }
    } catch (error) {
        // Backend verification failed, redirect to login with returnUrl
        console.error('Auth verification failed:', error);
        return router.createUrlTree(['/user/login-33810672'], { queryParams: { returnUrl: state.url } });
    }
};
