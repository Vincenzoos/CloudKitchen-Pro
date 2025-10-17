import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(private router: Router) { }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): boolean {
        const user = localStorage.getItem('user');

        if (user) {
            // User is logged in, allow access
            return true;
        } else {
            // User not logged in, redirect to login
            this.router.navigate(['/user/login-33810672']);
            return false;
        }
    }
}
