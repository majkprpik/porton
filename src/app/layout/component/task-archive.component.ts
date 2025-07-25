import { TaskService } from './../../pages/service/task.service';
import { Component } from '@angular/core';
import { DataService, House, HouseType, Task, TaskType } from '../../pages/service/data.service';
import { TaskCardComponent } from '../../pages/daily-sheet/task-card';
import { DatePipe } from '@angular/common';
import { MultiSelect } from 'primeng/multiselect';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-task-archive',
  imports: [
    TaskCardComponent,
    DatePipe,
    MultiSelect,
    TranslateModule,
    FormsModule,
    InputTextModule,
  ],
  template: `
    <div class="archive-container">    
      <div class="title">
        <h1>{{ 'TASK-ARCHIVE.TITLE' | translate }}</h1>
      </div>    
      <div class="fields">
        <div class="field">
          <label for="location" class="font-bold block mb-2">{{ 'TASK-ARCHIVE.FIELDS.TASK-TYPES.TITLE' | translate }}</label>
          <p-multiselect 
            [options]="taskService.getAllTaskTypes()" 
            [(ngModel)]="selectedTaskTypes"
            optionLabel="task_type_name" 
            [placeholder]="'TASK-ARCHIVE.FIELDS.TASK-TYPES.SELECT-TYPE' | translate"
            [style]="{ width: '100%' }" 
            (onChange)="onMetricsSelect()"
            display="chip"
          >
            <ng-template let-group pTemplate="group">
              <div class="font-semibold text-primary">
                {{ group.name }} 
              </div>
            </ng-template>
            <ng-template let-item pTemplate="item">
              <span>{{ item.name }}</span>
            </ng-template>
          </p-multiselect>
        </div>

        <div class="field">
          <label for="location" class="font-bold block mb-2">{{ 'TASK-ARCHIVE.FIELDS.HOUSE-NUMBERS.TITLE' | translate }}</label>
          <input 
            type="text"
            pattern="[0-9]*"
            inputmode="numeric"
            pInputText 
            [style]="{ width: '100%' }" 
            [placeholder]="'TASK-ARCHIVE.FIELDS.HOUSE-NUMBERS.SEARCH-HOUSE-NUMBER' | translate" 
            [(ngModel)]="searchTerm"
            (input)="filterTasks()"
            [min]="0"
          >
        </div>
      </div>
      
      <div class="completed-tasks-container">
        @for(task of filteredTasks; track task.task_id; let i = $index){
          @if(i == 0 || !areDatesEqual(filteredTasks[i].created_at, filteredTasks[i-1].created_at)){
            <div class="date-separator">
              <div class="left-half-line"></div>
                <span>{{ task.created_at | date: 'dd MMM YYYY' }}</span>
              <div class="right-half-line"></div>
            </div>
          }

          <app-task-card
            [task]="task"
          >
          </app-task-card>
        }
      </div>
    </div>
  `,
  styles: `
    .archive-container {
      height: 90vh;
      background-color: var(--surface-card);
      border-radius: 10px;
      box-sizing: border-box;
      padding: 20px;
      overflow-y: auto;

      .fields{
        display: flex;
        flex-direction: row;
        width: 100%;
        gap: 20px;

        .field{
          width: 100%;
          padding-bottom: 20px;
        }
      }

      .completed-tasks-container{
        display: flex;
        flex-direction: row;
        gap: 5px;
        flex-wrap: wrap;

        .date-separator{
          width: 100%;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          padding-bottom: 10px;

          .left-half-line{
            height: 1px;
            background-color: var(--surface-ground); 
            width: 100%;
          }

          span{
            width: 210px;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            padding: 0px 10px 0 10px;
            color: var(--text-color-secondary);
          }

          .right-half-line{
            height: 1px;
            background-color: var(--surface-ground); 
            width: 100%;
          }
        }
      }
    }
  `
})
export class TaskArchiveComponent {
  tasks: Task[] = [];
  completedTasks: Task[] = [];
  filteredTasks: Task[] = [];

  selectedTaskTypes: TaskType[] = [];
  searchTerm: string = '';

  houses: House[] = [];

  constructor(
    private dataService: DataService,
    public taskService: TaskService,
  ) {
    combineLatest([
      this.dataService.tasks$,
      this.dataService.houses$
    ]).subscribe(([tasks, houses]) => {
      this.tasks = tasks;
      this.houses = houses;

      this.completedTasks = this.tasks
        .filter(task => this.taskService.isTaskCompleted(task))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      this.filteredTasks = this.completedTasks;
      this.filterTasks();
    });
  }

  areDatesEqual(date1: string, date2: string){
    return date1.split('T')[0] == date2.split('T')[0];
  }

  onMetricsSelect() {
    this.filterTasks();
  }

  filterTasks() {
    let result = this.completedTasks;

    if (this.selectedTaskTypes?.length) {
      result = result.filter(task =>
        this.selectedTaskTypes.some(stt => stt.task_type_id == task.task_type_id)
      );
    }

    if (this.searchTerm?.toString().trim() !== '') {
      const term = this.searchTerm.toString().toLowerCase();
      result = result.filter(task => {
        const house = this.houses.find(h => h.house_id == task.house_id);
        return house?.house_number?.toString().toLowerCase().includes(term);
      });
    }

    this.filteredTasks = result;
  }
}
