import { Component, Input, Output, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Task, Profile, DataService } from '../service/data.service';
import { TaskCardComponent } from './task-card';
import { TagModule } from 'primeng/tag';
import { StaffCardComponent } from './staff-card';
import { MenuItem } from 'primeng/api';
import { ContextMenu, ContextMenuModule } from 'primeng/contextmenu';

@Component({
  selector: 'app-work-group',
  standalone: true,
  imports: [CommonModule, ButtonModule, TaskCardComponent, TagModule, StaffCardComponent, ContextMenuModule],
  template: `
    <div class="work-group-container" 
         [class.active]="isActive"
         (click)="onGroupClick()">
      <div class="active-border"></div>
      <div class="work-group-header">
        <div class="work-group-title-area">
          <span class="work-group-title">Team {{workGroup?.work_group_id}}</span>
          <p-tag 
            [value]="workGroup?.is_locked ? 'PUBLISHED' : 'NOT PUBLISHED'"
            [severity]="workGroup?.is_locked ? 'success' : 'secondary'"
          ></p-tag>
        </div>
        <div class="header-actions">
          <p-button 
            icon="pi pi-trash" 
            severity="danger" 
            [text]="true"
            [rounded]="true"
            (click)="onDeleteClick($event)">
          </p-button>
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
                  [taskIcon]="getTaskIcon(task.task_type_id)">
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
      cursor: pointer;

      &:hover {
        background-color: var(--surface-hover);
      }

      &.active {
        background-color: var(--primary-50);

        .active-border {
          position: absolute;
          inset: 0;
          border-radius: 6px;
          pointer-events: none;
          background-image: 
            linear-gradient(to right, var(--primary-color) 50%, transparent 50%),
            linear-gradient(to bottom, var(--primary-color) 50%, transparent 50%),
            linear-gradient(to left, var(--primary-color) 50%, transparent 50%),
            linear-gradient(to top, var(--primary-color) 50%, transparent 50%);
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
    }

    .work-group-title-area {
      display: flex;
      align-items: center;
      gap: 0.75rem;
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
  
  @ViewChild('staffContextMenu') staffContextMenu!: ContextMenu;

  selectedStaff?: Profile;
  staffMenuItems: MenuItem[] = [
    {
      label: 'Remove from Work Group',
      icon: 'pi pi-times',
      command: () => this.removeStaffFromGroup()
    }
  ];

  constructor(private dataService: DataService) {}

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
    this.groupSelected.emit();
  }

  onDeleteClick(event: Event) {
    event.stopPropagation();
    this.deleteClicked.emit();
  }

  onStaffContextMenu(event: MouseEvent, staff: Profile) {
    event.preventDefault();
    this.selectedStaff = staff;
    this.staffContextMenu.show(event);
  }

  removeStaffFromGroup() {
    if (this.selectedStaff?.id && this.workGroup?.work_group_id) {
      this.dataService.removeStaffFromWorkGroup(this.selectedStaff.id, this.workGroup.work_group_id)
        .subscribe({
          next: () => {
            //console.log('Staff removed successfully');
            this.loadAssignedStaff();
          },
          error: (error) => {
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