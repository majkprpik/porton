import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateChild } from '@angular/router';
import { DataService, ProfileRole } from '../../pages/service/data.service';
import { Observable, of } from 'rxjs';
import { filter, map, take, tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class RoleGuard implements CanActivateChild {
    constructor(
        private router: Router,
        private dataService: DataService,
    ) {

    }

    canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        // Get user profile from local storage
        const userProfileStr = localStorage.getItem('userProfile');
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
                const roleName = userRole?.name;

                if(roleName){
                    const restrictedRoles = ['Sobarica', 'Kucni majstor'];
                    const isRestricted = restrictedRoles.includes(roleName);

                    if (isRestricted && !state.url.startsWith('/teams')) {
                        this.router.navigate(['/teams']);
                        return false;
                    }
                }
                
                if(!userRole){
                    return false;
                }

                if(!allowedRoles || allowedRoles.length == 0){
                    return true;
                }

                return allowedRoles.includes(userRole.name);
            }),
            tap((isAllowed: boolean) => {
                if (!isAllowed) {
                    this.router.navigate(['/home']); 
                }
            })
        );
    }
} 