import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DataService, WorkGroup, Profile, Task, House, LockedTeam, TaskProgressType, TaskType, WorkGroupTask } from '../service/data.service';
import { ChipModule } from 'primeng/chip';
import { CardModule } from 'primeng/card';
import { combineLatest } from 'rxjs';
import { Router } from '@angular/router';
import { TeamService } from '../service/team.service';

@Component({
    selector: 'app-teams',
    standalone: true,
    imports: [CommonModule, ButtonModule, ProgressSpinnerModule, ChipModule, CardModule],
    template: `
        @if (loading) {
            <div class="loading-container">
                <p-progressSpinner strokeWidth="4" [style]="{ width: '50px', height: '50px' }" />
                <span>Učitavanje timova...</span>
            </div>
        } @else {
            <div class="teams-container">
                <div class="teams-list">
                    @if (workGroups.length === 0) {
                        <div class="empty-state">
                            <p>Nema kreiranih timova</p>
                        </div>
                    } @else {
                        <div class="teams-grid">
                            @for (group of workGroups; track group.work_group_id) {
                                <div class="team-card" [class.locked]="group.is_locked" (click)="navigateToDetail(group.work_group_id)">
                                    <div class="team-header">
                                        <h3>Tim {{group.work_group_id}}</h3>
                                        <span class="status-badge" [class.locked]="group.is_locked">
                                            {{group.is_locked ? 'Zaključano' : 'Aktivno'}}
                                        </span>
                                    </div>
                                    <div class="team-content">
                                        <p>Kreirano: {{group.created_at | date:'dd.MM.yyyy'}}</p>
                                        
                                        <div class="section">
                                            <h4>Članovi tima</h4>
                                            @if (getAssignedStaff(group.work_group_id).length === 0) {
                                                <p class="empty-section">Nema dodijeljenih članova</p>
                                            } @else {
                                                <div class="staff-list">
                                                    @for (staff of getAssignedStaff(group.work_group_id); track staff.id) {
                                                        <p-chip 
                                                            [label]="getStaffFullName(staff)"
                                                            [removable]="!group.is_locked"
                                                            (onRemove)="removeStaffFromGroup(staff.id!, group.work_group_id)"
                                                        ></p-chip>
                                                    }
                                                </div>
                                            }
                                        </div>

                                        <div class="section">
                                            <h4>Zadaci</h4>
                                            @if (getAssignedTasks(group.work_group_id).length === 0) {
                                                <p class="empty-section">Nema dodijeljenih zadataka</p>
                                            } @else {
                                                <div class="tasks-list">
                                                    @for (task of getAssignedTasks(group.work_group_id); track task.task_id) {
                                                        <div class="task-card" [class.removable]="!group.is_locked" (click)="!group.is_locked && removeTaskFromGroup(task.task_id, group.work_group_id)">
                                                            <span class="house-number">{{getHouseNumber(task.house_id)}}</span>
                                                            <i class="task-icon" [class]="getTaskTypeIcon(task.task_type_id)"></i>
                                                            @if (!group.is_locked) {
                                                                <i class="remove-icon pi pi-times"></i>
                                                            }
                                                        </div>
                                                    }
                                                </div>
                                            }
                                        </div>
                                    </div>
                                    <!-- <div class="team-actions">
                                        <p-button 
                                            icon="pi pi-trash" 
                                            severity="danger"
                                            (onClick)="deleteWorkGroup(group.work_group_id)"
                                        ></p-button>
                                    </div> -->
                                </div>
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
            height: 100%;
            padding: 1rem;
            background-color: var(--surface-card);
            border-radius: 8px;
            display: flex;
            flex-direction: column;
        }

        .teams-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;

            h2 {
                margin: 0;
                color: var(--text-color);
                font-size: 1.5rem;
                font-weight: 600;
            }

            .header-actions {
                display: flex;
                gap: 0.5rem;
            }
        }

        .teams-list {
            flex: 1;
            overflow-y: auto;
            padding-right: 0.5rem;
        }

        .teams-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1rem;
        }

        .team-card {
            background: var(--surface-card);
            border: 1px solid var(--surface-border);
            border-radius: 6px;
            padding: 1rem;
            transition: all 0.3s ease;
            cursor: pointer;

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }

            &.locked {
                background: var(--surface-ground);
                opacity: 0.8;
            }

            .team-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;

                h3 {
                    margin: 0;
                    color: var(--text-color);
                    font-size: 1.2rem;
                }

                .status-badge {
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.875rem;
                    background: var(--primary-color);
                    color: var(--primary-color-text);

                    &.locked {
                        background: var(--surface-border);
                        color: var(--text-color-secondary);
                    }
                }
            }

            .team-content {
                margin-bottom: 1rem;
                color: var(--text-color-secondary);

                .section {
                    margin-top: 1rem;

                    h4 {
                        margin: 0 0 0.5rem 0;
                        color: var(--text-color);
                        font-size: 1rem;
                    }

                    .empty-section {
                        color: var(--text-color-secondary);
                        font-style: italic;
                        margin: 0;
                    }

                    .staff-list, .tasks-list {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 0.5rem;
                    }
                }
            }

            .team-actions {
                display: flex;
                justify-content: flex-end;
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

        .task-card {
            background: var(--surface-ground);
            border: 1px solid var(--surface-border);
            border-radius: 4px;
            padding: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            position: relative;
            min-width: 80px;

            &.removable {
                cursor: pointer;
                
                &:hover {
                    background: var(--surface-hover);
                    
                    .remove-icon {
                        display: block;
                    }
                    
                    .task-icon {
                        display: none;
                    }
                }
            }

            .house-number {
                font-weight: 600;
                color: var(--text-color);
            }

            .task-icon {
                color: var(--text-color-secondary);
                font-size: 1rem;
            }

            .remove-icon {
                display: none;
                position: absolute;
                right: 0.5rem;
                color: var(--red-500);
                font-size: 0.875rem;
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

    constructor(
        private dataService: DataService,
        private router: Router,
        private teamsService: TeamService,
    ) {}

    ngOnInit() {
        // Use combineLatest to wait for all required data
        combineLatest([
            this.dataService.workGroups$,
            this.dataService.tasks$,
            this.dataService.workGroupProfiles$,
            this.dataService.profiles$,
            this.dataService.houses$,
            this.teamsService.lockedTeams$,
            this.dataService.taskProgressTypes$,
            this.dataService.taskTypes$,
        ]).subscribe({
            next: ([workGroups, tasks, workGroupProfiles, profiles, houses, teams, taskProgressTypes, taskTypes]) => {
                this.workGroups = workGroups;
                this.allTasks = tasks;
                this.allProfiles = profiles;
                this.houses = houses;
                this.teams = teams;
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

    getTaskTypeIcon(taskTypeId: number): string {
        switch(taskTypeId){
            case this.taskTypes.find(tt => tt.task_type_name == "Čišćenje kućice")?.task_type_id: 
              return 'pi pi-home';
            case this.taskTypes.find(tt => tt.task_type_name == "Čišćenje terase")?.task_type_id: 
              return 'pi pi-table';
            case this.taskTypes.find(tt => tt.task_type_name == "Mijenjanje posteljine")?.task_type_id: 
              return 'pi pi-inbox';
            case this.taskTypes.find(tt => tt.task_type_name == "Mijenjanje ručnika")?.task_type_id: 
              return 'pi pi-bookmark';
            case this.taskTypes.find(tt => tt.task_type_name == "Popravak")?.task_type_id: 
              return 'pi pi-wrench';
            default: 
              return 'pi pi-file';
          }
    }

    getStaffFullName(staff: Profile): string {
        if (!staff.first_name && !staff.last_name) return 'Nepoznat';
        return [staff.first_name, staff.last_name].filter(Boolean).join(' ');
    }

    navigateToDetail(workGroupId: number) {
        this.router.navigate(['/teams', workGroupId]);
    }
} 