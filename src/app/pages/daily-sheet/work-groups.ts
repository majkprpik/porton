import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { WorkGroup } from './work-group';
import { DataService, Task, Profile } from '../service/data.service';
import { WorkGroupService } from './work-group.service';

@Component({
  selector: 'app-work-groups',
  standalone: true,
  imports: [CommonModule, ButtonModule, WorkGroup],
  template: `
    <div class="work-groups-container">
      <div class="work-groups-header">
        <h2>Work Groups</h2>
        <div class="header-actions">
          <p-button 
            label="Create Work Group" 
            icon="pi pi-plus"
            severity="secondary"
            (onClick)="createWorkGroup()"
          ></p-button>
          <p-button 
            label="Publish" 
            icon="pi pi-check"
            (onClick)="publishWorkGroups()"
          ></p-button>
        </div>
      </div>

      <div class="work-groups-list" [class.has-active-group]="activeGroupId !== undefined">
        @if (loading) {
          <div class="loading-state">
            <i class="pi pi-spin pi-spinner"></i>
            <span>Loading work groups...</span>
          </div>
        } @else {
          @if (workGroups.length === 0) {
            <div class="empty-state">
              <p>No work groups created yet.</p>
            </div>
          } @else {
            <div class="groups-container">
              @for (group of workGroups; track group.work_group_id) {
                <div class="group-wrapper">
                  <app-work-group
                    [workGroup]="group"
                    [isActive]="group.work_group_id === activeGroupId"
                    [assignedTasks]="getAssignedTasks(group.work_group_id)"
                    [assignedStaff]="getAssignedStaff(group.work_group_id)"
                    (groupSelected)="setActiveGroup(group.work_group_id)"
                    (deleteClicked)="deleteWorkGroup(group.work_group_id)"
                    [class.inactive]="activeGroupId !== undefined && group.work_group_id !== activeGroupId"
                  ></app-work-group>
                </div>
              }
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: `
    .work-groups-container {
      height: 100%;
      padding: 1rem;
      background-color: var(--surface-card);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
    }

    .work-groups-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;

      h2 {
        margin: 0;
        color: var(--text-color);
        font-size: 1.5rem;
        font-weight: 600;
      }

      .header-actions {
        display: flex;
        gap: 0.5rem;
      }
    }

    .work-groups-list {
      flex: 1;
      overflow-y: auto;
      padding-right: 0.5rem;

      &.has-active-group {
        :host ::ng-deep {
          app-work-group {
            transition: opacity 0.3s ease;

            &.inactive {
              opacity: 0.6;

              &:hover {
                opacity: 0.8;
              }
            }
          }
        }
      }
    }

    .groups-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .group-wrapper {
      position: relative;
    }

    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: var(--text-color-secondary);
      text-align: center;

      i {
        font-size: 2rem;
        margin-bottom: 1rem;
      }

      p {
        margin: 0;
      }
    }
  `
})
export class WorkGroups implements OnInit {
  loading = true;
  workGroups: { work_group_id: number; is_locked: boolean }[] = [];
  activeGroupId?: number;
  workGroupTasks: { [key: number]: Task[] } = {};
  workGroupStaff: { [key: number]: Profile[] } = {};

  constructor(
    private dataService: DataService,
    private workGroupService: WorkGroupService
  ) {}

  ngOnInit() {
    this.workGroupService.activeGroupId$.subscribe(
      groupId => {
        this.activeGroupId = groupId;
      }
    );

    this.dataService.workGroups$.subscribe(
      workGroups => {
        this.workGroups = workGroups;
        this.loading = false;
      }
    );

    this.dataService.workGroupTasks$.subscribe(
      workGroupTasks => {
        this.workGroupTasks = {};
        workGroupTasks.forEach(workGroupTask => {
          if (!this.workGroupTasks[workGroupTask.work_group_id]) {
            this.workGroupTasks[workGroupTask.work_group_id] = [];
          }
          const task = this.dataService.getTaskById(workGroupTask.task_id);
          if (task) {
            this.workGroupTasks[workGroupTask.work_group_id].push(task);
          }
        });
      }
    );

    this.dataService.workGroupProfiles$.subscribe(
      assignments => {
        this.workGroupStaff = {};
        assignments.forEach(assignment => {
          if (!this.workGroupStaff[assignment.work_group_id]) {
            this.workGroupStaff[assignment.work_group_id] = [];
          }
          const profile = this.dataService.getProfileById(assignment.profile_id);
          if (profile) {
            this.workGroupStaff[assignment.work_group_id].push(profile);
          }
        });
      }
    );
  }

  getAssignedTasks(workGroupId: number): Task[] {
    return this.workGroupTasks[workGroupId] || [];
  }

  getAssignedStaff(workGroupId: number): Profile[] {
    return this.workGroupStaff[workGroupId] || [];
  }

  setActiveGroup(groupId: number) {
    if (this.activeGroupId === groupId) {
      this.workGroupService.setActiveGroup(undefined);
    } else {
      this.workGroupService.setActiveGroup(groupId);
    }
  }

  createWorkGroup() {
    this.dataService.createWorkGroup().subscribe({
      next: () => {
        //console.log('Work group created successfully');
      },
      error: (error) => {
        console.error('Error creating work group:', error);
      }
    });
  }

  deleteWorkGroup(workGroupId: number) {
    if (this.activeGroupId === workGroupId) {
      this.workGroupService.setActiveGroup(undefined);
    }
    this.dataService.deleteWorkGroup(workGroupId).subscribe({
      next: () => {
        //console.log('Work group deleted successfully');
      },
      error: (error: Error) => {
        console.error('Error deleting work group:', error);
      }
    });
  }

  publishWorkGroups() {
    const workGroupIds = this.workGroups.map(group => group.work_group_id);
    this.dataService.publishWorkGroups(workGroupIds).subscribe({
      next: () => {
        //console.log('Work groups published successfully');
        this.workGroupService.setActiveGroup(undefined);
      },
      error: (error) => {
        console.error('Error publishing work groups:', error);
      }
    });
  }
} 