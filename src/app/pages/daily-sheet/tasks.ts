import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TaskGroupComponent } from './task-group';
import { DataService, Task, TaskType, TaskProgressType } from '../service/data.service';
import { WorkGroupService } from './work-group.service';
import { combineLatest, forkJoin } from 'rxjs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TaskService } from '../service/task.service';

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
    private workGroupService: WorkGroupService,
    private taskService: TaskService,
  ) {}

  ngOnInit() {
    this.taskService.$taskToRemove.subscribe(taskToRemove => {
      let task = this.tasks.find(task => task.task_id == taskToRemove.task_id);
      let taskProgressType = this.progressTypes.find(taksProgressType => taksProgressType.task_progress_type_name == "Nije dodijeljeno");
      if(task && taskProgressType){
        task.task_progress_type_id = taskProgressType.task_progress_type_id;

        this.tasks = this.tasks.map(t => 
          t.task_id === task.task_id ? { ...t, task_progress_type_id: taskProgressType.task_progress_type_id } : t
        );

        this.workGroupTasks = this.workGroupTasks.filter(wgt => wgt.task_id != taskToRemove.task_id);
      }
    });

    this.taskService.$selectedTask.subscribe(taskToAdd => {
      if(this.activeWorkGroupId){
        this.workGroupTasks = [...this.workGroupTasks, {
          work_group_id: this.activeWorkGroupId,
          task_id: taskToAdd.task_id,
        }]
      }
    });

    this.workGroupService.activeGroupId$.subscribe(activeGroupId => {
      this.activeWorkGroupId = activeGroupId;
    });

    combineLatest([
      this.dataService.tasks$,
      this.dataService.taskTypes$,
      this.dataService.taskProgressTypes$,
      this.dataService.workGroupTasks$,
    ]).subscribe(
      ([tasks, taskTypes, progressTypes, workGroupTasks]) => {
        this.tasks = tasks;
        this.taskTypes = taskTypes;
        this.progressTypes = progressTypes;
        this.workGroupTasks = workGroupTasks;
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
      this.taskService.$selectedTask.next(task);

      const nijeDodijeljenoType = this.progressTypes.find(
        type => type.task_progress_type_name === 'Nije dodijeljeno'
      );

      if (!nijeDodijeljenoType) {
        console.error('Could not find progress type "Nije dodijeljeno"');
        return;
      }

      // // Create an array of operations to perform
      // const operations = [
      //   // Add task to work group
      //   this.dataService.addTaskToWorkGroup(this.activeWorkGroupId, task.task_id),
      //   // Update task progress type to "Nije dodijeljeno"
      //   this.dataService.updateTaskProgressType(task.task_id, nijeDodijeljenoType.task_progress_type_id),
      //   // Set work group to unlocked
      //   this.dataService.updateWorkGroupLocked(this.activeWorkGroupId, false)
      // ];

      // // Execute all operations
      // forkJoin(operations).subscribe({
      //   next: ([workGroupTask, updatedTask]) => {
      //     //console.log('Task assigned and updated:', { workGroupTask, updatedTask });
      //   },
      //   error: error => console.error('Error assigning task:', error)
      // });
    }
  }
}