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
            this.dataService.workGroups$
        ]).pipe(
            filter(([profileRoles, workGroupProfiles, workGroups]) => profileRoles.length > 0),
            take(1),
            map(([profileRoles, workGroupProfiles, workGroups]) => {
                const isTechnician = this.profileService.isHouseTechnician(storedUserId);
                const isHousekeeper = this.profileService.isHousekeeper(storedUserId);

                if (isHousekeeper || isTechnician) {
                    const ownGroups = workGroupProfiles?.filter(wgp => wgp.profile_id == storedUserId);
                    const groups = workGroups?.filter(wg => ownGroups?.some(wgp => wgp.work_group_id == wg.work_group_id));

                    const lastGroup = groups?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())?.[0];

                    const ownGroupId = lastGroup?.work_group_id?.toString();

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