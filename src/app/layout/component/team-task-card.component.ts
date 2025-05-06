import { DataService, Profile, Task, WorkGroup } from './../../pages/service/data.service';
import { Component, Input } from '@angular/core';
import { TabViewModule } from 'primeng/tabview';
import { TaskService } from '../../pages/service/task.service';
import { HouseService } from '../../pages/service/house.service';
import { Router } from '@angular/router';
import { ChipModule } from 'primeng/chip';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-team-task-card',
  imports: [    
    CommonModule,
    TabViewModule,
    ChipModule, 
  ],
  template: `
    <div class="team-card" [class.locked]="workGroup?.is_locked" (click)="navigateToDetail(workGroup?.work_group_id)">
        <div class="team-header">
          <h3>Tim {{workGroup?.work_group_id}}</h3>
          <span class="status-badge" [class.locked]="workGroup?.is_locked">
              {{workGroup?.is_locked ? 'Zaključano' : 'Aktivno'}}
          </span>
      </div>
      <div class="team-content">
          <p>Kreirano: {{workGroup?.created_at | date:'dd.MM.yyyy'}}</p>
          
          <div class="section">
            <h4>Članovi tima</h4>
            @if (workGroupStaff.length === 0) {
                <p class="empty-section">Nema dodijeljenih članova</p>
            } @else {
                <div class="staff-list">
                    @for (staff of workGroupStaff; track staff.id) {
                        <p-chip 
                            [label]="getStaffFullName(staff)"
                            [removable]="!workGroup?.is_locked"
                            (onRemove)="removeStaffFromGroup(staff.id!, workGroup?.work_group_id)"
                        ></p-chip>
                    }
                </div>
            }
          </div>

          <div class="section">
            <h4>Zadaci</h4>
            @if (workGroupTasks.length === 0) {
                <p class="empty-section">Nema dodijeljenih zadataka</p>
            } @else {
                <div class="tasks-list">
                    @for (task of workGroupTasks; track task.task_id) {
                        <div 
                            class="task-card" 
                            [class.assigned]="taskService.isTaskAssigned(task)"
                            [class.not-assigned]="taskService.isTaskNotAssigned(task)"
                            [class.in-progress]="taskService.isTaskInProgress(task) || taskService.isTaskPaused(task)"
                            [class.completed]="taskService.isTaskCompleted(task)"
                            [class.removable]="!workGroup?.is_locked" 
                            (click)="onTaskClick($event, task)"
                        >
                            <span class="house-number">{{houseService.getHouseNumber(task.house_id)}}</span>
                            <i class="task-icon" [class]="taskService.getTaskIcon(task.task_type_id)"></i>
                            @if (!workGroup?.is_locked) {
                                <i class="remove-icon pi pi-times"></i>
                            }
                        </div>
                      }
                </div>
            }
          </div>
      </div>
    </div>
  `,
  styles: `
    // ::ng-deep .p-tablist-tab-list {
    //     justify-content: space-evenly;
    // }
 
    // ::ng-deep .p-tabview-panel {
    //     height: 300px; /* Set your desired height */
    //     border-radius: 4px;
    //     transition: transform 0.3s ease;
    //     border-radius: 4px;
    // }
  
    .team-card {
        border-radius: 4px;
        width: 350px;
        height: 350px;
        transition: transform 0.3s ease;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        box-sizing: border-box;
        padding: 20px;

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
    }

  `
})
export class TeamTaskCardComponent {
  @Input() workGroup: WorkGroup | undefined = undefined;
  @Input() workGroupTasks: Task[] = [];
  @Input() workGroupStaff: Profile[] = [];
  @Input() isRepairGroup: boolean = false;

  constructor(
    private dataService: DataService,
    public taskService: TaskService,
    public houseService: HouseService,
    private router: Router
  ) {
        
  }

  onTaskClick(event: MouseEvent, task: Task) {
    event.stopPropagation(); // Prevents the parent click
    if (this.workGroup?.is_locked) {
        this.taskService.$taskModalData.next(task);
    } else {
      this.removeTaskFromGroup(task.task_id, this.workGroup?.work_group_id);
    }
  }

  removeTaskFromGroup(taskId: number, workGroupId: number | undefined) {
    if(workGroupId){
      this.dataService.removeTaskFromWorkGroup(workGroupId, taskId).subscribe({
          next: () => {
              console.log('Task removed from work group:', { taskId, workGroupId });
          },
          error: (error) => {
              console.error('Error removing task from work group:', error);
          }
      });
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

  removeStaffFromGroup(profileId: string, workGroupId: number | undefined) { 
    if(workGroupId){
      this.dataService.removeStaffFromWorkGroup(profileId, workGroupId).subscribe({
          next: () => {
              console.log('Staff removed from work group:', { profileId, workGroupId });
          },
          error: (error) => {
              console.error('Error removing staff from work group:', error);
          }
      });
    }
  }
}
