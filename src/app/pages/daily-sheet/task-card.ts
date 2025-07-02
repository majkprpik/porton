import { Component, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContextMenuModule, ContextMenu } from 'primeng/contextmenu';
import { MenuItem } from 'primeng/api';
import { DataService, Task } from '../service/data.service';
import { TaskService } from '../service/task.service';
import { WorkGroupService } from '../service/work-group.service';
import { Subscription } from 'rxjs';
import { HouseService } from '../service/house.service';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, ContextMenuModule],
  template: `
    <div 
      class="task-card" 
      [class.assigned]="taskService.isTaskAssigned(task)"
      [class.not-assigned]="taskService.isTaskNotAssigned(task)"
      [class.in-progress]="taskService.isTaskInProgress(task) || taskService.isTaskPaused(task)"
      [class.completed]="taskService.isTaskCompleted(task)"
      [class.assignable]="canBeAssigned"
      [class.in-active-group]="isInActiveGroup"
      (click)="onClick($event)"
    >
      <div class="house-number">{{ houseService.getHouseName(task.house_id) }}</div>
      @if(task.is_unscheduled){
        @if(isUrgentIconVisible){
          <div class="urgent-task-icon">
            <i class="fa fa-exclamation-triangle"></i>
          </div>
        } @else {
          <div class="task-icon">
            <i class="{{taskIcon}}"></i>
          </div>
        }
      } @else {
        <div class="task-icon">
          <i class="{{taskIcon}}"></i>
        </div>
      }
    </div>
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
      transition: all 0.15s;

      &:hover {
        cursor: pointer;
        transform: translateY(-4px);
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
      width: 15px;

      i {
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
  `
})
export class TaskCardComponent {
  @ViewChild('cm') contextMenu!: ContextMenu;

  @Input() task!: Task;
  @Input() canBeAssigned: boolean = false;
  @Input() isInActiveGroup: boolean = false;

  @Output() removeFromGroup = new EventEmitter<void>();

  private urgentIconSubscription?: Subscription;
  isUrgentIconVisible = false;

  taskIcon: string = 'fa fa-file';

  constructor(
    public taskService: TaskService,
    private workGroupService: WorkGroupService,
    public houseService: HouseService,
    public dataService: DataService,
  ) {

  }

  ngOnInit(){
    if(this.task?.is_unscheduled){
      this.urgentIconSubscription = this.taskService.isUrgentIconVisible$.subscribe((visible) => {
        this.isUrgentIconVisible = visible;
      });
    }

    this.taskIcon = this.taskService.getTaskIcon(this.taskService.taskTypes.find(tt => tt.task_type_id == this.task.task_type_id)?.task_type_id);
  }

  ngOnDestroy(): void {
    if (this.urgentIconSubscription) {
      this.urgentIconSubscription.unsubscribe();
    }
  }

  onClick(event: MouseEvent) {
    event.stopPropagation();

    if(this.taskService.isTaskNotAssigned(this.task)){
      this.canBeAssigned = true;
    }
    
    if (this.isInActiveGroup) {
      this.removeFromGroup.emit();
    } else if (this.canBeAssigned && this.workGroupService.getActiveGroup()) {
      this.taskService.$selectedTask.next(this.task);
    } else {
      this.taskService.$taskModalData.next(this.task);
    }
  }

  onContextMenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.contextMenu.show(event);
  }
} 