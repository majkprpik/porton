import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { DataService } from "../services/data.service";
import { combineLatest, filter, map, Observable, of, take } from "rxjs";
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
            this.dataService.workGroups$.pipe(nonNull()),
        ]).pipe(
            take(1),
            map(([profileRoles, workGroupProfiles, workGroups]) => {
                if(this.profileService.isHousekeeper(storedUserId) || this.profileService.isCustomerService(storedUserId)) {
                    return this.handleHouseStaffRedirect(storedUserId, targetGroupId, workGroupProfiles, workGroups);
                } else if(this.profileService.isHouseTechnician(storedUserId)) {
                    return this.handleTechnicianRedirect(storedUserId, targetGroupId, workGroupProfiles, workGroups);
                }

                return true;
            })
        );
    }

    private handleHouseStaffRedirect(userId: string, targetGroupId: string, workGroupProfiles: any[], workGroups: any[]) {
        const today = new Date();
        const userWorkGroupProfiles = workGroupProfiles.filter(wgp => wgp.profile_id === userId);
        
        const todaysWorkGroup = workGroups.find(wg =>
            userWorkGroupProfiles.some(wgp => wgp.work_group_id === wg.work_group_id) &&
            wg.created_at.startsWith(today.toISOString().split('T')[0])
        );

        if (!todaysWorkGroup) {
            this.router.navigate(['/teams']);
            return false;
        }

        if (targetGroupId != todaysWorkGroup.work_group_id) {
            this.router.navigate(['/teams', todaysWorkGroup.work_group_id]);
            return false;
        }

        return true;
    }

    private handleTechnicianRedirect(userId: string, targetGroupId: string, workGroupProfiles: any[], workGroups: any[]) {
        const userWorkGroupProfiles = workGroupProfiles.filter(wgp => wgp.profile_id === userId);
        const workGroup = workGroups.find(wg =>
            userWorkGroupProfiles.some(wgp => wgp.work_group_id === wg.work_group_id)
        );

        if (!workGroup) {
            this.router.navigate(['/teams']);
            return false;
        }

        if (targetGroupId != workGroup.work_group_id) {
            this.router.navigate(['/teams', workGroup.work_group_id]);
            return false;
        }

        return true;
    }
}