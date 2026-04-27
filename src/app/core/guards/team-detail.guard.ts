import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { DataService } from "../services/data.service";
import { combineLatest, map, Observable, of, take } from "rxjs";
import { ProfileService } from "../services/profile.service";
import { AuthService } from "../services/auth.service";
import { Injectable } from "@angular/core";
import { nonNull } from "../../shared/rxjs-operators/non-null";

@Injectable({
  providedIn: 'root'
})
export class TeamDetailGuard implements CanActivate {

    constructor(
        private dataService: DataService,
        private profileService: ProfileService,
        private authService: AuthService,
        private router: Router,
    ) {}


    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        const storedUserId = this.authService.getStoredUserId();
        const targetGroupId = route.params['id'];

        if (!storedUserId) {
            this.router.navigate(['/login']); 
            return of(false);
        }
        
        return combineLatest([
            this.dataService.profileRoles$.pipe(nonNull()),
            this.dataService.workGroupProfiles$.pipe(nonNull()),
        ]).pipe(
            take(1),
            map(([profileRoles, workGroupProfiles]) => {
                const isRestrictedRole =
                    this.profileService.isHousekeeper(storedUserId) ||
                    this.profileService.isCustomerService(storedUserId) ||
                    this.profileService.isHouseTechnician(storedUserId);

                if (isRestrictedRole) {
                    return this.handleStaffRedirect(storedUserId, targetGroupId, workGroupProfiles);
                }

                return true;
            })
        );
    }

    private handleStaffRedirect(userId: string, targetGroupId: string, workGroupProfiles: any[]) {
        const userWgIds = workGroupProfiles
            .filter(wgp => wgp.profile_id === userId)
            .map(wgp => wgp.work_group_id);

        if (userWgIds.some(id => targetGroupId == id)) {
            return true;
        }

        this.router.navigate(['/teams']);
        return false;
    }
}