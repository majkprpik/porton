import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DataService, WorkGroup, Profile, Task, House, LockedTeam, TaskProgressType, TaskType, WorkGroupTask } from '../service/data.service';
import { ChipModule } from 'primeng/chip';
import { CardModule } from 'primeng/card';
import { combineLatest } from 'rxjs';
import { Router } from '@angular/router';
import { TabViewModule } from 'primeng/tabview';
import { TeamTaskCardComponent } from '../../layout/component/team-task-card.component';

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
        TeamTaskCardComponent
    ],
    template: `
        @if (loading) {
            <div class="loading-container">
                <p-progressSpinner strokeWidth="4" [style]="{ width: '50px', height: '50px' }" />
                <span>Učitavanje timova...</span>
            </div>
        } @else {
            <div class="teams-container">
                <h2>Čišćenje</h2>
                <div class="teams-list">
                    @if (workGroups.length === 0) {
                        <div class="empty-state">
                            <p>Nema kreiranih timova</p>
                        </div>
                    } @else {
                        <div class="teams-grid">
                            @for (group of workGroups; track group.work_group_id) {
                                @if (!isRepairWorkGroup(group)){
                                   <app-team-task-card
                                        [workGroup]="group"
                                        [workGroupTasks]="getAssignedTasks(group.work_group_id)"
                                        [workGroupStaff]="getAssignedStaff(group.work_group_id)"
                                        [isRepairGroup]="isRepairWorkGroup(group)"
                                   ></app-team-task-card> 
                                }
                            }
                        </div>
                    }
                </div>
            </div>

            <div class="teams-container">
                <h2>Popravci</h2>
                <div class="teams-list">
                    @if (workGroups.length === 0) {
                        <div class="empty-state">
                            <p>Nema kreiranih timova</p>
                        </div>
                    } @else {
                        <div class="teams-grid">
                            @for (group of workGroups; track group.work_group_id) {
                                @if (isRepairWorkGroup(group)){
                                    <app-team-task-card
                                        [workGroup]="group"
                                        [workGroupTasks]="getAssignedTasks(group.work_group_id)"
                                        [workGroupStaff]="getAssignedStaff(group.work_group_id)"
                                        [isRepairGroup]="isRepairWorkGroup(group)"
                                   ></app-team-task-card> 
                                }
                            }
                        </div>
                    }
                </div>
            </div>
        }
    `,
    styles: `
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
            min-height: 500px;
            padding: 1rem;
            background-color: var(--surface-card);
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            margin-bottom: 15px;
        }

        .teams-list {
            flex: 1;
            overflow-y: auto;
            padding-right: 0.5rem;
        }

        .teams-grid {
            display: flex;
            flex-direction: row;
            gap: 20px;
            margin-left: 10px;
            margin-top: 15px;
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
    `
})
export class Teams implements OnInit {
    loading = true;
    workGroups: WorkGroup[] = [];
    workGroupTasks: { [key: number]: Task[] } = {};
    workGroupStaff: { [key: number]: Profile[] } = {};
    allTasks: Task[] = [];
    allProfiles: Profile[] = [];
    houses: House[] = [];
    teams: LockedTeam[] = [];
    taskProgressTypes: TaskProgressType[] = [];
    taskTypes: TaskType[] = [];
    allWorkGroupTasks: WorkGroupTask[] = [];
    taskImages: any[] = [];

    constructor(
        private dataService: DataService,
        private router: Router,
    ) {}

    ngOnInit() {
        // Use combineLatest to wait for all required data
        combineLatest([
            this.dataService.workGroups$,
            this.dataService.tasks$,
            this.dataService.workGroupProfiles$,
            this.dataService.profiles$,
            this.dataService.houses$,
            this.dataService.taskProgressTypes$,
            this.dataService.taskTypes$,
        ]).subscribe({
            next: ([workGroups, tasks, workGroupProfiles, profiles, houses, taskProgressTypes, taskTypes]) => {
                this.workGroups = workGroups;
                this.allTasks = tasks;
                this.allProfiles = profiles;
                this.houses = houses;
                this.taskProgressTypes = taskProgressTypes;
                this.taskTypes = taskTypes;
                
                // Map work group staff
                this.workGroupStaff = {};
                workGroupProfiles.forEach(assignment => {
                    if (!this.workGroupStaff[assignment.work_group_id]) {
                        this.workGroupStaff[assignment.work_group_id] = [];
                    }
                    const profile = profiles.find(p => p.id === assignment.profile_id);
                    if (profile) {
                        this.workGroupStaff[assignment.work_group_id] = [...this.workGroupStaff[assignment.work_group_id], profile];
                    }
                });

                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading work groups data:', error);
                this.loading = false;
            }
        });

        this.dataService.workGroupTasks$.subscribe(workGroupTasks => {
            this.allWorkGroupTasks = workGroupTasks;
            this.workGroupTasks = {};

            workGroupTasks.forEach(workGroupTask => {
                if (!this.workGroupTasks[workGroupTask.work_group_id]) {
                    this.workGroupTasks[workGroupTask.work_group_id] = [];
                }
                const task = this.allTasks.find(t => t.task_id === workGroupTask.task_id);
                if (task) {
                    this.workGroupTasks[workGroupTask.work_group_id] = [...this.workGroupTasks[workGroupTask.work_group_id], task];
                }
            });
        });

        this.dataService.$workGroupsUpdate.subscribe(res => {
          if(res && res.eventType == 'INSERT') {
            if(!this.workGroups.find(wg => wg.work_group_id == res.new.work_group_id)) {
                this.workGroups = [...this.workGroups, res.new];
                this.dataService.updateWorkGroups(this.workGroups);
            }
          } else if(res && res.eventType == 'DELETE') {
                this.workGroups = this.workGroups.filter(wg => wg.work_group_id != res.old.work_group_id);
          }
        });

        this.dataService.$workGroupTasksUpdate.subscribe(res => {
          if(res && res.eventType == 'INSERT'){
            if(!this.workGroupTasks[res.new.work_group_id]){
                this.workGroupTasks[res.new.work_group_id] = [];
            }

            if(!this.workGroupTasks[res.new.work_group_id].some(task => task.task_id == res.new.task_id)){
                let task = this.allTasks.find(task => task.task_id == res.new.task_id);
                if(task){
                    this.workGroupTasks[res.new.work_group_id] = [...this.workGroupTasks[res.new.work_group_id], task];
                    this.allWorkGroupTasks = [...this.allWorkGroupTasks, res.new];
                }
            }
        
            this.dataService.setWorkGroupTasks(this.allWorkGroupTasks);
          } else if(res && res.eventType == 'DELETE'){
                this.workGroupTasks[res.old.work_group_id] = this.workGroupTasks[res.old.work_group_id].filter(task => task.task_id != res.old.task_id);
                this.allWorkGroupTasks = this.allWorkGroupTasks.filter(wgt => wgt.task_id != res.old.task_id);
          }
        });
    }

    getHouseNumber(houseId: number): string {
        const house = this.houses.find(h => h.house_id === houseId);
        return house ? house.house_number.toString() : '?';
    }

    getAssignedTasks(workGroupId: number): Task[] {
        return this.workGroupTasks[workGroupId] || [];
    }

    getAssignedStaff(workGroupId: number): Profile[] {
        return this.workGroupStaff[workGroupId] || [];
    }

    createWorkGroup() {
        this.dataService.createWorkGroup().subscribe({
            next: (workGroup) => {
                if (workGroup) {
                    console.log('Work group created:', workGroup);
                }
            },
            error: (error) => {
                console.error('Error creating work group:', error);
            }
        });
    }

    deleteWorkGroup(workGroupId: number) {
        this.dataService.deleteWorkGroup(workGroupId).subscribe({
            next: () => {
                console.log('Work group deleted:', workGroupId);
            },
            error: (error) => {
                console.error('Error deleting work group:', error);
            }
        });
    }

    publishWorkGroups() {
        const workGroupIds = this.workGroups.map(group => group.work_group_id);
        this.dataService.publishWorkGroups(workGroupIds).subscribe({
            next: () => {
                console.log('Work groups published successfully');
            },
            error: (error) => {
                console.error('Error publishing work groups:', error);
            }
        });
    }

    removeStaffFromGroup(profileId: string, workGroupId: number) {
        this.dataService.removeStaffFromWorkGroup(profileId, workGroupId).subscribe({
            next: () => {
                console.log('Staff removed from work group:', { profileId, workGroupId });
            },
            error: (error) => {
                console.error('Error removing staff from work group:', error);
            }
        });
    }

    removeTaskFromGroup(taskId: number, workGroupId: number) {
        this.dataService.removeTaskFromWorkGroup(workGroupId, taskId).subscribe({
            next: () => {
                console.log('Task removed from work group:', { taskId, workGroupId });
            },
            error: (error) => {
                console.error('Error removing task from work group:', error);
            }
        });
    }

    getStaffFullName(staff: Profile): string {
        if (!staff.first_name && !staff.last_name) return 'Nepoznat';
        return [staff.first_name, staff.last_name].filter(Boolean).join(' ');
    }

    isRepairWorkGroup(workGroup: WorkGroup){
        const workGroupStaff = this.workGroupStaff[workGroup.work_group_id];
        if(this.allProfiles.some(profile => workGroupStaff.some(wgs => wgs.id == profile.id && profile.role == 'odrzavanje'))) {
            return true;
        } else {
            return false;
        }
    }

    async getStoredImagesForTask(task: Task) {
        try {
          const fetchedImages = await this.dataService.getStoredImagesForTask(task.task_id);
  
          if (!fetchedImages || fetchedImages.length === 0) {
            console.warn('No images found.');
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
} 