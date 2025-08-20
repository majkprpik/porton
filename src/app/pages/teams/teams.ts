import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { WorkGroup, Profile, Task, House, LockedTeam, WorkGroupTask, WorkGroupProfile } from '../../core/models/data.models';
import { ChipModule } from 'primeng/chip';
import { CardModule } from 'primeng/card';
import { combineLatest, Subject, takeUntil } from 'rxjs';
import { TabViewModule } from 'primeng/tabview';
import { TeamTaskCardComponent } from './team-task-card.component';
import { PanelModule } from 'primeng/panel';
import { WorkGroupService } from '../../core/services/work-group.service';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { Router } from '@angular/router';
import { DataService } from '../../core/services/data.service';

@Component({
    selector: 'app-teams',
    standalone: true,
    imports: [
        CommonModule, 
        ButtonModule, 
        ProgressSpinnerModule,
        ChipModule, 
        CardModule,
        TabViewModule,
        TeamTaskCardComponent,
        PanelModule,
        TranslateModule,
    ],
    template: `
        @if (loading) {
            <div class="loading-container">
                <p-progressSpinner strokeWidth="4" [style]="{ width: '50px', height: '50px' }" />
                <span>{{ 'TEAMS.LOADING-TEAMS' | translate }}</span>
            </div>
        } @else if (isNoAssignedGroupsMessageDisplayed()){
            <div class="no-groups-assigned">
                <span>Nemate dodijeljenih radnih grupa.</span>
            </div>
        } @else if(
            !profileService.isHousekeeper(storedUserId) && 
            !profileService.isCustomerService(storedUserId) && 
            !profileService.isHouseTechnician(storedUserId)
        ) {
            <p-panel
                [toggleable]="true"
                class="cleaning-group"
                [(collapsed)]="isCleaningCollapsed"
            >
                <ng-template pTemplate="header" class="work-group-container-header">
                    <div class="left-side">
                    <h3 class="group-name">{{ 'TEAMS.CLEANING' | translate }}</h3>
                    <span class="work-groups-count">{{workGroupService.getNumberOfCleaningWorkGroups(workGroups)}}</span>
                    </div>
                </ng-template>
                <div class="teams-container">
                    <div class="teams-list">
                        @if (cleaningGroups.length === 0) {
                            <div class="empty-state">
                                <p>{{ 'TEAMS.NO-CLEANING-GROUPS' | translate }}</p>
                            </div>
                        } @else {
                            <div class="teams-grid">
                                @for (group of cleaningGroups; track group.work_group_id; let i = $index) {
                                    @if(i == 0 || !areDaysEqual(cleaningGroups[i].created_at, cleaningGroups[i-1].created_at)){
                                        <div class="date-separator">
                                            <div class="left-half-line"></div>
                                            @if(isToday(group.created_at)){
                                                <span>{{ 'TEAMS.TODAY' | translate }}</span>
                                            } @else {
                                                <span>{{ group.created_at | date: 'dd MMM YYYY' }}</span>
                                            }
                                            <div class="right-half-line"></div>
                                        </div>
                                    }
                                    <app-team-task-card
                                        [workGroup]="group"
                                        [assignedTasks]="getAssignedTasks(group.work_group_id)"
                                        [assignedProfiles]="getAssignedProfiles(group.work_group_id)"
                                        [isRepairGroup]="group.is_repair"
                                    ></app-team-task-card> 
                                }
                            </div>
                        }
                    </div>
                </div>
            </p-panel>

            <p-panel
                [toggleable]="true"
                class="cleaning-group"
                [(collapsed)]="isRepairsCollapsed"
            >
                <ng-template pTemplate="header" class="work-group-container-header">
                    <div class="left-side">
                    <h3 class="group-name">{{ 'TEAMS.REPAIRS' | translate }}</h3>
                    <span class="work-groups-count">{{workGroupService.getNumberOfRepairWorkGroups(workGroups)}}</span>
                    </div>
                </ng-template>

                <div class="teams-container">
                    <div class="teams-list">
                        @if (repairGroups.length === 0) {
                            <div class="empty-state">
                                <p>{{ 'TEAMS.NO-REPAIR-GROUPS' | translate }}</p>
                            </div>
                        } @else {
                            <div class="teams-grid">
                                @for (group of repairGroups; track group.work_group_id; let i = $index) {
                                    @if(i == 0 || !areDaysEqual(repairGroups[i].created_at, repairGroups[i-1].created_at)){
                                        <div class="date-separator">
                                            <div class="left-half-line"></div>
                                            @if(isToday(group.created_at)){
                                                <span>{{ 'TEAMS.TODAY' | translate }}</span>
                                            } @else {
                                                <span>{{ group.created_at | date: 'dd MMM YYYY' }}</span>
                                            }
                                            <div class="right-half-line"></div>
                                        </div>
                                    }
                                    <app-team-task-card
                                        [workGroup]="group"
                                        [assignedTasks]="getAssignedTasks(group.work_group_id)"
                                        [assignedProfiles]="getAssignedProfiles(group.work_group_id)"
                                        [isRepairGroup]="group.is_repair"
                                   ></app-team-task-card> 
                                }
                            </div>
                        }
                    </div>
                </div>
            </p-panel>
        }
    `,
    styles: `
        :host ::ng-deep {
            .no-groups-assigned{
                width: 100%;
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: center;
            }

            .cleaning-group {
                .left-side{
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 10px;
                    padding-top: 10px;
                    padding-bottom: 10px;
                }

                .work-groups-count {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 1.75rem;
                    height: 1.75rem;
                    padding: 0 0.5rem;
                    background: var(--primary-color);
                    color: var(--primary-color-text);
                    border-radius: 1rem;
                    font-size: 0.9rem;
                    font-weight: 700;
                }

                .work-group-header-actions{
                    width: 100%;
                    margin-bottom: 1rem;
                }

                .p-panel {
                    margin-bottom: 10px;
                    border-radius: 12px;
                }

                .p-panel-header {
                    padding: 0.75rem 1.25rem;
                    border: none;
                    border-radius: 12px;
                    background: var(--surface-ground);
                    height: 65px;
                    
                    h3{
                        margin: 0;
                    }
                }

                .p-panel-content {
                    padding: 0;
                    border: none;
                    background: transparent !important;
                }

                .p-panel-icons {
                    order: 2;
                }
            }

            .group-icon {
                font-size: 1.2rem;
                color: var(--text-color);
            }

            .group-name {
                font-weight: 500;
                color: var(--text-color);
            }
        }

        .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: 1rem;
            color: var(--text-color-secondary);
        }

        .teams-container {
            display: flex;
            flex-direction: column;
            min-height: 320px;
            padding: 1rem;
            background-color: var(--surface-card);
            border-radius: 12px;
            padding-bottom: 30px;
        }

        .teams-list {
            flex: 1;
            padding-right: 0.5rem;
        }

        .teams-grid {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            gap: 20px;
            margin-left: 10px;
            margin-top: 15px;
            align-items: stretch;

            .date-separator{
                width: 100%;
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: center;
                
                .left-half-line{
                    height: 1px;
                    background-color: var(--surface-ground); 
                    width: 100%;
                }

                span{
                    width: 210px;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: center;
                    box-sizing: border-box;
                    padding: 0px 10px 0 10px;
                    color: var(--text-color-secondary);
                }

                .right-half-line{
                    height: 1px;
                    background-color: var(--surface-ground); 
                    width: 100%;
                }
            }
        }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 3rem;
            color: var(--text-color-secondary);
            text-align: center;

            p {
                margin: 0;
            }
        }

        @media screen and (max-width: 460px){
            .teams-grid{
                display: flex; 
                flex-direction: column; 
                align-items: center;
            }
        }
    `
})
export class Teams implements OnInit {
    loading = true;
    workGroups: WorkGroup[] = [];
    workGroupTasks: WorkGroupTask[] = [];
    tasks: Task[] = [];
    profiles: Profile[] = [];
    houses: House[] = [];
    teams: LockedTeam[] = [];
    taskImages: any[] = [];
    workGroupProfiles: WorkGroupProfile[] = [];
    storedUserId: string | null = '';

    isCleaningCollapsed = false;
    isRepairsCollapsed = false;

    routeId: string | null = null;

    private destroy$ = new Subject<void>();

    get cleaningGroups() {
        return this.workGroups
            .filter(g => !g.is_repair)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    get repairGroups() {
        return this.workGroups
            .filter(g => g.is_repair)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    constructor(
        private dataService: DataService,
        public workGroupService: WorkGroupService,
        public authService: AuthService,
        public profileService: ProfileService,
        private router: Router,
    ) {}

    ngOnInit() {
        combineLatest([
            this.dataService.workGroups$,
            this.dataService.tasks$,
            this.dataService.workGroupProfiles$,
            this.dataService.profiles$,
            this.dataService.houses$,
            this.dataService.workGroupTasks$
        ])
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: ([workGroups, tasks, workGroupProfiles, profiles, houses, workGroupTasks]) => {
                this.storedUserId = this.authService.getStoredUserId();
                this.workGroups = workGroups;
                this.tasks = tasks;
                this.profiles = profiles;
                this.houses = houses;
                this.workGroupTasks = workGroupTasks;
                this.workGroupProfiles = workGroupProfiles;

                if(this.profileService.isHousekeeper(this.storedUserId) || this.profileService.isCustomerService(this.storedUserId)) {
                    this.navigateToTodaysWorkGroup();
                } else if(this.profileService.isHouseTechnician(this.storedUserId)){
                    this.navigateToWorkGroup();
                }

                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading work groups data:', error);
                this.loading = false;
            }
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    getAssignedTasks(workGroupId: number): Task[] {
        const filteredWorkGroupTaks = this.workGroupTasks.filter(wgt => wgt.work_group_id == workGroupId);
        return this.tasks
            .filter(task => filteredWorkGroupTaks.some(wgt => wgt.task_id == task.task_id))
            .map(task => {
                const wgt = filteredWorkGroupTaks.find(wgt => wgt.task_id == task.task_id);
                if(wgt?.task_id == task.task_id){
                    return {
                        ...task,
                        index: wgt.index,
                    }
                } else {
                    return task;
                }
            });
    }

    getAssignedProfiles(workGroupId: number): Profile[] {
        const filteredWorkGroupProfiles = this.workGroupProfiles.filter(wgp => wgp.work_group_id == workGroupId);
        return this.profiles.filter(profile => filteredWorkGroupProfiles.some(wgp => wgp.profile_id == profile.id));
    }

    async getStoredImagesForTask(task: Task) {
        try {
          const fetchedImages = await this.dataService.getStoredImagesForTask(task.task_id);
  
          if (!fetchedImages || fetchedImages.length === 0) {
            this.taskImages = [];
            return;
          }
  
          this.taskImages = await Promise.all(fetchedImages.map(async (image: any) => {
            const url = await this.dataService.getPublicUrlForImage(`task-${task.task_id}/${image.name}`);
            return { name: image.name, url };
          }));
  
          this.taskImages;
        } catch (error) {
          console.error('Error fetching images:', error);
        }
    }

    areDaysEqual(date1: string, date2: string){
        return date1.slice(0, 10).split('-')[2] === date2.slice(0, 10).split('-')[2];
    }

    isToday(time_sent: string | Date): boolean {
        const date = new Date(time_sent);
        const today = new Date();

        return date.getFullYear() === today.getFullYear() &&
               date.getMonth() === today.getMonth() &&
               date.getDate() === today.getDate();
    }

    isAssignedToTodaysWorkGroup(profileId: string | null){
        const today = new Date();
        const workGroupProfiles = this.workGroupProfiles.filter(wgp => wgp.profile_id == profileId);
        const todaysWorkGroup = this.workGroups.find(wg => workGroupProfiles.some(wgp => wgp.work_group_id == wg.work_group_id) && wg.created_at.startsWith(today.toISOString().split('T')[0]));

        return !!todaysWorkGroup;
    }

    navigateToTodaysWorkGroup(){
        const today = new Date();
        const workGroupProfiles = this.workGroupProfiles.filter(wgp => wgp.profile_id == this.storedUserId);
        const todaysWorkGroup = this.workGroups.find(wg => workGroupProfiles.some(wgp => wgp.work_group_id == wg.work_group_id) && wg.created_at.startsWith(today.toISOString().split('T')[0]));

        if (todaysWorkGroup && this.router.url == '/teams') {
            this.router.navigate(['/teams', todaysWorkGroup.work_group_id]);
        }
    }

    navigateToWorkGroup(){
        const workGroupProfiles = this.workGroupProfiles.filter(wgp => wgp.profile_id == this.storedUserId);
        const workGroup = this.workGroups.find(wg => workGroupProfiles.some(wgp => wgp.work_group_id == wg.work_group_id));

        if (workGroup && this.router.url == '/teams') {
            this.router.navigate(['/teams', workGroup.work_group_id]);
        }
    }

    isNoAssignedGroupsMessageDisplayed(){
        const isHouseStaff = 
            this.profileService.isHousekeeper(this.storedUserId) || 
            this.profileService.isCustomerService(this.storedUserId);

        const isTechWithoutGroup =
            this.profileService.isHouseTechnician(this.storedUserId) &&
            !this.profileService.isProfileAssignedToWorkGroup(this.storedUserId);

        return (!this.isAssignedToTodaysWorkGroup(this.storedUserId) && isHouseStaff) || isTechWithoutGroup;
    }
} 