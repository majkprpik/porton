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
            [canAssignTasks]="hasActiveWorkGroup">
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
      if(taskToRemove){
        let task = this.tasks.find(task => task.task_id == taskToRemove.task_id);
        
        // First make sure we have the progress types loaded
        if (this.progressTypes.length === 0) {
          this.dataService.taskProgressTypes$.subscribe(types => {
            this.progressTypes = types;
            this.updateTaskAfterRemoval(task, taskToRemove);
          });
        } else {
          this.updateTaskAfterRemoval(task, taskToRemove);
        }
      }
    });

    this.taskService.$selectedTask.subscribe(taskToAdd => {
      if(taskToAdd){
        if(this.activeWorkGroupId){
          this.workGroupTasks = [...this.workGroupTasks, {
            work_group_id: this.activeWorkGroupId,
            task_id: taskToAdd.task_id,
          }]
        }
      }
    });

    this.workGroupService.$workGroupToDelete.subscribe(workGroupToDelete => {
      if(workGroupToDelete){
        let workGroupTasksToDelete = this.workGroupTasks.filter(wgt => wgt.work_group_id == workGroupToDelete);
        this.tasks = this.tasks.map(task => {
          if (workGroupTasksToDelete.some(t => t.task_id === task.task_id)) {
            const notAssignedProgressType = this.progressTypes.find(pt => pt.task_progress_type_name === "Nije dodijeljeno");
            if (notAssignedProgressType) {
              return {
                ...task,
                task_progress_type_id: notAssignedProgressType.task_progress_type_id
              };
            }
          }
          return task;
        });
  
        this.workGroupTasks = this.workGroupTasks.filter(wgt => wgt.work_group_id != workGroupToDelete);
        
        this.dataService.setTasks(this.tasks);
        this.dataService.setWorkGroupTasks(this.workGroupTasks);
      }
    });

    this.workGroupService.activeGroupId$.subscribe(activeGroupId => {
      if(activeGroupId){
        this.activeWorkGroupId = activeGroupId;
      }
    });

    this.dataService.workGroupTasks$.subscribe(workGroupTasks => {
      if(workGroupTasks){
        this.workGroupTasks = workGroupTasks;
      }
    });

    combineLatest([
      this.dataService.tasks$,
      this.dataService.taskTypes$,
      this.dataService.taskProgressTypes$,
    ]).subscribe(
      ([tasks, taskTypes, progressTypes]) => {
        this.tasks = tasks;
        this.taskTypes = taskTypes;
        this.progressTypes = progressTypes;
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

  // Helper method to update task progress type after task removal
  private updateTaskAfterRemoval(task: Task | undefined, taskToRemove: any) {
    if (task) {
      const taskProgressType = this.progressTypes.find(progressType => 
        progressType.task_progress_type_name === "Nije dodijeljeno");
      
      if (taskProgressType) {
        // Update the local task
        task.task_progress_type_id = taskProgressType.task_progress_type_id;
        
        // Update the tasks array
        this.tasks = this.tasks.map(t => 
          t.task_id === task.task_id ? { ...t, task_progress_type_id: taskProgressType.task_progress_type_id } : t
        );
        
        // Remove from workGroupTasks
        this.workGroupTasks = this.workGroupTasks.filter(wgt => wgt.task_id != taskToRemove.task_id);
      }
    }
  }
}