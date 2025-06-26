import { DataService, Profile, Task, WorkGroup } from './../../pages/service/data.service';
import { Component, Input, SimpleChanges } from '@angular/core';
import { TabViewModule } from 'primeng/tabview';
import { TaskService } from '../../pages/service/task.service';
import { HouseService } from '../../pages/service/house.service';
import { Router } from '@angular/router';
import { ChipModule } from 'primeng/chip';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { StaffCardComponent } from '../../pages/daily-sheet/staff-card';
import { TaskCardComponent } from '../../pages/daily-sheet/task-card';
import { TasksIndexSortPipe } from '../../pipes/tasks-index-sort.pipe';

@Component({
  selector: 'app-team-task-card',
  imports: [    
    CommonModule,
    TabViewModule,
    ChipModule, 
    TranslateModule,
    StaffCardComponent,
    TaskCardComponent,
    TasksIndexSortPipe,
  ],
  template: `
    <div class="team-card" [class.locked]="workGroup?.is_locked" (click)="navigateToDetail(workGroup?.work_group_id)">
        <div class="team-header">
          <h3>{{ 'TEAMS.TEAM-TASK-CARD.TEAM' | translate }} {{workGroup?.work_group_id}}</h3>
          <span class="status-badge" [class.locked]="workGroup?.is_locked">
            {{ workGroup?.is_locked ? ('TEAMS.TEAM-TASK-CARD.PUBLISHED' | translate) : ('TEAMS.TEAM-TASK-CARD.NOT-PUBLISHED' | translate) }}
          </span>
      </div>
      <div class="team-content">
          <div class="section">
            <h4>{{ 'TEAMS.TEAM-TASK-CARD.TEAM-MEMBERS' | translate }}</h4>
            @if (workGroupStaff.length === 0) {
              <p class="empty-section">{{ 'TEAMS.TEAM-TASK-CARD.NO-ASSIGNED-STAFF' | translate }}</p>
            } @else {
              <div class="staff-list">
                  @for (staff of workGroupStaff; track staff.id) {
                    <app-staff-card
                      [staff]="staff"
                      [canBeAssigned]="false"
                      [isInActiveGroup]="false"
                      [isClickedFromTeamDetails]="true"
                    >
                    </app-staff-card>
                  }
              </div>
            }
          </div>

          <div class="section">
            <h4>{{ 'TEAMS.TEAM-TASK-CARD.TASKS' | translate }}</h4>
            @if (workGroupTasks.length === 0) {
              <p class="empty-section">{{ 'TEAMS.TEAM-TASK-CARD.NO-ASSIGNED-TASKS' | translate }}</p>
            } @else {
              <div class="tasks-list">
                @for (task of workGroupTasks | tasksIndexSort; track task.task_id) {
                  <app-task-card 
                    [houseNumber]="houseService.getHouseNumber(task.house_id)"
                    [houseName]="houseService.getHouseName(task.house_id)"
                    [state]="taskService.getTaskState(task.task_progress_type_id)"
                    [taskIcon]="taskService.getTaskIcon(task.task_type_id)"
                    [task]="task"
                    [canBeAssigned]="false"
                    [isInActiveGroup]="false"
                  >
                  </app-task-card>
                }
              </div>
            }
          </div>
      </div>
    </div>
  `,
  styles: `
    .team-card {
        border-radius: 4px;
        width: 350px;
        height: 100%;
        transition: transform 0.3s ease;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        box-sizing: border-box;
        padding: 20px;

        &:hover {
          transform: translateY(-2px);
          cursor: pointer;
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

    .task-card {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.75rem;
      border-radius: 4px;
      margin-bottom: 0.25rem;
      min-height: 2.75rem;
      font-size: 0.875rem;
      width: fit-content;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        box-shadow: var(--card-shadow);
      }

      .house-number, .task-icon i {
        color: var(--p-surface-0);
      }

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

      &.assignable {
        position: relative;
        &:after {
          content: '';
          position: absolute;
          inset: 0;
          border: 2px dashed var(--p-primary-500);
          border-radius: 4px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        &:hover:after {
          opacity: 1;
        }
      }

      &.in-active-group {
        &:hover {
          background: var(--p-red-500) !important;
        }
      }

      :host-context(.dark) & {
        &.pending {
          background: var(--p-yellow-400);
        }

        &.in-progress {
          background: var(--p-blue-400);
        }

        &.completed {
          background: var(--p-green-400);
        }
      }

      .house-number {
        font-weight: 600;
      }
  
      .task-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 15px;
  
        i {
          font-size: 0.875rem;
        }
  
        .remove-icon {
            display: none;
            position: absolute;
            right: 0.5rem;
            color: var(--red-500);
            font-size: 0.875rem;
        }
      }

      .urgent-task-icon{
        display: flex;
        align-items: center;
        justify-content: center;
        width: 15px;

        i {
          color: red;
          font-size: 0.875rem;
        }
      }
    }

    @media screen and (max-width: 450px){
      .team-card{
        width: 300px;
      }
    }

    @media screen and (max-width: 400px){
      .team-card{
        width: 250px;
      }
    }
  `
})
export class TeamTaskCardComponent {
  @Input() workGroup: WorkGroup | undefined = undefined;
  @Input() workGroupTasks: Task[] = [];
  @Input() workGroupStaff: Profile[] = [];
  @Input() isRepairGroup: boolean = false;
  taskIcon: any;
  isUrgentIconVisible: any;
  isUrgentIconVisibleMap: { [taskId: number]: boolean } = {};
  urgentIconSubscriptions: Subscription[] = [];

  constructor(
    public taskService: TaskService,
    public houseService: HouseService,
    private router: Router
  ) {
        
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['workGroupTasks'] && this.workGroupTasks.length > 0) {
      this.setupUrgentIcons();
    }
  }

  private setupUrgentIcons(): void {
    // Unsubscribe from previous subscriptions
    this.urgentIconSubscriptions.forEach(sub => sub.unsubscribe());
    this.urgentIconSubscriptions = [];

    this.workGroupTasks.forEach(task => {
      if (task.is_unscheduled) {
        const sub = this.taskService.isUrgentIconVisible$.subscribe(visible => {
          this.isUrgentIconVisibleMap[task.task_id] = visible;
        });
        this.urgentIconSubscriptions.push(sub);
      }
    });
  }

  ngOnDestroy(): void {
    this.urgentIconSubscriptions.forEach(sub => sub.unsubscribe());
  }

  onTaskClick(event: MouseEvent, task: Task) {
    event.stopPropagation(); // Prevents the parent click
    if (this.workGroup?.is_locked) {
      this.taskService.$taskModalData.next(task);
    }
  }
  
  getStaffFullName(staff: Profile): string {
    if (!staff.first_name && !staff.last_name) return 'Nepoznat';
    return [staff.first_name, staff.last_name].filter(Boolean).join(' ');
  }

  navigateToDetail(workGroupId: number | undefined) {
    if(workGroupId){
      this.router.navigate(['/teams', workGroupId]);
    }
  }
}
