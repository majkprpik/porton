import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { WorkGroup, Profile, Task, House, HouseAvailability, WorkGroupProfile, WorkGroupTask, TaskProgressTypeName } from '../../core/models/data.models';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, Subject, Subscription, takeUntil } from 'rxjs';
import { HouseService } from '../../core/services/house.service';
import { TaskService } from '../../core/services/task.service';
import { TasksIndexSortPipe } from '../../shared/pipes/tasks-index-sort.pipe';
import { TranslateModule } from '@ngx-translate/core';
import { ProfileService } from '../../core/services/profile.service';
import { StaffCardComponent } from '../daily-sheet/staff-card';
import { AuthService } from '../../core/services/auth.service';
import { WorkGroupService } from '../../core/services/work-group.service';
import { DataService } from '../../core/services/data.service';
import { nonNull } from '../../shared/rxjs-operators/non-null';
import { AddDaysPipe } from '../../shared/pipes/add-days.pipe';

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
        AddDaysPipe,
    ],
    template: `
        @if (loading) {
            <div class="loading-container">
                <p-progressSpinner strokeWidth="4" [style]="{ width: '50px', height: '50px' }" />
                <span>{{ 'TEAMS.TEAM-TASK-CARD.LOADING-TEAM' | translate }}</span>
            </div>
        } @else if (workGroup) {
            <div class="legend-container">
                <div class="legend-wrapper">
                    <div class="legend-items">
                        <div class="legend-item"><i class="fa fa-house"></i> {{ 'TASK-TYPES.Čišćenje kućice' | translate }}</div>
                        <div class="legend-item"><i class="fa fa-umbrella-beach"></i> {{ 'TASK-TYPES.Čišćenje terase' | translate }}</div>
                        <div class="legend-item"><i class="fa fa-bed"></i> {{ 'TASK-TYPES.Mijenjanje posteljine' | translate }} </div>
                        <div class="legend-item"><i class="fa fa-bookmark"></i> {{ 'TASK-TYPES.Mijenjanje ručnika' | translate }}</div>
                        <div class="legend-item"><i class="fa fa-wrench"></i> {{ 'TASK-TYPES.Popravak' | translate }}</div>
                        <div class="legend-item"><i class="fa fa-file"></i> {{ 'TASK-TYPES.Ostalo' | translate }}</div>
                    </div>
                </div>
            </div>

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
                            @if (assignedProfiles.length == 0) {
                                <p class="empty-section">{{ 'TEAMS.TEAM-TASK-CARD.NO-ASSIGNED-STAFF' | translate }}</p>
                            } @else {
                                @for (profile of assignedProfiles; track profile.id) {
                                    <app-staff-card
                                        [profile]="profile"
                                        [canBeAssigned]="false"
                                        [isInActiveGroup]="true"
                                        [isClickedFromTeamDetails]="true"
                                    ></app-staff-card>
                                }
                            }
                        </div>
                    </div>

                    <div class="section">
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
                                                <div class="house-number-and-icon">
                                                    <span class="house-number">{{houseService.getHouseName(task.house_id)}}</span>
                                                    @if(task?.is_unscheduled){
                                                        @if(isUrgentIconVisibleMap[task.task_id]){
                                                            <div class="urgent-task-icon">
                                                                <i class="fa fa-exclamation-triangle"></i>
                                                            </div>
                                                        } @else {
                                                            <div class="task-icon">
                                                                <i [class]="taskService.getTaskIcon(task.task_type_id)"></i>
                                                            </div>
                                                        }
                                                    } @else {
                                                        <div class="task-icon">
                                                            <i [class]="taskService.getTaskIcon(task.task_type_id)"></i>
                                                        </div>
                                                    }
                                                </div>
                                                <div class="description">
                                                    {{task.description}}
                                                </div>
                                                
                                                <div class="next-reservation-date">
                                                    @if(
                                                        !houseService.isHouseOccupied(task.house_id) &&
                                                        !houseService.isHouseReservedToday(task.house_id) &&
                                                        houseService.getNextHouseAvailabilityForHouse(task.house_id)
                                                    ){ 
                                                        <span>
                                                            <b>Check IN</b>: {{ houseService.getNextHouseAvailabilityForHouse(task.house_id).house_availability_start_date | date: 'dd/MM/yyyy' }}
                                                        </span>
                                                        <span>
                                                            <b>Check OUT</b>: {{ houseService.getNextHouseAvailabilityForHouse(task.house_id).house_availability_end_date | addDays:1 | date: 'dd/MM/yyyy' }}
                                                        </span>
                                                    } @else if(houseService.getTodaysHouseAvailabilityForHouse(task.house_id).length == 1){
                                                        @if(houseService.hasArrivalForToday(task.house_id)){
                                                            <span>
                                                                <b>Check IN</b>: {{ houseService.getTodaysHouseAvailabilityForHouse(task.house_id)[0].arrival_time.split(':').slice(0,2).join(':') }}
                                                            </span>
                                                            <span>
                                                                <b>Check OUT</b>: {{ houseService.getTodaysHouseAvailabilityForHouse(task.house_id)[0].house_availability_end_date | addDays:1 | date: 'dd/MM/yyyy' }}
                                                            </span>
                                                        } @else if(houseService.hasDepartureForToday(task.house_id)){
                                                            <span>
                                                                <b>Check OUT</b>: {{ houseService.getTodaysHouseAvailabilityForHouse(task.house_id)[0].departure_time.split(':').slice(0,2).join(':') }}
                                                            </span>
                                                            @if(houseService.getNextHouseAvailabilityForHouse(task.house_id)){
                                                                <span>
                                                                    <b>Check IN</b>: {{ houseService.getNextHouseAvailabilityForHouse(task.house_id).house_availability_start_date | date: 'dd/MM/yyyy' }}
                                                                </span>
                                                            }
                                                        } @else {
                                                            <span>
                                                                <b>Check OUT</b>: {{ houseService.getTodaysHouseAvailabilityForHouse(task.house_id)[0].house_availability_end_date | addDays:1 | date: 'dd/MM/yyyy' }}
                                                            </span>
                                                            @if(houseService.getNextHouseAvailabilityForHouse(task.house_id)){
                                                                <span>
                                                                    <b>Check IN</b>: {{ houseService.getNextHouseAvailabilityForHouse(task.house_id).house_availability_start_date | date: 'dd/MM/yyyy' }}
                                                                </span>
                                                            }
                                                        }
                                                    } @else if(houseService.getTodaysHouseAvailabilityForHouse(task.house_id).length == 2){
                                                        @if(!houseService.getTodaysHouseAvailabilityForHouse(task.house_id)[0].has_departed){
                                                            <span>
                                                                <b>Check OUT</b>: {{ houseService.getTodaysHouseAvailabilityForHouse(task.house_id)[0].departure_time.split(':').slice(0,2).join(':') }}
                                                            </span>
                                                            <span>
                                                                <b>Check IN</b>: {{ houseService.getTodaysHouseAvailabilityForHouse(task.house_id)[1].arrival_time.split(':').slice(0,2).join(':') }}
                                                            </span>
                                                        } @else {
                                                            <span>
                                                                <b>Check IN</b>: {{ houseService.getTodaysHouseAvailabilityForHouse(task.house_id)[1].arrival_time.split(':').slice(0,2).join(':') }}
                                                            </span>
                                                            <span>
                                                                <b>Check OUT</b>: {{ houseService.getTodaysHouseAvailabilityForHouse(task.house_id)[1].house_availability_end_date | addDays:1 | date: 'dd/MM/yyyy' }}
                                                            </span>
                                                        }
                                                    }
                                                </div>
                                                
                                            </div>
                                            <div class="task-status">
                                                <i class="status-icon" [class]="taskService.getTaskStatusIcon(task)"></i>
                                                <span>{{ 'TASK-PROGRESS-TYPES.' + taskService.getTaskProgressTypeById(task.task_progress_type_id)?.task_progress_type_name | translate }}</span>
                                            </div>
                                        </div>
                                        <div class="task-actions">
                                            <div class="reservation-numbers">
                                                @if(houseService.getCurrentNumberOfAdults(task.house_id)){
                                                    <div class="adults-count">
                                                        <span>{{ houseService.getCurrentNumberOfAdults(task.house_id) }}</span>
                                                        <i class="fa-solid fa-person"></i>
                                                    </div>
                                                }
                                                @if(houseService.getCurrentNumberOfPets(task.house_id)){
                                                    <div class="pets-count">
                                                        <span>{{ houseService.getCurrentNumberOfPets(task.house_id) }}</span>
                                                        <i class="fa-solid fa-paw"></i>
                                                    </div>
                                                }
                                                @if(houseService.getCurrentNumberOfBabies(task.house_id)){
                                                    <div class="babies-count">
                                                        <span>{{ houseService.getCurrentNumberOfBabies(task.house_id) }}</span>
                                                        <i class="fa-solid fa-baby"></i>
                                                    </div>
                                                }
                                                @if(houseService.getCurrentNumberOfCribs(task.house_id)){
                                                    <div class="cribs-count">
                                                        <span>{{ houseService.getCurrentNumberOfCribs(task.house_id) }}</span>
                                                        <i class="fa-solid fa-baby-carriage"></i>
                                                    </div>
                                                }
                                            </div>
                                            @if (!taskService.isTaskCompleted(task)) {
                                                @if(
                                                    task.is_unscheduled || 
                                                    taskService.isRepairTask(task) || 
                                                    taskService.isSheetChangeTask(task) || 
                                                    taskService.isTowelChangeTask(task))
                                                {
                                                    <div class="buttons">
                                                        <p-button 
                                                            [label]="'BUTTONS.' + getActionButtonLabel(task) | translate"
                                                            [severity]="getActionButtonSeverity(task)"
                                                            (onClick)="handleTaskAction($event, task)"
                                                        ></p-button>
                                                        
                                                        @if (taskService.isHouseCleaningTask(task) && taskService.isTaskInProgress(task)) {
                                                            <p-button 
                                                                [label]="'BUTTONS.PAUSE' | translate"
                                                                severity="warn" 
                                                                (onClick)="handleTaskPause($event, task)"
                                                                [style]="{'margin-left': '0.5rem'}"
                                                            ></p-button>
                                                        }
                                                    </div>
                                                } @else if(houseService.isHouseOccupied(task.house_id)){
                                                    <span>{{ 'TEAMS.TEAM-DETAILS.HOUSE-OCCUPIED' | translate }}</span>
                                                } @else {
                                                    <div class="buttons">
                                                        <p-button 
                                                            [label]="'BUTTONS.' + getActionButtonLabel(task) | translate"
                                                            [severity]="getActionButtonSeverity(task)"
                                                            (onClick)="handleTaskAction($event, task)"
                                                        ></p-button>
                                                        
                                                        @if (taskService.isHouseCleaningTask(task) && taskService.isTaskInProgress(task)) {
                                                            <p-button 
                                                                [label]="'BUTTONS.PAUSE' | translate"
                                                                severity="warn" 
                                                                (onClick)="handleTaskPause($event, task)"
                                                                [style]="{'margin-left': '0.5rem'}"
                                                            ></p-button>
                                                        }
                                                    </div>
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
                <p>{{ 'TEAMS.TEAM-TASK-CARD.TEAM-NOT-FOUND' | translate }}</p>
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

        .legend-container {
            margin-bottom: 1.2rem;
            padding: 0.8rem 1rem;
            background-color: var(--surface-card);
            border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);

            .legend-wrapper {
                display: flex;
                flex-direction: column;
                gap: 1rem;

                .legend-items {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 1rem;

                    .legend-item {
                        display: flex;
                        align-items: center;
                        gap: 0.5em;
                        font-size: 0.9em;
                        white-space: nowrap;
                        
                        .legend-color {
                            display: inline-block;
                            width: 16px;
                            height: 16px;
                            border-radius: 4px;
                            margin-right: 0.3em;
                            border: 1px solid #bbb;
                        }
                    }
                }

                @media screen and (max-width: 800px){
                    .legend-items{
                        flex-direction: column;
                    }
                }
            }
        }

        .work-group-container {
            height: 100%;
            padding: 1.5rem;
            background-color: var(--surface-card);
            border-radius: 8px;
            padding-bottom: 80px;
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
            width: 100%;

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
            flex-direction: row;
            flex-wrap: wrap;
            gap: 0.5rem;
            width: 100%
        }

        @media screen and (max-width: 800px){
            .task-card{
                width: 100% !important;
            }
        }

        .task-card {
            background: var(--surface-ground);
            border: 1px solid var(--surface-border);
            border-radius: 6px;
            padding: 1rem;
            transition: transform 0.15s ease;
            height: 155px;
            width: 400px;

            &.completed{
                background: var(--p-red-400);
                color: var(--p-surface-0);
            }

            &.in-progress {
                background: var(--p-yellow-400);
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
                align-items: flex-start;
                margin-bottom: 1rem;
            }

            .house-info {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
                width: 30%;
                flex-grow: 1;

                .house-number-and-icon{
                    display: flex;
                    flex-direction: row;
                    gap: 5px;

                    .house-number {
                        font-size: 1.2rem;
                        font-weight: 600;
                    }
    
                    .task-icon {
                        font-size: 1.1rem;
                    }
                }

                .next-reservation-date{
                    display: flex;
                    flex-direction: column;
                    height: 20px;
                }

                .description{
                    width: 95%;
                    height: 20px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
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
                align-items: center;
                justify-content: space-between;
                height: 33px;

                .reservation-numbers{
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 5px;

                    .adults-count, .pets-count, .babies-count, .cribs-count{
                        display: flex;
                        flex-direction: row;
                        gap: 5px;
                    }
                }
            }

            &:hover{
                cursor: pointer;
                transform: translateY(-4px);
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
    workGroup?: WorkGroup;
    assignedTasks: Task[] = [];
    assignedProfiles: Profile[] = [];
    houses: House[] = [];
    profiles: Profile[] = [];
    workGroupTasks: WorkGroupTask[] = [];
    tasks: Task[] = [];
    houseAvailabilities: HouseAvailability[] = [];
    workGroupProfiles: WorkGroupProfile[] = [];
    isUrgentIconVisibleMap: { [taskId: number]: boolean } = {};
    urgentIconSubscriptions: Subscription[] = [];
    storedUserId: string | null = '';
    workGroups: WorkGroup[] = [];

    private destroy$ = new Subject<void>();

    constructor(
        private route: ActivatedRoute,
        private dataService: DataService,
        public houseService: HouseService,
        public taskService: TaskService,
        private profileService: ProfileService,
        private authService: AuthService,
        private router: Router,
        public workGroupService: WorkGroupService,
    ) {}

    ngOnInit() {
        combineLatest([
            this.dataService.workGroups$.pipe(nonNull()),
            this.dataService.workGroupTasks$.pipe(nonNull()),
            this.dataService.tasks$.pipe(nonNull()),
            this.dataService.workGroupProfiles$.pipe(nonNull()),
            this.dataService.profiles$.pipe(nonNull()),
            this.dataService.houses$.pipe(nonNull()),
            this.dataService.houseAvailabilities$.pipe(nonNull()),
        ])
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: ([workGroups, workGroupTasks, tasks, workGroupProfiles, profiles, houses, houseAvailabilities]) => {
                const workGroupId = Number(this.route.snapshot.paramMap.get('id'));
                this.storedUserId = this.authService.getStoredUserId();
                
                this.workGroup = workGroups.find(wg => wg.work_group_id == workGroupId) ?? undefined;
                this.houses = houses;
                this.workGroupTasks = workGroupTasks;
                this.houseAvailabilities = houseAvailabilities;
                this.tasks = tasks;
                this.profiles = profiles.filter(p => !p.is_deleted);
                this.workGroupProfiles = workGroupProfiles;
                this.workGroups = workGroups;

                this.assignedTasks = this.getAssignedTasks(workGroupId);
                this.assignedProfiles = this.getAssignedProfiles(workGroupId);

                if(this.profileService.isHousekeeper(this.storedUserId) || this.profileService.isCustomerService(this.storedUserId)) {
                    this.redirectToTeamsIfNoTodaysWorkGroup();
                } else if(this.profileService.isHouseTechnician(this.storedUserId)) {
                    this.redirectToTeamsIfNoWorkGroup();
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

    ngOnDestroy() {
        this.urgentIconSubscriptions.forEach(sub => sub.unsubscribe());

        this.destroy$.next();
        this.destroy$.complete();
    }

    getAssignedTasks(workGroupId: number){
        const filteredWorkGroupTasks = this.workGroupService.getWorkGroupTasksByWorkGroupId(workGroupId);
        return this.tasks
            .filter(task => filteredWorkGroupTasks.some(wgt => wgt.task_id == task.task_id))
            .map(task => {
                const wgt = filteredWorkGroupTasks.find(wgt => wgt.task_id == task.task_id);
                if(wgt) {
                    return {
                        ...task,
                        index: wgt.index,
                    }
                } else {
                    return task;
                }
            });
    }

    getAssignedProfiles(workGroupId: number){
        const filteredWorkGroupProfiles = this.workGroupService.getWorkGroupProfilesByWorkGroupId(workGroupId);
        return this.profiles.filter(profile => filteredWorkGroupProfiles.some(wgp => wgp.profile_id == profile.id));
    }

    private setupUrgentIcons(): void {
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

    handleTaskAction(event: any, task: Task) {
        event.stopPropagation();
        let newProgressTypeName: TaskProgressTypeName;
        
        if (this.taskService.isTaskInProgress(task)) {
            newProgressTypeName = TaskProgressTypeName.Completed;
        } else {
            newProgressTypeName = TaskProgressTypeName.InProgress;
        }
        
        const progressType = this.taskService.getTaskProgressTypeByName(newProgressTypeName);
        if (!progressType) {
            console.error(`Progress type not found: ${newProgressTypeName}`);
            return;
        }
        
        this.taskService.updateTaskProgressType(task, progressType.task_progress_type_id);
    }
    
    handleTaskPause(event: any, task: Task) {
        event.stopPropagation();
        
        const pausedProgressType = this.taskService.getTaskProgressTypeByName(TaskProgressTypeName.Paused);
        if (!pausedProgressType) {
            console.error("Pause progress type not found");
            return;
        }
        
        this.taskService.updateTaskProgressType(task, pausedProgressType.task_progress_type_id);
    }

    openTaskDetails(task: Task){
        this.taskService.$taskModalData.next(task);
    }

    redirectToTeamsIfNoTodaysWorkGroup(){
        const housekeepingWorkGroupProfile = this.workGroupProfiles.find(wgp => wgp.profile_id == this.authService.getStoredUserId());
        const todaysWorkGroup = this.workGroups.find(wg => 
            wg.work_group_id == housekeepingWorkGroupProfile?.work_group_id &&
            wg.created_at.startsWith(new Date().toISOString().split('T')[0])
        );

        if(!todaysWorkGroup && this.router.url.includes('/teams') && this.router.url != '/teams') {
            this.router.navigate(['/teams']);
        }
    }

    redirectToTeamsIfNoWorkGroup(){
        const isInWorkGroup = this.profileService.isProfileAssignedToWorkGroup(this.storedUserId);

        if(!isInWorkGroup && this.router.url.includes('/teams') && this.router.url != '/teams') {
            this.router.navigate(['/teams']);
        }
    }
} 
