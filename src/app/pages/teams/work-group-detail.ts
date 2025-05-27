import { Component, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { DataService, WorkGroup, Profile, Task, House, TaskType, TaskProgressType, HouseAvailability, WorkGroupProfile } from '../service/data.service';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, Subscription } from 'rxjs';
import { HouseService } from '../service/house.service';
import { TaskService } from '../service/task.service';
import { TasksIndexSortPipe } from '../../pipes/tasks-index-sort.pipe';

@Component({
    selector: 'app-work-group-detail',
    standalone: true,
    imports: [
        CommonModule, 
        ButtonModule, 
        ProgressSpinnerModule, 
        CardModule,
        TasksIndexSortPipe
    ],
    template: `
        @if (loading) {
            <div class="loading-container">
                <p-progressSpinner strokeWidth="4" [style]="{ width: '50px', height: '50px' }" />
                <span>Učitavanje tima...</span>
            </div>
        } @else if (workGroup) {
            <div class="work-group-container">
                <div class="work-group-header">
                    <h2>Tim {{workGroup.work_group_id}}</h2>
                    <span class="status-badge" [class.locked]="workGroup.is_locked">
                        {{workGroup.is_locked ? 'Zaključano' : 'Aktivno'}}
                    </span>
                </div>

                <div class="work-group-content">
                    <div class="section staff-section">
                        <h3>Članovi tima</h3>
                        <div class="staff-list">
                            @if (assignedStaff.length === 0) {
                                <p class="empty-section">Nema dodijeljenih članova</p>
                            } @else {
                                @for (staff of assignedStaff; track staff.id) {
                                    <div class="staff-card">
                                        <i class="fa fa-user"></i>
                                        <span>{{getStaffFullName(staff)}}</span>
                                    </div>
                                }
                            }
                        </div>
                    </div>

                    <div class="section tasks-section">
                        <h3>Zadaci</h3>
                        <div class="tasks-list">
                            @if (assignedTasks.length === 0) {
                                <p class="empty-section">Nema dodijeljenih zadataka</p>
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
                                                <span>{{getTaskStatusText(task)}}</span>
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
                                                        [label]="getActionButtonLabel(task)"
                                                        [severity]="getActionButtonSeverity(task)"
                                                        (onClick)="handleTaskAction($event, task)"
                                                    ></p-button>
                                                    
                                                    @if (isCleaningHouseTask(task) && taskService.isTaskInProgress(task)) {
                                                        <p-button 
                                                            label="Pauza"
                                                            severity="warn" 
                                                            (onClick)="handleTaskPause(task)"
                                                            [style]="{'margin-left': '0.5rem'}"
                                                        ></p-button>
                                                    }
                                                } @else if(houseService.isHouseOccupied(task.house_id)){
                                                    <span>Kućica zauzeta</span>
                                                } @else {
                                                    <p-button 
                                                        [label]="getActionButtonLabel(task)"
                                                        [severity]="getActionButtonSeverity(task)"
                                                        (onClick)="handleTaskAction($event, task)"
                                                    ></p-button>
                                                    
                                                    @if (isCleaningHouseTask(task) && taskService.isTaskInProgress(task)) {
                                                        <p-button 
                                                            label="Pauza"
                                                            severity="warn" 
                                                            (onClick)="handleTaskPause(task)"
                                                            [style]="{'margin-left': '0.5rem'}"
                                                        ></p-button>
                                                    }
                                                }
                                            } @else {
                                                <span>Zadatak završen</span>
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
                <p>Tim nije pronađen</p>
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

    constructor(
        private route: ActivatedRoute,
        private dataService: DataService,
        public houseService: HouseService,
        public taskService: TaskService
    ) {}

    ngOnInit() {
      const workGroupId = Number(this.route.snapshot.paramMap.get('id'));
      
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

            this.setupUrgentIcons();
            this.loading = false;
          },
          error: (error) => {
              console.error('Error loading work group details:', error);
              this.loading = false;
          }
      });

      this.dataService.$workGroupTasksUpdate.subscribe(async res => {
        if(res && res.eventType == 'INSERT'){
            if(this.workGroup?.work_group_id == res.new.work_group_id){
                const task = this.tasks.find((task: any) => task.task_id == res.new.task_id);

                if(!this.workGroupTasks.find((wgt: any) => wgt.task_id == res.new.task_id)){
                    this.workGroupTasks = [...this.workGroupTasks, res.new];
    
                    task.index = res.new.index;
                    
                    if(this.taskService.isTaskNotAssigned(task)){
                        let assignedTaskProgressType = this.progressTypes.find((tt: any) => tt.task_progress_type_name == "Dodijeljeno");
                        task.task_progress_type_id = assignedTaskProgressType?.task_progress_type_id;
                    }
        
                    if(!this.assignedTasks.some(at => at.task_id == task.task_id)){
                        this.assignedTasks = [...this.assignedTasks, task];
                    }
    
                    this.dataService.setWorkGroupTasks(this.workGroupTasks);
                }
            }
        } else if(res && res.eventType == 'DELETE'){
            if(this.workGroup?.work_group_id == res.old.work_group_id){
                this.assignedTasks = this.assignedTasks.filter(task => task.task_id != res.old.task_id);
                this.workGroupTasks = this.workGroupTasks.filter((task: any) => task.task_id != res.old.task_id);
                this.dataService.setWorkGroupTasks(this.workGroupTasks);
            }
        }
      });
    
      this.dataService.$workGroupProfilesUpdate.subscribe(res => {
        if(res && res.eventType == 'INSERT'){
            if(this.workGroup?.work_group_id == res.new.work_group_id){
                const profile = this.profiles.find((profile: any) => profile.id == res.new.profile_id);
                if(!this.assignedStaff.find(as => as.id == profile.id)){
                    this.assignedStaff = [...this.assignedStaff, profile];
                    this.workGroupProfiles = [...this.workGroupProfiles, res.new];
                    this.dataService.setWorkGroupProfiles(this.workGroupProfiles);
                }
            }
        } else if(res && res.eventType == 'DELETE'){
            if(this.workGroup?.work_group_id == res.old.work_group_id){
                this.assignedStaff = this.assignedStaff.filter(profile => profile.id != res.old.profile_id);
                this.workGroupProfiles = this.workGroupProfiles.filter(wgp => wgp.profile_id != res.old.profile_id);
                this.dataService.setWorkGroupProfiles(this.workGroupProfiles);
            }
        }
      });
    
      this.dataService.$tasksUpdate.subscribe(res => {
        if(res && res.eventType == 'INSERT'){
            if(!this.tasks.find((task: any) => task.task_id == res.new.task_id)){
                this.tasks = [...this.tasks, res.new];
                // this.dataService.setTasks(this.tasks);
            }   
        }
        else if(res && res.eventType == 'UPDATE'){
            let taskProgress = this.progressTypes.find(tp => tp.task_progress_type_id == res.new.task_progress_type_id);

            if(taskProgress && taskProgress.task_progress_type_name == 'Završeno'){
              for (let team of this.teams) {
                let task = team.tasks.find((task: any) => task.id == res.new.task_id);
                if (task) {
                  task.progressType = 'Završeno';
                }
              }
            }
        }
      });

      this.dataService.$houseAvailabilitiesUpdate.subscribe(res => {
        if(res && res.eventType == 'UPDATE') {
            let ha = this.houseService.getTodaysHouseAvailabilityForHouse(res.new.house_id);

            if(ha){
                const index = this.houseAvailabilities.findIndex(h => h.house_availability_id === res.new.house_availability_id);
              
                if (index > -1) {
                  this.houseAvailabilities[index] = res.new;
                } else {
                  this.houseAvailabilities.push(res.new);
                }
            }
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
        if (this.taskService.isTaskInProgress(task)) return 'U progresu';
        if (this.taskService.isTaskPaused(task)) return 'Pauzirano';
        return 'Nije dodijeljeno';
    }

    getActionButtonLabel(task: Task): string {
        const isPaused = this.taskService.isTaskPaused(task);
        
        if (this.taskService.isTaskInProgress(task)) {
            return 'Završi';
        } else if (isPaused) {
            return 'Nastavi';
        } 
        
        return 'Započni';
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
            newProgressTypeName = "U progresu";
        } else {
            newProgressTypeName = "U progresu";
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
    
    handleTaskPause(task: Task) {
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
} 
