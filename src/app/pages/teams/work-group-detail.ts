import { Component, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { DataService, WorkGroup, Profile, Task, House, TaskType, TaskProgressType, HouseAvailability, WorkGroupProfile } from '../service/data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, Subscription } from 'rxjs';
import { HouseService } from '../service/house.service';
import { TaskService } from '../service/task.service';
import { TasksIndexSortPipe } from '../../pipes/tasks-index-sort.pipe';
import { TranslateModule } from '@ngx-translate/core';
import { ProfileService } from '../service/profile.service';
import { StaffCardComponent } from '../daily-sheet/staff-card';
import { AuthService } from '../service/auth.service';

@Component({
    selector: 'app-work-group-detail',
    standalone: true,
    imports: [
        CommonModule, 
        ButtonModule, 
        ProgressSpinnerModule, 
        CardModule,
        TasksIndexSortPipe,
        TranslateModule,
        StaffCardComponent,
    ],
    template: `
        @if (loading) {
            <div class="loading-container">
                <p-progressSpinner strokeWidth="4" [style]="{ width: '50px', height: '50px' }" />
                <span>{{ 'TEAMS.TEAM-TASK-CARD.LOADING-TEAM' | translate }}</span>
            </div>
        } @else if (workGroup) {
            <div class="work-group-container">
                <div class="work-group-header">
                    <h2>{{ 'TEAMS.TEAM-TASK-CARD.TEAM' | translate }} {{workGroup.work_group_id}}</h2>
                    <span class="status-badge" [class.locked]="workGroup.is_locked">
                        {{ workGroup.is_locked ? ('TEAMS.TEAM-TASK-CARD.PUBLISHED' | translate) : ('TEAMS.TEAM-TASK-CARD.NOT-PUBLISHED' | translate) }}
                    </span>
                </div>

                <div class="work-group-content">
                    <div class="section staff-section">
                        <h3>{{ 'TEAMS.TEAM-TASK-CARD.TEAM-MEMBERS' | translate }}</h3>
                        <div class="staff-list">
                            @if (assignedStaff.length === 0) {
                                <p class="empty-section">{{ 'TEAMS.TEAM-TASK-CARD.NO-ASSIGNED-STAFF' | translate }}</p>
                            } @else {
                                @for (staff of assignedStaff; track staff.id) {
                                    <app-staff-card
                                        [staff]="staff"
                                        [canBeAssigned]="false"
                                        [isInActiveGroup]="true"
                                        [isClickedFromTeamDetails]="true"
                                    ></app-staff-card>
                                }
                            }
                        </div>
                    </div>

                    <div class="section tasks-section">
                        <h3>{{ 'TEAMS.TEAM-TASK-CARD.TASKS' | translate }}</h3>
                        <div class="tasks-list">
                            @if (assignedTasks.length === 0) {
                                <p class="empty-section">{{ 'TEAMS.TEAM-TASK-CARD.NO-ASSIGNED-TASKS' | translate }}</p>
                            } @else {
                                @for (task of assignedTasks | tasksIndexSort; track task.task_id) {
                                    <div class="task-card" 
                                        [class.completed]="taskService.isTaskCompleted(task)"  
                                        [class.assigned]="taskService.isTaskAssigned(task)"
                                        [class.not-assigned]="taskService.isTaskNotAssigned(task)"
                                        [class.in-progress]="taskService.isTaskInProgress(task) || taskService.isTaskPaused(task)"
                                        [class.completed]="taskService.isTaskCompleted(task)"
                                        (click)="openTaskDetails(task)"
                                    >
                                        <div class="task-info">
                                            <div class="house-info">
                                                <span class="house-number">{{houseService.getHouseName(task.house_id)}}</span>
                                                @if(task?.is_unscheduled){
                                                    @if(isUrgentIconVisibleMap[task.task_id]){
                                                        <div class="urgent-task-icon">
                                                            <i class="fa fa-exclamation-triangle"></i>
                                                        </div>
                                                    } @else{
                                                        <div class="task-icon">
                                                            <i [class]="getTaskTypeIcon(task.task_type_id)"></i>
                                                        </div>
                                                    }
                                                } @else{
                                                    <div class="task-icon">
                                                        <i [class]="getTaskTypeIcon(task.task_type_id)"></i>
                                                    </div>
                                                }
                                            </div>
                                            <div class="task-status">
                                                <i class="status-icon" [class]="getTaskStatusIcon(task)"></i>
                                                <span>{{ 'TASK-PROGRESS-TYPES.' + getTaskStatusText(task) | translate }}</span>
                                            </div>
                                        </div>
                                        <div class="task-actions">
                                            @if (!taskService.isTaskCompleted(task)) {
                                                @if(
                                                    task.is_unscheduled || 
                                                    taskService.isRepairTask(task) || 
                                                    taskService.isSheetChangeTask(task) || 
                                                    taskService.isTowelChangeTask(task))
                                                {
                                                    <p-button 
                                                        [label]="'BUTTONS.' + getActionButtonLabel(task) | translate"
                                                        [severity]="getActionButtonSeverity(task)"
                                                        (onClick)="handleTaskAction($event, task)"
                                                    ></p-button>
                                                    
                                                    @if (isCleaningHouseTask(task) && taskService.isTaskInProgress(task)) {
                                                        <p-button 
                                                            [label]="'BUTTONS.PAUSE' | translate"
                                                            severity="warn" 
                                                            (onClick)="handleTaskPause($event, task)"
                                                            [style]="{'margin-left': '0.5rem'}"
                                                        ></p-button>
                                                    }
                                                } @else if(houseService.isHouseOccupied(task.house_id)){
                                                    <span>{{ 'TEAMS.TEAM-DETAILS.HOUSE-OCCUPIED' | translate }}</span>
                                                } @else {
                                                    <p-button 
                                                        [label]="'BUTTONS.' + getActionButtonLabel(task) | translate"
                                                        [severity]="getActionButtonSeverity(task)"
                                                        (onClick)="handleTaskAction($event, task)"
                                                    ></p-button>
                                                    
                                                    @if (isCleaningHouseTask(task) && taskService.isTaskInProgress(task)) {
                                                        <p-button 
                                                            [label]="'BUTTONS.PAUSE' | translate"
                                                            severity="warn" 
                                                            (onClick)="handleTaskPause($event, task)"
                                                            [style]="{'margin-left': '0.5rem'}"
                                                        ></p-button>
                                                    }
                                                }
                                            } @else {    
                                                <span>{{ 'TEAMS.TEAM-DETAILS.TASK-FINISHED' | translate }}</span>
                                            }
                                        </div>
                                    </div>
                                }
                            }
                        </div>
                    </div>
                </div>
            </div>
        } @else {
            <div class="error-container">
                <p>{{ 'TEAM.TEAM-TASK-CARD.TEAM-NOT-FOUND' | translate }}</p>
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

        .work-group-container {
            height: 100%;
            padding: 1.5rem;
            background-color: var(--surface-card);
            border-radius: 8px;
        }

        .work-group-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 2rem;

            h2 {
                margin: 0;
                color: var(--text-color);
                font-size: 1.5rem;
                font-weight: 600;
            }

            .status-badge {
                padding: 0.25rem 0.75rem;
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

        .section {
            margin-bottom: 2rem;

            h3 {
                color: var(--text-color);
                font-size: 1.2rem;
                margin: 0 0 1rem 0;
            }
        }

        .staff-list {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
        }

        .staff-card {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: var(--surface-ground);
            border: 1px solid var(--surface-border);
            border-radius: 6px;
            color: var(--text-color);

            i {
                color: var(--text-color-secondary);
            }
        }

        .tasks-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .task-card {
            background: var(--surface-ground);
            border: 1px solid var(--surface-border);
            border-radius: 6px;
            padding: 1rem;
            transition: transform 0.3s ease;

            &.completed{
                background: var(--p-red-400);
                color: var(--p-surface-0);
            }

            &.in-progress {
                background: var(--p-yellow-500);
                color: var(--p-surface-0);
            }

            &.assigned {
                background: var(--p-blue-500);
                color: var(--p-surface-0);
            }

            &.not-assigned {
                background: var(--p-green-500);
                color: var(--p-surface-0);
            }

            .task-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }

            .house-info {
                display: flex;
                align-items: center;
                gap: 0.75rem;

                .house-number {
                    font-size: 1.2rem;
                    font-weight: 600;
                }

                .task-icon {
                    font-size: 1.1rem;
                }
            }

            .task-status {
                display: flex;
                align-items: center;
                gap: 0.5rem;

                .status-icon {
                    font-size: 1rem;
                }
            }

            .task-actions {
                display: flex;
                justify-content: flex-end;
            }

            &:hover{
                cursor: pointer;
                transform: scale(1.01);
            }
        }

        .empty-section {
            color: var(--text-color-secondary);
            font-style: italic;
            margin: 0;
            padding: 1rem;
            text-align: center;
            background: var(--surface-ground);
            border-radius: 6px;
        }

        .error-container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
            color: var(--text-color-secondary);
        }

        .task-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 15px;
                
            i {
              font-size: 1rem;
            }
        
            .remove-icon {
                display: none;
                position: absolute;
                right: 0.5rem;
                color: var(--red-500);
                font-size: 1rem;
            }
        }

        .urgent-task-icon{
            display: flex;
            align-items: center;
            justify-content: center;
            width: 15px;

            i {
              color: red;
              font-size: 1rem;
            }
        }
    `
})
export class WorkGroupDetail implements OnInit {
    loading = true;
    workGroup: WorkGroup | null = null;
    assignedTasks: Task[] = [];
    team: any;
    teams: any[] = [];
    taskTypes: TaskType[] = [];
    progressTypes: TaskProgressType[] = [];
    assignedStaff: Profile[] = [];
    houses: House[] = [];
    profiles: any;
    workGroupTasks: any;
    tasks: any;
    houseAvailabilities: HouseAvailability[] = [];
    workGroupProfiles: WorkGroupProfile[] = [];
    taskIcon: any;
    isUrgentIconVisible: any;
    isUrgentIconVisibleMap: { [taskId: number]: boolean } = {};
    urgentIconSubscriptions: Subscription[] = [];
    storedUserId: string | null = '';

    constructor(
        private route: ActivatedRoute,
        private dataService: DataService,
        public houseService: HouseService,
        public taskService: TaskService,
        private profileService: ProfileService,
        private authService: AuthService,
        private router: Router,
    ) {}

    ngOnInit() {
        const workGroupId = Number(this.route.snapshot.paramMap.get('id'));
        this.storedUserId = this.authService.getStoredUserId();
    
        if (!workGroupId) {
            this.loading = false;
            return;
        }

        combineLatest([
            this.dataService.workGroups$,
            this.dataService.workGroupTasks$,
            this.dataService.tasks$,
            this.dataService.workGroupProfiles$,
            this.dataService.profiles$,
            this.dataService.houses$,
            this.dataService.taskTypes$,
            this.dataService.taskProgressTypes$,
            this.dataService.houseAvailabilities$
        ]).subscribe({
            next: ([workGroups, workGroupTasks, tasks, workGroupProfiles, profiles, houses, taskTypes, taskProgressTypes, houseAvailabilities]) => {
                this.workGroup = workGroups.find(wg => wg.work_group_id === workGroupId) || null;
                this.houses = houses;
                this.workGroupTasks = workGroupTasks;
                this.taskTypes = taskTypes;
                this.progressTypes = taskProgressTypes;
                this.houseAvailabilities = houseAvailabilities;
                this.tasks = tasks;
                this.profiles = profiles;
                this.workGroupProfiles = workGroupProfiles;

                // Get tasks for this work group
                const groupTaskIds = workGroupTasks
                    .filter(wgt => wgt.work_group_id === workGroupId)
                    .map(wgt => wgt.task_id);

                this.assignedTasks = tasks
                    .filter(task => groupTaskIds.includes(task.task_id))
                    .map(task => {
                        const workGroupTask = workGroupTasks.find(wgt => wgt.task_id === task.task_id);
                        return {
                          ...task,
                          index: workGroupTask?.index ?? null
                        };
                    });

                // Get staff for this work group
                const groupProfileIds = workGroupProfiles
                    .filter(wgp => wgp.work_group_id === workGroupId)
                    .map(wgp => wgp.profile_id);

                this.assignedStaff = profiles.filter(profile => groupProfileIds.includes(profile.id));
                    
                if(houseAvailabilities && houseAvailabilities.length > 0 && this.assignedTasks && this.assignedTasks.length > 0){
                    this.assignedTasks.forEach(task => {
                        this.houseService.isHouseOccupied(task.house_id);
                    });
                }

                if(this.profileService.isHousekeeper(this.storedUserId) || this.profileService.isHouseTechnician(this.storedUserId)){
                    const housekeepingWorkGroupProfiles = this.workGroupProfiles.filter(wgp => wgp.profile_id == this.authService.getStoredUserId());

                    if(!housekeepingWorkGroupProfiles.some(wgp => wgp.work_group_id == this.workGroup?.work_group_id)){
                        this.router.navigate(['/teams']);
                    }
                }

                this.setupUrgentIcons();
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading work group details:', error);
                this.loading = false;
            }
        });
    }

    private setupUrgentIcons(): void {
      // Unsubscribe from previous
      this.urgentIconSubscriptions.forEach(sub => sub.unsubscribe());
      this.urgentIconSubscriptions = [];

      this.assignedTasks.forEach((task: any) => {
        if (task.is_unscheduled) {
          const sub = this.taskService.isUrgentIconVisible$.subscribe(visible => {
            this.isUrgentIconVisibleMap[task.task_id] = visible;
          });
          this.urgentIconSubscriptions.push(sub);
        }
      });
    }

    ngOnDestroy() {
      this.urgentIconSubscriptions.forEach(sub => sub.unsubscribe());
    }

    getStaffFullName(staff: Profile): string {
        if (!staff.first_name && !staff.last_name) return 'Nepoznat';
        return [staff.first_name, staff.last_name].filter(Boolean).join(' ');
    }

    getTaskTypeIcon(taskTypeId: number): string {
        switch(taskTypeId){
            case this.taskTypes.find(tt => tt.task_type_name == "Čišćenje kućice")?.task_type_id: 
              return 'fa fa-house';
            case this.taskTypes.find(tt => tt.task_type_name == "Čišćenje terase")?.task_type_id: 
              return 'fa fa-umbrella-beach';
            case this.taskTypes.find(tt => tt.task_type_name == "Mijenjanje posteljine")?.task_type_id: 
              return 'fa fa-bed';
            case this.taskTypes.find(tt => tt.task_type_name == "Mijenjanje ručnika")?.task_type_id: 
              return 'fa fa-bookmark';
            case this.taskTypes.find(tt => tt.task_type_name == "Popravak")?.task_type_id: 
              return 'fa fa-wrench';
            default: 
              return 'fa fa-file';
        }
    }

    getTaskStatusIcon(task: Task): string {
        if (this.taskService.isTaskCompleted(task)) {
            return 'fa fa-check-circle';
        } else if (this.taskService.isTaskInProgress(task)) {
            return 'fa fa-sync fa-spin';
        } else if (this.taskService.isTaskPaused(task)) {
            return 'fa fa-pause-circle';
        } else if (this.taskService.isTaskAssigned(task)) {
            return 'fa fa-user-check';
        } else {
            return 'fa fa-clock';
        }
    }

    getTaskStatusText(task: Task): string {
        // Find the progress type by ID from our progressTypes array
        const progressType = this.progressTypes.find((pt: any) => pt.task_progress_type_id === task.task_progress_type_id);
        if (progressType) {
            return progressType.task_progress_type_name;
        }
        
        // Fallback
        if (this.taskService.isTaskCompleted(task)) return 'Završeno';
        if (this.taskService.isTaskInProgress(task)) return 'U tijeku';
        if (this.taskService.isTaskPaused(task)) return 'Pauzirano';
        return 'Nije dodijeljeno';
    }

    getActionButtonLabel(task: Task): string {
        const isPaused = this.taskService.isTaskPaused(task);
        
        if (this.taskService.isTaskInProgress(task)) {
            return 'FINISH';
        } else if (isPaused) {
            return 'CONTINUE';
        } 
        
        return 'START';
    }

    getActionButtonSeverity(task: Task): 'success' | 'info' | 'warn' | 'danger' | 'help' | 'primary' | 'secondary' | 'contrast' {
        if (this.taskService.isTaskInProgress(task)) return 'success';
        if (this.taskService.isTaskPaused(task)) return 'warn';
        return 'primary';
    }

    isCleaningHouseTask(task: Task): boolean {
        const cleaningHouseType = this.taskTypes.find(tt => tt.task_type_name === "Čišćenje kućice");
        return task.task_type_id === cleaningHouseType?.task_type_id;
    }

    handleTaskAction(event: any, task: Task) {
        event.stopPropagation();
        let newProgressTypeName: string;
        
        if (this.taskService.isTaskInProgress(task)) {
            newProgressTypeName = "Završeno";
        } else if (this.taskService.isTaskPaused(task)) {
            newProgressTypeName = "U tijeku";
        } else {
            newProgressTypeName = "U tijeku";
        }
        
        // Get progress type ID from name
        const progressType = this.progressTypes.find((pt: any) => pt.task_progress_type_name === newProgressTypeName);
        if (!progressType) {
            console.error(`Progress type not found: ${newProgressTypeName}`);
            return;
        }
        
        this.dataService.updateTaskProgressType(task.task_id, progressType.task_progress_type_id).subscribe({
            next: () => {
                // Update the task in the UI to reflect the new status
                const updatedTask = this.assignedTasks.find(t => t.task_id === task.task_id);
                if (updatedTask) {
                    updatedTask.task_progress_type_id = progressType.task_progress_type_id;
                }
            },
            error: (error: unknown) => {
                console.error('Error updating task progress:', error);
            }
        });
    }
    
    handleTaskPause(event: any, task: Task) {
        event.stopPropagation();
        // Find Pauza progress type
        const pauseProgressType = this.progressTypes.find((pt: any) => pt.task_progress_type_name === "Pauzirano");
        if (!pauseProgressType) {
            console.error("Pause progress type not found");
            return;
        }
        
        this.dataService.updateTaskProgressType(task.task_id, pauseProgressType.task_progress_type_id).subscribe({
            next: () => {
                // Update the task in the UI to reflect the new status
                const updatedTask = this.assignedTasks.find(t => t.task_id === task.task_id);
                if (updatedTask) {
                    updatedTask.task_progress_type_id = pauseProgressType.task_progress_type_id;
                }
            },
            error: (error: unknown) => {
                console.error('Error pausing task:', error);
            }
        });
    }

    openTaskDetails(task: Task){
        this.taskService.$taskModalData.next(task);
    }

    openProfileDetails(profile: Profile){
        this.profileService.$profileModalData.next(profile);
    }
} 
