import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TaskGroupComponent } from './task-group';
import { DataService, Task, TaskType, TaskProgressType } from '../service/data.service';
import { WorkGroupService } from './work-group.service';
import { combineLatest, forkJoin } from 'rxjs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, TaskGroupComponent, ProgressSpinnerModule],
  template: `
    @if (loading) {
      <div class="loading-container">
        <p-progressSpinner strokeWidth="4" [style]="{ width: '50px', height: '50px' }" />
        <span>Loading tasks...</span>
      </div>
    } @else {
      <div class="tasks-container">
        @for (taskType of taskTypes; track taskType.task_type_id) {
          <app-task-group 
            [taskType]="taskType"
            [tasks]="getAvailableTasks()"
            [canAssignTasks]="hasActiveWorkGroup"
            (taskAssigned)="onTaskAssigned($event)">
          </app-task-group>
        }
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 1rem;
      color: var(--text-color-secondary);
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
    const assignedTaskIds = this.workGroupTasks.map(wgt => wgt.task_id);
    return this.tasks.filter(task => !assignedTaskIds.includes(task.task_id));
  }

  onTaskAssigned(task: Task) {
    if (this.activeWorkGroupId) {
      const nijeDodijeljenoType = this.progressTypes.find(
        type => type.task_progress_type_name === 'Nije dodijeljeno'
      );

      if (!nijeDodijeljenoType) {
        console.error('Could not find progress type "Nije dodijeljeno"');
        return;
      }

      // Create an array of operations to perform
      const operations = [
        // Add task to work group
        this.dataService.addTaskToWorkGroup(this.activeWorkGroupId, task.task_id),
        // Update task progress type to "Nije dodijeljeno"
        this.dataService.updateTaskProgressType(task.task_id, nijeDodijeljenoType.task_progress_type_id)
      ];

      // Execute both operations
      forkJoin(operations).subscribe({
        next: ([workGroupTask, updatedTask]) => {
          //console.log('Task assigned and updated:', { workGroupTask, updatedTask });
        },
        error: error => console.error('Error assigning task:', error)
      });
    }
  }
}