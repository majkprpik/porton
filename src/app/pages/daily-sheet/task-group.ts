import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskCardComponent } from './task-card';
import { Task, TaskType, TaskProgressType, DataService, House } from '../service/data.service';
import { TaskState } from './task-card';
import { PanelModule } from 'primeng/panel';
import { BadgeModule } from 'primeng/badge';
import { combineLatest } from 'rxjs';

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
            [houseNumber]="getHouseNumber(task.house_id)"
            [state]="getTaskState(task.task_progress_type_id)"
            [taskIcon]="getTaskIcon(task.task_type_id)"
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
  workGroupTasks: { work_group_id: number; task_id: number }[] = [];
  houses: House[] = [];
  taskTypes: TaskType[] = [];

  constructor(
    private dataService: DataService,
  ) {}

  ngOnInit() {
    combineLatest([
      this.dataService.taskProgressTypes$,
      this.dataService.workGroupTasks$,
      this.dataService.houses$,
      this.dataService.taskTypes$
    ]).subscribe({
      next: ([types, tasks, houses, taskTypes]) => {
        this.progressTypes = types;
        this.workGroupTasks = tasks;
        this.houses = houses;
        this.taskTypes = taskTypes;
      }
    });
  } 

  get filteredTasks(): Task[] {
    let ftsks; 

    ftsks = this.tasks.filter(task => 
      task.task_type_id == this.taskType?.task_type_id && 
      task.task_progress_type_id == this.getProgressTypeIdByName("Nije dodijeljeno")
    );

    return ftsks;
  }

  
  getHouseNumber(houseId: number){
    return this.houses.find(house => house.house_id == houseId)?.house_number ?? 0;
  }

  getProgressTypeIdByName(progressTypeName: string){
    return this.progressTypes.find(progressType => progressType.task_progress_type_name == progressTypeName)?.task_progress_type_id
  }

  isTaskAvailable(task: Task): boolean {
    return !this.workGroupTasks.some(wgt => wgt.task_id === task.task_id);
  }

  getTaskState(progressTypeId: number): TaskState {
    switch (progressTypeId) {
      case this.progressTypes.find(tp => tp.task_progress_type_name == "U progresu")?.task_progress_type_id: 
        return 'in-progress';  // "U progresu"
      case this.progressTypes.find(tp => tp.task_progress_type_name == "Završeno")?.task_progress_type_id: 
        return 'completed';    // "Završeno"
      case this.progressTypes.find(tp => tp.task_progress_type_name == "Nije dodijeljeno")?.task_progress_type_id: 
        return 'not-assigned';      // "Nije dodijeljeno"
      case this.progressTypes.find(tp => tp.task_progress_type_name == "Dodijeljeno")?.task_progress_type_id: 
        return 'assigned';      // "Dodijeljeno"
      default: 
        return 'not-assigned';
    }
  }

  getTaskIcon(taskTypeId: number): string {
    switch(taskTypeId){
      case this.taskTypes.find(tt => tt.task_type_name == "Čišćenje kućice")?.task_type_id: 
        return 'pi pi-home';
      case this.taskTypes.find(tt => tt.task_type_name == "Čišćenje terase")?.task_type_id: 
        return 'pi pi-table';
      case this.taskTypes.find(tt => tt.task_type_name == "Mijenjanje posteljine")?.task_type_id: 
        return 'pi pi-inbox';
      case this.taskTypes.find(tt => tt.task_type_name == "Mijenjanje ručnika")?.task_type_id: 
        return 'pi pi-bookmark';
      case this.taskTypes.find(tt => tt.task_type_name == "Popravak")?.task_type_id: 
        return 'pi pi-wrench';
      default: 
        return 'pi pi-file';
    }
  }
} 