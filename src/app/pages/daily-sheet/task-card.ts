import { Component, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContextMenuModule, ContextMenu } from 'primeng/contextmenu';
import { MenuItem } from 'primeng/api';
import { Task } from '../service/data.service';
import { TaskService } from '../service/task.service';
import { WorkGroupService } from '../service/work-group.service';

export type TaskState = 'not-assigned' | 'assigned' |'in-progress' | 'completed';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, ContextMenuModule],
  template: `
    <div 
      class="task-card" 
      [class.assigned]="taskService.isTaskAssigned(task)"
      [class.not-assigned]="taskService.isTaskNotAssigned(task)"
      [class.in-progress]="taskService.isTaskInProgress(task)"
      [class.completed]="taskService.isTaskCompleted(task)"
      [class.assignable]="canBeAssigned"
      [class.in-active-group]="isInActiveGroup"
      (click)="onClick($event)"
      (contextmenu)="onContextMenu($event)"
    >
      <div class="house-number">{{houseNumber}}</div>
      <div class="task-icon">
        <i class="{{taskIcon}}"></i>
      </div>
    </div>

    <p-contextMenu #cm [model]="menuItems"></p-contextMenu>
  `,
  styles: `
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
    }
  `
})
export class TaskCardComponent {
  @Input() state: TaskState = 'not-assigned';
  @Input() houseNumber: number = 0;
  @Input() taskIcon: string = 'pi-home';
  @Input() task?: Task;
  @Input() canBeAssigned: boolean = false;
  @Input() isInActiveGroup: boolean = false;
  
  @Output() removeFromGroup = new EventEmitter<void>();
  
  @ViewChild('cm') contextMenu!: ContextMenu;

  menuItems: MenuItem[] = [
    {
      label: 'Change Status',
      icon: 'pi pi-sync',
      items: [
        {
          label: 'Pending',
          icon: 'pi pi-clock',
          command: () => this.updateStatus('not-assigned')
        },
        {
          label: 'In Progress',
          icon: 'pi pi-spin pi-spinner',
          command: () => this.updateStatus('in-progress')
        },
        {
          label: 'Completed',
          icon: 'pi pi-check',
          command: () => this.updateStatus('completed')
        },
        {
          label: 'Assigned',
          icon: 'pi pi-check',
          command: () => this.updateStatus('assigned')
        }
      ]
    },
    { separator: true },
    {
      label: 'View Details',
      icon: 'pi pi-eye',
      command: () => this.viewDetails()
    },
    {
      label: 'Edit',
      icon: 'pi pi-pencil',
      command: () => this.editTask()
    },
    { separator: true },
    {
      label: 'Delete',
      icon: 'pi pi-trash',
      command: () => this.deleteTask()
    }
  ];

  constructor(
    public taskService: TaskService,
    private workGroupService: WorkGroupService,
  ) {
    
  }

  onClick(event: MouseEvent) {
    event.stopPropagation();

    if(this.task?.task_progress_type_id == 37){
      this.canBeAssigned = true;
    }
    
    if (this.isInActiveGroup) {
      this.removeFromGroup.emit();
    } else if (this.canBeAssigned && this.workGroupService.getActiveGroup()) {
      this.taskService.$selectedTask.next(this.task);
    }
  }

  onContextMenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.contextMenu.show(event);
  }

  updateStatus(newState: TaskState) {
    // this.state = newState;
  }

  viewDetails() {
    //console.log('View task details');
    // Implement view details logic
  }

  editTask() {
    //console.log('Edit task');
    // Implement edit task logic
  }

  deleteTask() {
    //console.log('Delete task');
    // Implement delete task logic
  }
} 