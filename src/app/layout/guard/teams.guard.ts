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
            this.dataService.workGroups$
        ]).pipe(
            filter(([profileRoles, workGroupProfiles, workGroups]) => profileRoles.length > 0),
            take(1),
            map(([profileRoles, workGroupProfiles, workGroups]) => {
                const isTechnician = this.profileService.isHouseTechnician(storedUserId);
                const isHousekeeper = this.profileService.isHousekeeper(storedUserId);

                if(!isTechnician && !isHousekeeper){
                    return true;
                }

                const housekeeperGroups = workGroupProfiles?.filter(wgp => wgp.profile_id == storedUserId);
                const housekeeperGroup = workGroups?.filter(wg => housekeeperGroups?.some(wgp => wgp.work_group_id == wg.work_group_id))?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())?.[0];


                if(housekeeperGroup){
                    this.router.navigate(['/teams', housekeeperGroup.work_group_id]);
                    return false;
                } else if(!housekeeperGroup && state.url !== '/teams'){
                    this.router.navigate(['/teams']);
                    return false;
                } 

                return true;
            })
        );
    }
}