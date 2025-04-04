import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskCardComponent } from './task-card';
import { Task, TaskType, TaskProgressType, DataService } from '../service/data.service';
import { TaskState } from './task-card';
import { PanelModule } from 'primeng/panel';
import { BadgeModule } from 'primeng/badge';

@Component({
  selector: 'app-task-group',
  standalone: true,
  imports: [CommonModule, TaskCardComponent, PanelModule, BadgeModule],
  template: `
    <p-panel 
      [toggleable]="true" 
      [collapsed]="false"
      class="task-group"
    >
      <ng-template pTemplate="header">
        <div class="flex align-items-center justify-content-between w-full">
          <div class="flex align-items-center gap-2">
            <i class="group-icon" [class]="getTaskIcon(taskType?.task_type_id || 0)"></i>
            <span class="group-name">{{taskType?.task_type_name}}</span>
            <span class="task-count">{{filteredTasks.length}}</span>
          </div>
        </div>
      </ng-template>
      <div class="task-grid">
        @for (task of filteredTasks; track task.task_id) {
          <app-task-card 
            [houseNumber]="task.house_id"
            [state]="getTaskState(task.task_progress_type_id)"
            [taskIcon]="getTaskIcon(task.task_type_id)"
            [task]="task"
            [canBeAssigned]="canAssignTasks"
            (taskClicked)="onTaskClicked(task)">
          </app-task-card>
        }
      </div>
    </p-panel>
  `,
  styles: `
    :host ::ng-deep {
      .task-group {
        margin-bottom: 0.5rem;

        .p-panel {
          background: transparent;
          margin-bottom: 0.5rem;
        }

        .p-panel-header {
          padding: 0.75rem 1.25rem;
          border: none;
          border-radius: 6px;
          background: var(--surface-ground);
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
      font-size: 1.2rem;
      color: var(--text-color);
    }

    .group-name {
      font-weight: 600;
      color: var(--text-color);
      margin-right: 0.5rem;
    }

    .task-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.5rem;
      height: 1.5rem;
      padding: 0 0.5rem;
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
  
  progressTypes: TaskProgressType[] = [];

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.dataService.taskProgressTypes$.subscribe(types => {
      this.progressTypes = types;
    });
  }

  get filteredTasks(): Task[] {
    return this.tasks.filter(task => task.task_type_id === this.taskType?.task_type_id);
  }

  getTaskState(progressTypeId: number): TaskState {
    switch (progressTypeId) {
      case 151: return 'in-progress';  // "U progresu"
      case 152: return 'completed';    // "Završeno"
      case 149: return 'pending';      // "Nije dodijeljeno"
      case 150: return 'pending';      // "Dodijeljeno"
      default: return 'pending';
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

  onTaskClicked(task: Task) {
    if (this.canAssignTasks) {
      this.taskAssigned.emit(task);
    }
  }
} 