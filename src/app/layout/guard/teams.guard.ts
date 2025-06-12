import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { DataService } from "../../pages/service/data.service";
import { combineLatest, filter, map, Observable, take } from "rxjs";
import { ProfileService } from "../../pages/service/profile.service";
import { AuthService } from "../../pages/service/auth.service";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class TeamsGuard implements CanActivate {

    constructor(
        private dataService: DataService,
        private profileService: ProfileService,
        private authService: AuthService,
        private router: Router,
    ) {

    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        const storedUserId = this.authService.getStoredUserId();
        
        return combineLatest([
            this.dataService.profileRoles$,
            this.dataService.workGroupProfiles$,
        ]).pipe(
            filter(([profileRoles, workGroupProfiles]) => profileRoles.length > 0),
            take(1),
            map(([profileRoles, workGroupProfiles]) => {
                const isTechnician = this.profileService.isHouseTechnician(storedUserId);
                const isHousekeeper = this.profileService.isHousekeeper(storedUserId);

                if(!isTechnician && !isHousekeeper){
                    return true;
                }

                const housekeeperProfile = workGroupProfiles.find((wgp: any) => wgp.profile_id == storedUserId);

                if(housekeeperProfile){
                    this.router.navigate(['/teams', housekeeperProfile.work_group_id]);
                    return false;
                } else if(!housekeeperProfile && state.url !== '/teams'){
                    this.router.navigate(['/teams']);
                    return false;
                } 

                return true;
            })
        );
    }
}