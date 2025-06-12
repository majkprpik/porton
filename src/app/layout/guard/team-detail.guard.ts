import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { DataService } from "../../pages/service/data.service";
import { combineLatest, filter, map, Observable, take } from "rxjs";
import { ProfileService } from "../../pages/service/profile.service";
import { AuthService } from "../../pages/service/auth.service";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class TeamDetailGuard implements CanActivate {

    constructor(
        private dataService: DataService,
        private profileService: ProfileService,
        private authService: AuthService,
        private router: Router,
    ) {

    }


    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        const storedUserId = this.authService.getStoredUserId();
        const targetGroupId = route.params['id'];
        
        return combineLatest([
            this.dataService.profileRoles$,
            this.dataService.workGroupProfiles$,
        ]).pipe(
            filter(([profileRoles, workGroupProfiles]) => profileRoles.length > 0),
            take(1),
            map(([profileRoles, workGroupProfiles]) => {
                const isTechnician = this.profileService.isHouseTechnician(storedUserId);
                const isHousekeeper = this.profileService.isHousekeeper(storedUserId);

                if (isHousekeeper || isTechnician) {
                    const ownGroup = workGroupProfiles.find(wgp => wgp.profile_id == storedUserId);
                    const ownGroupId = ownGroup?.work_group_id?.toString();

                    if (!ownGroupId) {
                        this.router.navigate(['/teams']);
                        return false;
                    }

                    if (targetGroupId !== ownGroupId) {
                        this.router.navigate(['/teams', ownGroupId]);
                        return false;
                    }
                }

                return true;
            })
        );
    }
}