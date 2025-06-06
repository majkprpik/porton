import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TaskGroupComponent } from './task-group';
import { DataService, Task, TaskType, TaskProgressType, House } from '../service/data.service';
import { combineLatest } from 'rxjs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TaskService } from '../service/task.service';
import { WorkGroupService } from '../service/work-group.service';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule, 
    TaskGroupComponent, 
    ProgressSpinnerModule, 
    TranslateModule,
    FormsModule,
    InputTextModule,
    ButtonModule, 
  ],
  template: `
    @if (loading) {
      <div class="loading-container">
        <p-progressSpinner strokeWidth="4" [style]="{ width: '50px', height: '50px' }" />
        <span>{{ 'DAILY-SHEET.WORK-GROUPS.LOADING-TASKS' | translate }}</span>
      </div>
    } @else {
      <div class="tasks-container">
        <div class="house-controls">
          <div class="search-container">
            <input 
              type="text"
              pattern="[0-9]*"
              inputmode="numeric"
              pInputText 
              [placeholder]="'DAILY-SHEET.TASKS.SEARCH-TASKS' | translate" 
              [(ngModel)]="searchTerm"
              (input)="applyFilters()"
              [min]="0"
            >
          </div>
        </div>
        @for (taskType of taskTypes; track taskType.task_type_id) {
          <app-task-group 
            [taskType]="taskType"
            [tasks]="filteredTasks"
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
      gap: 5px;
      padding: 1rem;
      scrollbar-gutter: stable;

      .house-controls{
        padding-bottom: 10px;
        display: flex;
        flex-direction: row; 
        align-items: center;
        justify-content: space-between;

        .search-container{
          width: 100%;

          input{
            width: 100%;
          }
        }
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
  searchTerm: string = '';
  houses: House[] = [];
  filteredTasks: Task[] = [];

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
          }];

          const assignedTaskProgressType = this.progressTypes.find(progressType => progressType.task_progress_type_name === "Dodijeljeno");
      
          if (assignedTaskProgressType) {
            this.tasks = this.tasks.map(t => 
              t.task_id === taskToAdd.task_id ? { 
                ...t, 
                task_progress_type_id: assignedTaskProgressType.task_progress_type_id 
              } : t
            );
          }
          
          this.dataService.setTasks(this.tasks);
        }
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
      this.dataService.houses$,
    ]).subscribe(
      ([tasks, taskTypes, progressTypes, houses]) => {
        this.tasks = tasks;
        this.taskTypes = taskTypes;
        this.progressTypes = progressTypes;
        this.houses = houses;
        this.loading = false;

        this.applyFilters();
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
      const notAssignedTaskProgressType = this.progressTypes.find(progressType => progressType.task_progress_type_name === "Nije dodijeljeno");
      
      if (notAssignedTaskProgressType) {
        task.task_progress_type_id = notAssignedTaskProgressType.task_progress_type_id;
        
        this.tasks = this.tasks.map(t => 
          t.task_id === task.task_id ? { ...t, task_progress_type_id: notAssignedTaskProgressType.task_progress_type_id } : t
        );

        this.workGroupTasks = this.workGroupTasks.filter(wgt => wgt.task_id != taskToRemove.task_id);
        this.dataService.setWorkGroupTasks(this.workGroupTasks);
        this.dataService.setTasks(this.tasks);
      }
    }
  }

  applyFilters(){
    let result = this.getAvailableTasks();
  
    if (this.searchTerm || parseInt(this.searchTerm) == 0) {
      result = result.filter(task => {
        const house = this.houses.find(house => house.house_id === task.house_id);
        return house?.house_number?.toString().toLowerCase().includes(this.searchTerm);
      });

      this.filteredTasks = result;
    } else {
      this.filteredTasks = this.getAvailableTasks();
    }
  }
}