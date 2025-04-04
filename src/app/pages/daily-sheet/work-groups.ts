import { Component } from '@angular/core';
import { WorkGroup } from './work-group';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-work-groups',
  imports: [WorkGroup, ButtonModule],
  template: `
    <div class="work-groups-container">
      <div class="work-groups-header">
        <h2>Teams</h2>
        <div class="header-actions">
          <p-button label="Create New Team" icon="pi pi-plus" severity="secondary"></p-button>
          <p-button label="Publish" icon="pi pi-check" severity="success"></p-button>
        </div>
      </div>
      <div class="work-groups-list">
        <app-work-group></app-work-group>
        <app-work-group></app-work-group>
        <app-work-group></app-work-group>
      </div>
    </div>
  `,
  styles: `
    .work-groups-container {
      background-color: var(--surface-card);
      border-radius: 8px;
      padding: 1.5rem;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .work-groups-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .work-groups-list {
      flex: 1;
      overflow-y: auto;
      padding-right: 0.5rem;
    }
  `
})
export class WorkGroupsComponent {

} 