import { Component, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContextMenuModule, ContextMenu } from 'primeng/contextmenu';
import { Task } from '../../core/models/data.models';
import { TaskService } from '../../core/services/task.service';
import { WorkGroupService } from '../../core/services/work-group.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { HouseService } from '../../core/services/house.service';
import { DataService } from '../../core/services/data.service';

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
      border-radius: 6px;
      margin-bottom: 0.25rem;
      min-height: 2.75rem;
      font-size: 0.875rem;
      width: fit-content;
      cursor: pointer;
      transition: all 0.2s ease;
      backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
      -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow:
        var(--glass-shadow),
        inset 0 1px 1px rgba(255, 255, 255, 0.15);

      &:hover {
        cursor: pointer;
        transform: translateY(-2px);
        box-shadow:
          var(--glass-shadow-elevated),
          inset 0 1px 2px rgba(255, 255, 255, 0.25);
        border-color: rgba(255, 255, 255, 0.35);
      }

      .house-number, .task-icon i {
        color: var(--p-surface-0);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      }

      &.completed {
        background: linear-gradient(
          135deg,
          rgba(248, 113, 113, 0.85),
          rgba(239, 68, 68, 0.75)
        );
        border-color: rgba(248, 113, 113, 0.4);
        color: var(--p-surface-0);
      }

      &.in-progress {
        background: linear-gradient(
          135deg,
          rgba(250, 204, 21, 0.85),
          rgba(234, 179, 8, 0.75)
        );
        border-color: rgba(250, 204, 21, 0.4);
        color: var(--p-surface-0);
      }

      &.assigned {
        background: linear-gradient(
          135deg,
          rgba(59, 130, 246, 0.85),
          rgba(37, 99, 235, 0.75)
        );
        border-color: rgba(59, 130, 246, 0.4);
        color: var(--p-surface-0);
      }

      &.not-assigned {
        background: linear-gradient(
          135deg,
          rgba(34, 197, 94, 0.85),
          rgba(22, 163, 74, 0.75)
        );
        border-color: rgba(34, 197, 94, 0.4);
        color: var(--p-surface-0);
      }

      &.assignable {
        position: relative;
        &:after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 6px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        &:hover:after {
          opacity: 1;
        }
      }

      &.in-active-group {
        &:hover {
          background: linear-gradient(
            135deg,
            rgba(239, 68, 68, 0.9),
            rgba(220, 38, 38, 0.8)
          ) !important;
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

  private destroy$ = new Subject<void>();
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
    this.subscribeToUrgentIcon();
    this.taskIcon = this.taskService.getTaskIcon(this.task.task_type_id);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  subscribeToUrgentIcon(){
    if (this.task?.is_unscheduled) {
      this.taskService.isUrgentIconVisible$
        .pipe(takeUntil(this.destroy$))
        .subscribe(visible => {
          this.isUrgentIconVisible = visible;
        });
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