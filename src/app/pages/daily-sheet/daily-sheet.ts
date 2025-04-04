import { Component } from '@angular/core';
import { TasksComponent } from './tasks';
import { WorkGroupsComponent } from './work-groups';
import { StaffComponent } from './staff';

@Component({
  selector: 'app-daily-sheet',
  imports: [TasksComponent, WorkGroupsComponent, StaffComponent],
  template: `
    <div class="container">
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
    .container {
      display: flex;
      height: calc(100vh - 8rem);
      width: 100%;
    }

    .tasks, .staff {
      flex: 1;
    }

    .staff {
      margin-left: 10px;
    }

    .work-groups {
      flex: 2;
      margin-left: 10px;
    }
  `
})
export class DailySheetComponent {

}
