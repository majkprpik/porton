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
                if(
                    this.profileService.isHousekeeper(storedUserId) || 
                    this.profileService.isCustomerService(storedUserId)
                ){
                    const today = new Date();
                    const userWorkGroupProfiles = workGroupProfiles?.filter(wgp => wgp.profile_id == storedUserId);
                    const todaysWorkGroup = workGroups?.find(wg => userWorkGroupProfiles.some(wgp => wgp.work_group_id == wg.work_group_id) && wg.created_at.startsWith(today.toISOString().split('T')[0]));
    
                    if(todaysWorkGroup){
                        this.router.navigate(['/teams', todaysWorkGroup.work_group_id]);
                        return false;
                    } else if(!todaysWorkGroup && state.url != '/teams'){
                        this.router.navigate(['/teams']);
                        return false;
                    } 
                }

                return true;
            })
        );
    }
}