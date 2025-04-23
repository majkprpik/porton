import { Component } from '@angular/core';
import { TasksComponent } from './tasks';
import { WorkGroups } from './work-groups';
import { StaffComponent } from './staff';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { TaskService } from '../service/task.service';
import { DataService, House, Task, TaskProgressType, TaskType } from '../service/data.service';
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

      <p-dialog
        header="Detalji zadatka:" 
        [(visible)]="isModalVisible"
        [modal]="true"
        [style]="{ width: '30rem' }"
        [breakpoints]="{ '960px': '75vw', '641px': '90vw' }"
        (onHide)="resetDialog()"
      >
        <div class="details">
          <div>
            <span><b>Kućica:</b> {{getHouseForTask(task)?.house_number}}</span>
          </div>
  
          <div>
            <span><b>Tip:</b> {{getTaskTypeName(task)}}</span>
          </div>
  
          <div>
            <span><b>Status:</b> {{getTaskProgressTypeName(task)}}</span>
          </div>
  
          <div>
            <span><b>Opis:</b> {{task?.description}}</span>
          </div>

          @if(getTaskTypeName(task) == 'Popravak' && taskImages.length > 0){
            <div class="task-images">
              @for(image of taskImages; track image.name){
                <img [src]="image.url" [alt]="image.name">
              }
            </div>
          }
        </div>
      </p-dialog>
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
      min-width: 0; /* Prevent flex items from overflowing */
    }

    .work-groups {
      flex: 2;
      min-width: 0; /* Prevent flex items from overflowing */
    }
    
    /* Responsive layout for smaller screens */
    // @media screen and (max-width: 992px) {
    //   .container {
    //     flex-direction: column;
    //     height: auto;
    //   }
      
    //   .tasks, .staff, .work-groups {
    //     width: 100%;
    //     margin-left: 0;
    //     margin-bottom: 1rem;
    //   }
    // }

    p-dialog{
      .details{
        display: flex;
        flex-direction: column;
        gap: 10px;

        .task-images{
          width: 100%;
          display: flex;
          flex-direction: row;
          align-items: center;
          overflow-x: auto;
        }
      }
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
    private taskService: TaskService,
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

    this.taskService.$taskModalData.subscribe(res => {
      if(res){
        this.isModalVisible = true;
        this.task = res;

        if(this.getTaskTypeName(this.task) == 'Popravak'){
          this.getStoredImagesForTask(this.task);
        } else {
          this.taskImages = [];
        }
      } else {
        this.isModalVisible = false;
      }
    });
  }

  getHouseForTask(task: Task){
    if(task){
      return this.houses.find(house => house.house_id == task.house_id);
    }
    return;
  }

  getTaskTypeName(task: Task){
    if(task){
      return this.taskTypes.find(tt => tt.task_type_id == task.task_type_id)?.task_type_name;
    }
    return;
  }

  getTaskProgressTypeName(task: Task){
    if(task){
      return this.taskProgressTypes.find(tpt => tpt.task_progress_type_id == task.task_progress_type_id)?.task_progress_type_name;
    }
    return;
  }

  async getStoredImagesForTask(task: Task) {
    try {
      const fetchedImages = await this.dataService.getStoredImagesForTask(task.task_id);

      if (!fetchedImages || fetchedImages.length === 0) {
        console.warn('No images found.');
        this.taskImages = [];
        return;
      }

      this.taskImages = await Promise.all(fetchedImages.map(async (image: any) => {
        const url = await this.dataService.getPublicUrlForImage(`task-${task.task_id}/${image.name}`);
        return { name: image.name, url };
      }));

      this.taskImages;
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  }

  resetDialog(){
    this.taskService.$taskModalData.next(null);
  }
}
