import { Component } from '@angular/core';
import { TasksComponent } from './tasks';
import { WorkGroups } from './work-groups';
import { StaffComponent } from './staff';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { DataService, House, TaskProgressType, TaskType } from '../service/data.service';
import { combineLatest } from 'rxjs';
@Component({
  selector: 'app-daily-sheet',
  standalone: true,
  imports: [
    CommonModule, 
    TasksComponent, 
    WorkGroups, 
    StaffComponent,
    DialogModule
  ],
  template: `
    <div class="container-fluid">
      <div class="tasks">
        <app-tasks></app-tasks>
      </div>
      <div class="work-groups">
        <app-work-groups></app-work-groups>
      </div>
      <div class="staff">
        <app-staff></app-staff>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    
    .container-fluid {
      display: flex;
      height: calc(100vh - 8rem);
      width: 100%;
      gap: 1rem;
      padding: 0 1rem;
      box-sizing: border-box;
    }

    .tasks, .staff {
      flex: 1;
      min-width: 0; 
    }

    .work-groups {
      flex: 2;
      min-width: 0; 
    }
  `
})
export class DailySheetComponent {
  isModalVisible = false;
  task: any;
  houses: House[] = [];
  taskTypes: TaskType[] = [];
  taskProgressTypes: TaskProgressType[] = [];
  taskImages: any;

  constructor(
    private dataService: DataService,
  ) {
        
  }

  ngOnInit(){
    combineLatest([
      this.dataService.houses$,
      this.dataService.taskTypes$,
      this.dataService.taskProgressTypes$,
    ]).subscribe({
      next: ([houses, taskTypes, taskProgressTypes,]) => {
        this.houses = houses;
        this.taskTypes = taskTypes;
        this.taskProgressTypes = taskProgressTypes;
      },
      error: (error) => {
        console.error(error);
      }
    });
  }
}
