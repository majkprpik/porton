import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TaskGroupComponent } from './task-group';
import { DataService, Task, TaskType, TaskProgressType } from '../service/data.service';
import { WorkGroupService } from './work-group.service';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, TaskGroupComponent],
  template: `
    <div class="tasks-container">
      @if (loading) {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner"></i>
          <span>Loading tasks...</span>
        </div>
      } @else {
        @for (taskType of taskTypes; track taskType.task_type_id) {
          <app-task-group 
            [taskType]="taskType"
            [tasks]="getAvailableTasks()"
            [canAssignTasks]="hasActiveWorkGroup"
            (taskAssigned)="onTaskAssigned($event)">
          </app-task-group>
        }
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .tasks-container {
      background: var(--surface-card);
      height: 100%;
      overflow-y: auto;
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1rem;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: var(--text-color-secondary);

      i {
        font-size: 2rem;
        margin-bottom: 1rem;
      }
    }
  `]
})
export class TasksComponent implements OnInit {
  loading = true;
  tasks: Task[] = [];
  taskTypes: TaskType[] = [];
  progressTypes: TaskProgressType[] = [];
  workGroupTasks: { work_group_id: number; task_id: number }[] = [];
  activeWorkGroupId?: number;

  constructor(
    private dataService: DataService,
    private workGroupService: WorkGroupService
  ) {}

  ngOnInit() {
    combineLatest([
      this.dataService.tasks$,
      this.dataService.taskTypes$,
      this.dataService.taskProgressTypes$,
      this.dataService.workGroupTasks$,
      this.workGroupService.activeGroupId$
    ]).subscribe(
      ([tasks, taskTypes, progressTypes, workGroupTasks, activeGroupId]) => {
        this.tasks = tasks;
        this.taskTypes = taskTypes;
        this.progressTypes = progressTypes;
        this.workGroupTasks = workGroupTasks;
        this.activeWorkGroupId = activeGroupId;
        this.loading = false;
      },
      error => {
        console.error('Error loading tasks:', error);
        this.loading = false;
      }
    );
  }

  get hasActiveWorkGroup(): boolean {
    return !!this.activeWorkGroupId;
  }

  getAvailableTasks(): Task[] {
    // Filter out tasks that are already assigned to any work group
    const assignedTaskIds = this.workGroupTasks.map(wgt => wgt.task_id);
    return this.tasks.filter(task => !assignedTaskIds.includes(task.task_id));
  }

  onTaskAssigned(task: Task) {
    if (this.activeWorkGroupId) {
      this.dataService.addTaskToWorkGroup(this.activeWorkGroupId, task.task_id).subscribe(
        result => {
          if (result) {
            console.log('Task assigned to group:', result);
          }
        },
        error => console.error('Error assigning task:', error)
      );
    }
  }
}