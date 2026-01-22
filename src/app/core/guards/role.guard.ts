import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateChild } from '@angular/router';
import { ProfileRole } from '../models/data.models';
import { combineLatest, Observable, of } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { DataService } from '../services/data.service';
import { StorageService, STORAGE_KEYS } from '../services/storage.service';
import { nonNull } from '../../shared/rxjs-operators/non-null';

@Injectable({
    providedIn: 'root'
})
export class RoleGuard implements CanActivateChild {
    profileRoles: ProfileRole[] = [];
    targetUrl: string = '';

    constructor(
        private router: Router,
        private dataService: DataService,
        private storageService: StorageService,
    ) {}

    canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        const userId = this.storageService.getString(STORAGE_KEYS.PROFILE_ID);
        this.targetUrl = state.url;

        if (!userId) {
            return of(true); // If no user profile, let AuthGuard handle the redirect
        } 

        const allowedRoles = childRoute.data['roles'] as string[];

        return combineLatest([
            this.dataService.profiles$.pipe(nonNull()), 
            this.dataService.profileRoles$.pipe(nonNull()),
        ]).pipe(
            take(1),
            map(([profiles, profileRoles]) => {
                const userProfile = profiles.find(profile => profile.id === userId);
                if (!userProfile) return false;

                const userRole = profileRoles.find(role => role.id === userProfile.role_id);
                if (!userRole) return false;

                if (!allowedRoles || allowedRoles.length === 0) return true;

                return allowedRoles.includes(userRole.name);
            }),
            tap((isAllowed) => {
                if (!isAllowed && this.targetUrl === '/home') {
                    this.router.navigate(['/teams']); 
                } else if (!isAllowed) {
                    this.router.navigate(['/home']);
                }
            })
        );
    }
} 