import { Component } from '@angular/core';
import { TasksComponent } from './tasks';
import { WorkGroups } from './work-groups';
import { StaffComponent } from './staff';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-daily-sheet',
  standalone: true,
  imports: [CommonModule, TasksComponent, WorkGroups, StaffComponent],
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
  `
})
export class DailySheetComponent {

}
