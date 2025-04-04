import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Task, Profile } from '../service/data.service';
import { TaskCardComponent } from './task-card';

@Component({
  selector: 'app-work-group',
  standalone: true,
  imports: [CommonModule, ButtonModule, TaskCardComponent],
  template: `
    <div class="work-group-container" 
         [class.active]="isActive"
         (click)="onGroupClick()">
      <div class="work-group-header">
        <span class="work-group-title">Team {{workGroup?.work_group_id}}</span>
        <div class="header-actions">
          <p-button 
            icon="pi pi-lock" 
            [severity]="workGroup?.is_locked ? 'success' : 'secondary'" 
            [text]="true"
            [rounded]="true"
            (click)="onLockClick($event)">
          </p-button>
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
                <div class="staff-chip">
                  <i class="pi pi-user"></i>
                  <span>{{getStaffName(staff)}}</span>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    .work-group-container {
      background-color: var(--surface-card);
      border-radius: 6px;
      padding: 1rem;
      margin-bottom: 1rem;
      box-shadow: var(--card-shadow);
      border: 2px solid transparent;
      transition: all 0.2s;
      cursor: pointer;

      &:hover {
        border-color: var(--primary-color);
      }

      &.active {
        border-color: var(--primary-color);
        background-color: var(--primary-50);
      }
    }

    .work-group-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
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

    .staff-chip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--surface-card);
      border-radius: 20px;
      color: var(--text-color);
      font-size: 0.875rem;

      i {
        color: var(--text-color-secondary);
      }
    }
  `
})
export class WorkGroup {
  @Input() workGroup?: { work_group_id: number; is_locked: boolean };
  @Input() isActive: boolean = false;
  @Input() assignedTasks: Task[] = [];
  @Input() assignedStaff: Profile[] = [];
  
  @Output() groupSelected = new EventEmitter<void>();
  @Output() lockToggled = new EventEmitter<void>();
  @Output() deleteClicked = new EventEmitter<void>();

  onGroupClick() {
    this.groupSelected.emit();
  }

  onLockClick(event: Event) {
    event.stopPropagation();
    this.lockToggled.emit();
  }

  onDeleteClick(event: Event) {
    event.stopPropagation();
    this.deleteClicked.emit();
  }

  getStaffName(staff: Profile): string {
    return `${staff.first_name} ${staff.last_name}`.trim() || 'Unknown';
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