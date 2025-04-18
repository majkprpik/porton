import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class RoleGuard implements CanActivate {
    constructor(private router: Router) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        // Get user profile from local storage
        const userProfileStr = localStorage.getItem('userProfile');
        if (!userProfileStr) {
            return true; // If no user profile, let AuthGuard handle the redirect
        }

        try {
            const userProfile = JSON.parse(userProfileStr);
            const userRole = userProfile.user_metadata?.role;

            // Special handling for sobarica and terase roles
            if (userRole === 'sobarica' || userRole === 'terase') {
                // Skip the redirect if already on teams page
                if (state.url === '/teams' || state.url.startsWith('/teams/')) {
                    return true;
                }
                
                // For empty path or home, redirect to teams
                if (state.url === '/' || state.url === '/home' || state.url === '') {
                    this.router.navigate(['/teams']);
                    return false;
                }
                
                // For any other page
                if (!state.url.startsWith('/auth/')) {
                    this.router.navigate(['/teams']);
                    return false;
                }
            }

            return true;
        } catch (e) {
            console.error('Error parsing user profile:', e);
            return true; // In case of error, allow navigation
        }
    }
} 