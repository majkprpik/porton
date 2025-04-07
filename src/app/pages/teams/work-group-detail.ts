import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { DataService, WorkGroup, Profile, Task, House, TeamTask } from '../service/data.service';
import { ActivatedRoute } from '@angular/router';
import { combineLatest } from 'rxjs';
import { TeamService } from '../service/team.service';

@Component({
    selector: 'app-work-group-detail',
    standalone: true,
    imports: [CommonModule, ButtonModule, ProgressSpinnerModule, CardModule],
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
                                        <i class="pi pi-user"></i>
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
                                @for (task of assignedTasks; track task.task_id) {
                                    <div class="task-card" [class.completed]="isTaskCompleted(task)">
                                        <div class="task-info">
                                            <div class="house-info">
                                                <span class="house-number">{{getHouseNumber(task.house_id)}}</span>
                                                <i class="task-icon" [class]="getTaskTypeIcon(task.task_type_id)"></i>
                                            </div>
                                            <div class="task-status">
                                                <i class="status-icon" [class]="getTaskStatusIcon(task)"></i>
                                                <span>{{getTaskStatusText(task)}}</span>
                                            </div>
                                        </div>
                                        <div class="task-actions">
                                            @if (!isTaskCompleted(task)) {
                                                <p-button 
                                                    [label]="getActionButtonLabel(task)"
                                                    [severity]="getActionButtonSeverity(task)"
                                                    (onClick)="handleTaskAction(task)"
                                                ></p-button>
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
            gap: 1rem;
        }

        .task-card {
            background: var(--surface-ground);
            border: 1px solid var(--surface-border);
            border-radius: 6px;
            padding: 1rem;

            &.completed {
                background: var(--surface-hover);
                border-color: var(--green-500);

                .task-status {
                    color: var(--green-500);
                }
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
                    color: var(--text-color);
                }

                .task-icon {
                    color: var(--text-color-secondary);
                    font-size: 1.1rem;
                }
            }

            .task-status {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: var(--text-color-secondary);

                .status-icon {
                    font-size: 1rem;
                }
            }

            .task-actions {
                display: flex;
                justify-content: flex-end;
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
    `
})
export class WorkGroupDetail implements OnInit {
    loading = true;
    workGroup: WorkGroup | null = null;
    assignedTasks: Task[] = [];
    team: any;
    teams: any[] = [];
    taskTypes: any;
    progressTypes: any;
    assignedStaff: Profile[] = [];
    houses: House[] = [];
    profiles: any;
    workGroupTasks: any;

    constructor(
        private route: ActivatedRoute,
        private dataService: DataService,
        private teamService: TeamService
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
          this.teamService.lockedTeams$,
          this.dataService.taskTypes$,
          this.dataService.taskProgressTypes$,
      ]).subscribe({
          next: ([workGroups, workGroupTasks, tasks, workGroupProfiles, profiles, houses, teams, taskTypes, taskProgressTypes]) => {
            this.workGroup = workGroups.find(wg => wg.work_group_id === workGroupId) || null;
            this.houses = houses;
            this.workGroupTasks = workGroupTasks;
            this.teams = teams;
            this.taskTypes = taskTypes;
            this.progressTypes = taskProgressTypes;

            this.team = teams.find((t) => t.id == workGroupId.toString());
            // Initialize tasks array if it doesn't exist
            if (this.team && !this.team.tasks) {
                this.team.tasks = [];
            }
            // Ensure all tasks have a progressType
            if (this.team?.tasks) {
              this.team.tasks.forEach((task: any) => {
              if (!task.progressType) {
                  task.progressType = TaskProgressType.ASSIGNED;
              }
        
              let workGroupTask = this.workGroupTasks.find((workGroupTask: any) => workGroupTask.task_id == task.id);
        
              if(workGroupTask){
                  if(task.id == workGroupTask.task_id){
                  task.index = workGroupTask.index;
                  }
              }
              });
            }

            // Get tasks for this work group
            const groupTaskIds = workGroupTasks
                .filter(wgt => wgt.work_group_id === workGroupId)
                .map(wgt => wgt.task_id);
            this.assignedTasks = tasks.filter(task => groupTaskIds.includes(task.task_id));

            // Get staff for this work group
            const groupProfileIds = workGroupProfiles
                .filter(wgp => wgp.work_group_id === workGroupId)
                .map(wgp => wgp.profile_id);
            this.assignedStaff = profiles.filter(profile => groupProfileIds.includes(profile.id));

            this.loading = false;
          },
          error: (error) => {
              console.error('Error loading work group details:', error);
              this.loading = false;
          }
      });

      this.dataService.$workGroupTasksUpdate.subscribe(async res => {
        if(res && res.eventType == 'INSERT'){
          this.workGroupTasks.push(res.new);
          let task = await this.dataService.getTaskByTaskId(res.new.task_id);
    
          let team = this.teams.find((team: any) => team.id == res.new.work_group_id.toString());
          let houseNumber = this.houses.find((house: any) => house.house_id == task.house_id);
          let taskType = this.taskTypes.find((taskType: any) => taskType.task_type_id == task.task_type_id);
          let progressType = this.progressTypes.find((progressType: any) => progressType.task_progress_type_id == task.task_progress_type_id);
          let workGroupTask = this.workGroupTasks.find((workGroupTask: any) => workGroupTask.task_id == task.task_id);
    
          if(!team.tasks.find((task: any) => task.id == res.new.task_id) && houseNumber && taskType && progressType && workGroupTask){
            let newTask: TeamTask = {
              id: task.task_id,
              house_number: houseNumber.house_number,
              task_type_name: taskType.task_type_name,
              progress_type_name: progressType.task_progress_type_name,
              index: workGroupTask.index,
            }
    
            team.tasks = [...team.tasks, newTask];
          }
        } else if(res && res.eventType == 'DELETE'){
          let team = this.teams.find((team: any) => team.id == res.old.work_group_id.toString());
          if(team){
            team.tasks = team.tasks.filter((task: any) => task.task_id != res.old.task_id);
            this.workGroupTasks = this.workGroupTasks.filter((task: any) => task.task_id != res.old.task_id);
          }
        }
      });
    
      this.dataService.$workGroupProfiles.subscribe(res => {
        if(res && res.eventType == 'INSERT'){
          let team = this.teams.find((team: any) => team.id == res.new.work_group_id.toString());
          let profile = this.profiles.find((profile: any) => profile.id == res.new.profile_id);
    
          if(!team.members.find((member: any) => member.id == res.new.profile_id)){
            let newStaff: Profile = {
              id: res.new.profile_id,
              role: null,
              first_name: profile.first_name,
              last_name: profile.last_name,
              phone_number: null,
              created_at: null,
            }

            team.members.push(newStaff);
          }
        } else if(res && res.eventType == 'DELETE'){
          let team = this.teams.find((team: any) => team.id == res.old.work_group_id.toString());
          if(team){
            team.members = team.members.filter((member: any) => member.id != res.old.profile_id);
          }
        }
      });
    
      this.dataService.$tasksUpdate.subscribe(async res => {
        if(res){
          let taskProgress = await this.dataService.getTaskProgressTypeByTaskProgressId(res.new.task_progress_type_id);
          if(taskProgress.task_progress_type_name == 'Završeno'){
            for (let team of this.teams) {
              let task = team.tasks.find((task: any) => task.id == res.new.task_id);
              if (task) {
                task.progressType = 'Završeno';
              }
            }
          }
        }
      });
    }

    getStaffFullName(staff: Profile): string {
        if (!staff.first_name && !staff.last_name) return 'Nepoznat';
        return [staff.first_name, staff.last_name].filter(Boolean).join(' ');
    }

    getHouseNumber(houseId: number): string {
        const house = this.houses.find(h => h.house_id === houseId);
        return house ? house.house_number.toString() : '?';
    }

    getTaskTypeIcon(taskTypeId: number): string {
        switch (taskTypeId) {
            case 1: // Cleaning
                return 'pi pi-home';
            case 2: // Maintenance
                return 'pi pi-wrench';
            default:
                return 'pi pi-question';
        }
    }

    isTaskCompleted(task: Task): boolean {
        return task.task_progress_type_id === 3; // Assuming 3 is "Completed"
    }

    isTaskInProgress(task: Task): boolean {
        return task.task_progress_type_id === 2; // Assuming 2 is "In Progress"
    }

    getTaskStatusIcon(task: Task): string {
        if (this.isTaskCompleted(task)) return 'pi pi-check-circle';
        if (this.isTaskInProgress(task)) return 'pi pi-clock';
        return 'pi pi-circle';
    }

    getTaskStatusText(task: Task): string {
        if (this.isTaskCompleted(task)) return 'Završeno';
        if (this.isTaskInProgress(task)) return 'U tijeku';
        return 'Nije započeto';
    }

    getActionButtonLabel(task: Task): string {
        if (this.isTaskInProgress(task)) return 'Završi';
        return 'Započni';
    }

    getActionButtonSeverity(task: Task): 'success' | 'info' | 'warn' | 'danger' | 'help' | 'primary' | 'secondary' | 'contrast' {
        if (this.isTaskInProgress(task)) return 'success';
        return 'primary';
    }

    handleTaskAction(task: Task) {
        const newProgressTypeId = this.isTaskInProgress(task) ? 3 : 2; // 3 = Completed, 2 = In Progress
        this.dataService.updateTaskProgressType(task.task_id, newProgressTypeId).subscribe({
            next: () => {
                console.log('Task progress updated:', { taskId: task.task_id, progressTypeId: newProgressTypeId });
            },
            error: (error: unknown) => {
                console.error('Error updating task progress:', error);
            }
        });
    }
} 

enum TaskProgressType {
    ASSIGNED = 'Dodijeljeno',
    IN_PROGRESS = 'U progresu',
    COMPLETED = 'Završeno',
}