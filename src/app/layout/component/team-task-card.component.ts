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
      <p-tabView class="team-card" [class.locked]="workGroup?.is_locked">
        <p-tabPanel header="Detalji" (click)="navigateToDetail(workGroup?.work_group_id)">
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
                              <div class="task-card" [class.removable]="!workGroup?.is_locked" (click)="!workGroup?.is_locked && removeTaskFromGroup(task.task_id, workGroup?.work_group_id)">
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
      </p-tabPanel>
      <p-tabPanel header="Slike" [disabled]="!isRepairGroup">
          <p>
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium...
          </p>
      </p-tabPanel>
      <p-tabPanel header="Komentari" [disabled]="!isRepairGroup">
          <p>
              At vero eos et accusamus et iusto odio dignissimos...
          </p>
      </p-tabPanel>
    </p-tabView>
  `,
  styles: `
    ::ng-deep .p-tablist-tab-list {
        justify-content: space-evenly;
    }
 
    ::ng-deep .p-tabview-panel {
        height: 300px; /* Set your desired height */
        border-radius: 4px;
        transition: transform 0.3s ease;
        border-radius: 4px;
    }
  
    .team-card {
        border-radius: 4px;
        width: 350px;
        transition: transform 0.3s ease;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);

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
      border: 1px solid var(--surface-border);
      border-radius: 4px;
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
