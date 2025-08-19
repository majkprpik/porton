import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateChild } from '@angular/router';
import { ProfileRole } from '../models/data.models';
import { Observable, of } from 'rxjs';
import { filter, map, take, tap } from 'rxjs/operators';
import { DataService } from '../services/data.service';

@Injectable({
    providedIn: 'root'
})
export class RoleGuard implements CanActivateChild {
    profileRoles: ProfileRole[] = [];
    targetUrl: string = '';

    constructor(
        private router: Router,
        private dataService: DataService,
    ) {}

    canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        const userProfileStr = localStorage.getItem('userProfile');
        this.targetUrl = state.url;

        if (!userProfileStr) {
            return of(true); // If no user profile, let AuthGuard handle the redirect
        } 

        const userProfile = JSON.parse(userProfileStr);
        const allowedRoles = childRoute.data['roles'] as string[];

        return this.dataService.profileRoles$.pipe(
            filter((roles: any) => roles.length > 0),
            take(1),
            map((profileRoles: ProfileRole[]) => {
                let userRole = profileRoles.find(profileRole => profileRole.id == userProfile.role_id);

                if(!userRole){
                    return false;
                }

                if(!allowedRoles || allowedRoles.length == 0){
                    return true;
                }

                return allowedRoles.includes(userRole.name);
            }),
            tap((isAllowed: boolean) => {
                if (!isAllowed && this.targetUrl == '/home') {
                    this.router.navigate(['/teams']); 
                } else if (!isAllowed){
                    this.router.navigate(['/home']);
                }
            })
        );
    }
} 