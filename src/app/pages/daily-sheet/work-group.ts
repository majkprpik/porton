import { Component, Input, Output, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Task, Profile, DataService } from '../service/data.service';
import { TaskCardComponent } from './task-card';
import { TagModule } from 'primeng/tag';
import { StaffCardComponent } from './staff-card';
import { MenuItem } from 'primeng/api';
import { ContextMenu, ContextMenuModule } from 'primeng/contextmenu';
import { forkJoin } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { WorkGroupService } from './work-group.service';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-work-group',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule, 
    TaskCardComponent, 
    TagModule, 
    StaffCardComponent, 
    ContextMenuModule,
    TooltipModule
  ],
  template: `
    <div class="work-group-container" [class.active]="isActive">
      <div class="active-border"></div>
      <div class="work-group-header">
        <div class="work-group-title-area">
          <span class="work-group-title">Team {{workGroup?.work_group_id}}</span>
          <p-tag 
            [value]="workGroup?.is_locked ? 'PUBLISHED' : 'NOT PUBLISHED'"
            [severity]="workGroup?.is_locked ? 'success' : 'secondary'"
          ></p-tag>
        </div>
        <p-button 
          [label]="isActive ? 'DEACTIVATE' : 'ACTIVATE'"
          [severity]="isActive ? 'secondary' : 'success'"
          (onClick)="onGroupClick()"
          class="activate-button"
        ></p-button>
        <div class="header-actions">
          <p-button 
            icon="pi pi-trash" 
            severity="danger" 
            [text]="true"
            [rounded]="true"
            (onClick)="onDeleteClick($event)"
            pTooltip="Delete Group"
          ></p-button>
        </div>
      </div>
      <div class="work-group-content">
        <div class="tasks-area">
          @if (assignedTasks.length === 0) {
            <div class="drop-area">Click tasks to assign here</div>
          } @else {
            <div class="tasks-list">
              @for (task of assignedTasks; track task.task_id) {
                <app-task-card 
                  [houseNumber]="task.house_id"
                  [state]="'in-progress'"
                  [taskIcon]="getTaskIcon(task.task_type_id)"
                  [isInActiveGroup]="isActive"
                  (removeFromGroup)="onRemoveTask(task)">
                </app-task-card>
              }
            </div>
          }
        </div>
        <div class="staff-area">
          @if (assignedStaff.length === 0) {
            <div class="drop-area">Click staff to assign here</div>
          } @else {
            <div class="staff-list">
              @for (staff of assignedStaff; track staff.id) {
                <app-staff-card 
                  [staff]="staff"
                  [isInActiveGroup]="isActive"
                  (removeFromGroup)="onRemoveStaff(staff)"
                  (contextmenu)="onStaffContextMenu($event, staff)"
                ></app-staff-card>
              }
            </div>
          }
        </div>
      </div>
    </div>

    <p-contextMenu #staffContextMenu [model]="staffMenuItems"></p-contextMenu>
  `,
  styles: `
    @keyframes borderDance {
      0% {
        background-position: 0 0, 100% 0, 100% 100%, 0 100%;
      }
      100% {
        background-position: 100% 0, 100% 100%, 0 100%, 0 0;
      }
    }

    .work-group-container {
      background-color: var(--surface-card);
      border-radius: 6px;
      padding: 1rem;
      margin-bottom: 1rem;
      box-shadow: var(--card-shadow);
      position: relative;
      transition: all 0.2s;

      &:hover {
        background-color: var(--surface-hover);
      }

      &.active {
        background-color: rgba(50, 177, 151, 0.1);
        border: 2px solid rgba(50, 177, 151, 0.2);

        .work-group-title {
          color: var(--text-color);
        }

        &:hover {
          background-color: rgba(50, 177, 151, 0.15);
        }

        .active-border {
          position: absolute;
          inset: 0;
          border-radius: 6px;
          pointer-events: none;
          background-image: 
            linear-gradient(to right, rgba(50, 177, 151, 0.5) 50%, transparent 50%),
            linear-gradient(to bottom, rgba(50, 177, 151, 0.5) 50%, transparent 50%),
            linear-gradient(to left, rgba(50, 177, 151, 0.5) 50%, transparent 50%),
            linear-gradient(to top, rgba(50, 177, 151, 0.5) 50%, transparent 50%);
          background-size: 20px 2px, 2px 20px, 20px 2px, 2px 20px;
          background-position: 0 0, 100% 0, 100% 100%, 0 100%;
          background-repeat: repeat-x, repeat-y, repeat-x, repeat-y;
          animation: borderDance 5s infinite linear;
        }
      }
    }

    .work-group-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      gap: 1rem;
    }

    .work-group-title-area {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .work-group-title {
      font-weight: 600;
      font-size: 1.1rem;
      color: var(--text-color);
    }

    .activate-button-container {
      display: flex;
      justify-content: center;
      margin: -0.5rem 0 1rem 0;
    }

    :host ::ng-deep {
      .activate-button {
        .p-button {
          min-width: 200px;
          font-size: 1.1rem;
          font-weight: 600;
          padding: 0.75rem 2rem;
          text-transform: uppercase;
        }
      }
    }

    .work-group-content {
      display: flex;
      gap: 1rem;
    }

    .tasks-area, .staff-area {
      flex: 1;
      min-height: 150px;
      border: 2px dashed var(--surface-border);
      border-radius: 4px;
      background: var(--surface-ground);
      padding: 0.5rem;
    }

    .drop-area {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-color-secondary);
      font-style: italic;
    }

    .tasks-list, .staff-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
  `
})
export class WorkGroup implements OnInit {
  @Input() workGroup?: { work_group_id: number; is_locked: boolean };
  @Input() isActive: boolean = false;
  @Input() assignedTasks: Task[] = [];
  @Input() assignedStaff: Profile[] = [];
  
  @Output() groupSelected = new EventEmitter<void>();
  @Output() deleteClicked = new EventEmitter<void>();
  @Output() taskRemoved = new EventEmitter<Task>();
  @Output() staffRemoved = new EventEmitter<Profile>();
  
  @ViewChild('staffContextMenu') staffContextMenu!: ContextMenu;

  selectedStaff?: Profile;
  staffMenuItems: MenuItem[] = [
    {
      label: 'Remove from Work Group',
      icon: 'pi pi-times',
      command: () => this.removeStaffFromGroup()
    }
  ];

  constructor(
    private dataService: DataService,
    private workGroupService: WorkGroupService
  ) {}

  ngOnInit() {
    if (this.workGroup) {
      this.loadAssignedStaff();
    }
  }

  loadAssignedStaff() {
    if (this.workGroup?.work_group_id) {
      this.dataService.getAssignedStaffForWorkGroup(this.workGroup.work_group_id)
        .subscribe(staff => {
          this.assignedStaff = staff;
        });
    }
  }

  onGroupClick() {
    if (this.isActive) {
      // If the group is already active, deactivate it
      this.workGroupService.setActiveGroup(undefined);
    } else {
      // If the group is not active, activate it
      this.groupSelected.emit();
    }
  }

  onDeleteClick(event: Event) {
    event.stopPropagation();
    this.deleteClicked.emit();
  }

  onStaffContextMenu(event: MouseEvent, staff: Profile) {
    event.preventDefault();
    event.stopPropagation();
    this.selectedStaff = staff;
    this.staffContextMenu.show(event);
  }

  onRemoveTask(task: Task) {
    if (this.workGroup?.work_group_id) {
      // Get the progress type ID for "Nije dodijeljeno"
      this.dataService.taskProgressTypes$.pipe(
        map(types => types.find(type => type.task_progress_type_name === 'Nije dodijeljeno')),
        take(1)
      ).subscribe(nijeDodijeljenoType => {
        if (!nijeDodijeljenoType) {
          console.error('Could not find progress type "Nije dodijeljeno"');
          return;
        }

        const operations = [
          this.dataService.removeTaskFromWorkGroup(this.workGroup!.work_group_id, task.task_id),
          this.dataService.updateTaskProgressType(task.task_id, nijeDodijeljenoType.task_progress_type_id)
        ];

        forkJoin(operations).subscribe({
          next: () => {
            this.taskRemoved.emit(task);
          },
          error: (error: any) => {
            console.error('Error removing task:', error);
          }
        });
      });
    }
  }

  onRemoveStaff(staff: Profile) {
    if (staff.id && this.workGroup?.work_group_id) {
      this.dataService.removeStaffFromWorkGroup(staff.id, this.workGroup.work_group_id)
        .subscribe({
          next: () => {
            this.staffRemoved.emit(staff);
          },
          error: (error: any) => {
            console.error('Error removing staff:', error);
          }
        });
    }
  }

  removeStaffFromGroup() {
    if (this.selectedStaff?.id && this.workGroup?.work_group_id) {
      this.dataService.removeStaffFromWorkGroup(this.selectedStaff.id, this.workGroup.work_group_id)
        .subscribe({
          next: () => {
            this.staffRemoved.emit(this.selectedStaff);
            this.loadAssignedStaff();
          },
          error: (error: any) => {
            console.error('Error removing staff:', error);
          }
        });
    }
  }

  getTaskIcon(taskTypeId: number): string {
    const iconMap: { [key: number]: string } = {
      1: 'pi pi-home',      // Čišćenje kućice
      2: 'pi pi-table',     // Čišćenje terase
      3: 'pi pi-inbox',     // Mijenjanje posteljine
      4: 'pi pi-bookmark',  // Mijenjanje ručnika
      5: 'pi pi-wrench'     // Popravak
    };
    return iconMap[taskTypeId] || 'pi pi-file';
  }
} 