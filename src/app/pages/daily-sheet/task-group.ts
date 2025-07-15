import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskCardComponent } from './task-card';
import { Task, TaskType, DataService, WorkGroupTask } from '../service/data.service';
import { PanelModule } from 'primeng/panel';
import { BadgeModule } from 'primeng/badge';
import { combineLatest } from 'rxjs';
import { TaskProgressTypeName, TaskService } from '../service/task.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-task-group',
  standalone: true,
  imports: [
    CommonModule, 
    TaskCardComponent, 
    PanelModule, 
    BadgeModule,
    TranslateModule,
  ],
  template: `
    <p-panel 
      [toggleable]="true" 
      [collapsed]="false"
      class="task-group"
    >
      <ng-template pTemplate="header">
        <div class="flex align-items-center justify-content-between w-full">
          <div class="left-side">
            <i class="group-icon" [class]="taskService.getTaskIcon(taskType?.task_type_id || 0)"></i>
            <span class="group-name">{{ 'TASK-TYPES.' + taskType?.task_type_name | translate }}</span>
            <span class="task-count">{{filteredTasks.length}}</span>
          </div>
        </div>
      </ng-template>
      <div class="task-grid">
        @for (task of filteredTasks; track task.task_id) {
          <app-task-card 
            [task]="task"
            [canBeAssigned]="canAssignTasks && isTaskAvailable(task)">
          </app-task-card>
        }
      </div>
    </p-panel>
  `,
  styles: `
    :host ::ng-deep {
      .task-group {
        margin-bottom: 0.5rem;

        .left-side{
          display: flex;
          flex-direction: row; 
          align-items: center;
          justify-content: center;
          gap: 10px;
          height: 100%;
        }

        .p-panel {
          background: transparent;
          margin-bottom: 0.5rem;
        }

        .p-panel-header {
          display: flex;
          flex-direction: row; 
          align-items: center;
          padding: 0.75rem 1.25rem;
          border: none;
          border-radius: 6px;
          background: var(--surface-ground);
          height: 40px;
        }

        .p-panel-content {
          padding: 1rem;
          border: none;
          background: transparent !important;
        }

        .p-panel-icons {
          order: 2;
        }
      }
    }

    .group-icon {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      color: var(--text-color);
    }

    .group-name {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      font-weight: 550;
      color: var(--text-color);
      margin-right: 0.5rem;
    }

    .task-count {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      width: 23px;
      height: 23px;
      background: var(--primary-color);
      color: var(--primary-color-text);
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .task-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding: 0.5rem;
    }
  `
})
export class TaskGroupComponent implements OnInit {
  @Input() taskType?: TaskType;
  @Input() tasks: Task[] = [];
  @Input() canAssignTasks: boolean = false;
  @Output() taskAssigned = new EventEmitter<Task>();
  
  workGroupTasks: WorkGroupTask[] = [];

  constructor(
    private dataService: DataService,
    public taskService: TaskService,
  ) {}

  ngOnInit() {
    combineLatest([
      this.dataService.workGroupTasks$,
    ]).subscribe({
      next: ([workGroupTasks]) => {
        this.workGroupTasks = workGroupTasks;
      }
    });
  } 

  get filteredTasks(): Task[] {
    return this.tasks.filter(task => 
      task.task_type_id == this.taskType?.task_type_id && 
      task.task_progress_type_id == this.taskService.getTaskProgressTypeByName(TaskProgressTypeName.NotAssigned)?.task_progress_type_id
    );
  }

  isTaskAvailable(task: Task): boolean {
    return !this.workGroupTasks.some(wgt => wgt.task_id === task.task_id);
  }
} 