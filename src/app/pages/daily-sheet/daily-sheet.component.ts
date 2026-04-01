import { Component, signal } from '@angular/core';
import { TasksComponent } from './tasks.component';
import { WorkGroups } from './work-groups.component';
import { StaffComponent } from './staff.component';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

type MobileTab = 'tasks' | 'groups' | 'staff';

@Component({
  selector: 'app-daily-sheet',
  standalone: true,
  imports: [
    CommonModule,
    TasksComponent,
    WorkGroups,
    StaffComponent,
    DialogModule,
    ButtonModule,
  ],
  template: `
    <div class="mobile-tabs">
      <button class="tab-btn" [class.active]="activeTab() === 'tasks'" (click)="activeTab.set('tasks')">
        <i class="pi pi-home"></i> Kućice
      </button>
      <button class="tab-btn" [class.active]="activeTab() === 'groups'" (click)="activeTab.set('groups')">
        <i class="pi pi-users"></i> Radne grupe
      </button>
      <button class="tab-btn" [class.active]="activeTab() === 'staff'" (click)="activeTab.set('staff')">
        <i class="pi pi-user"></i> Osoblje
      </button>
    </div>
    <div class="container-fluid">
      <div class="tasks" [class.mobile-hidden]="activeTab() !== 'tasks'">
        <app-tasks></app-tasks>
      </div>
      <div class="work-groups" [class.mobile-hidden]="activeTab() !== 'groups'">
        <app-work-groups></app-work-groups>
      </div>
      <div class="staff" [class.mobile-hidden]="activeTab() !== 'staff'">
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

    .mobile-tabs {
      display: none;
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

    @media (max-width: 768px) {
      .mobile-tabs {
        display: flex;
        flex-direction: row;
        border-bottom: 1px solid var(--glass-border);
        background: var(--glass-bg);
        backdrop-filter: blur(var(--glass-blur));

        .tab-btn {
          flex: 1;
          padding: 0.6rem 0.25rem;
          border: none;
          background: transparent;
          color: var(--text-color-secondary);
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.2rem;
          border-bottom: 2px solid transparent;
          transition: color 0.2s, border-color 0.2s;

          i {
            font-size: 1.1rem;
          }

          &.active {
            color: var(--primary-color);
            border-bottom-color: var(--primary-color);
          }
        }
      }

      .container-fluid {
        height: calc(100dvh - 56px - 52px);
        padding: 0;
        gap: 0;
        overflow: hidden;
      }

      .tasks, .work-groups, .staff {
        flex: 1 1 100%;
        min-width: 100%;
        transition: none;
      }

      .mobile-hidden {
        display: none !important;
      }
    }
  `
})
export class DailySheetComponent {
  activeTab = signal<MobileTab>('tasks');
}
