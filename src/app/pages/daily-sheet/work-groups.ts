import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { WorkGroup } from './work-group';
import { DataService, Task, Profile, LockedTeam } from '../service/data.service';
import { WorkGroupService } from './work-group.service';
import { combineLatest } from 'rxjs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { map, take } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-work-groups',
  standalone: true,
  imports: [CommonModule, ButtonModule, WorkGroup, ProgressSpinnerModule],
  template: `
    @if (loading) {
      <div class="loading-container">
        <p-progressSpinner strokeWidth="4" [style]="{ width: '50px', height: '50px' }" />
        <span>Učitavanje radnih grupa...</span>
      </div>
    } @else {
      <div class="work-groups-container">
        <div class="work-groups-header">
          <h2>Radne Grupe</h2>
          <div class="header-actions">
            <p-button 
              label="Nova Grupa" 
              icon="pi pi-plus"
              severity="secondary"
              (onClick)="createWorkGroup()"
            ></p-button>
            <p-button 
              label="OBJAVI" 
              icon="pi pi-check"
              (onClick)="publishWorkGroups()"
            ></p-button>
          </div>
        </div>

        <div class="work-groups-list" [class.has-active-group]="activeGroupId !== undefined">
          @if (workGroups.length === 0) {
            <div class="empty-state">
              <p>Nema kreiranih radnih grupa</p>
            </div>
          } @else {
            <div class="groups-container">
              @for (group of workGroups; track group.work_group_id) {
                <div class="group-wrapper">
                  <app-work-group
                    [workGroup]="group"
                    [isActive]="group.work_group_id == activeGroupId"
                    [assignedTasks]="getAssignedTasks(group.work_group_id)"
                    [assignedStaff]="getAssignedStaff(group.work_group_id)"
                    (groupSelected)="setActiveGroup(group.work_group_id)"
                    (deleteClicked)="deleteWorkGroup(group.work_group_id)"
                    (taskRemoved)="onTaskRemoved($event)"
                    (staffRemoved)="onStaffRemoved($event)"
                    [class.inactive]="activeGroupId !== undefined && group.work_group_id !== activeGroupId"
                  ></app-work-group>
                </div>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: `
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 1rem;
      color: var(--text-color-secondary);
    }

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

    .empty-state {
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
  allTasks: Task[] = [];
  lockedTeams: LockedTeam[] = [];
  init = true;
  taskProgressTypes: any;

  constructor(
    private dataService: DataService,
    private workGroupService: WorkGroupService,
    private router: Router
  ) {}

  ngOnInit() {
    // Use combineLatest to wait for all required data
    combineLatest([
      this.workGroupService.activeGroupId$,
      this.dataService.workGroups$,
      this.dataService.workGroupTasks$,
      this.dataService.tasks$,
      this.dataService.workGroupProfiles$,
      this.dataService.profiles$,
      this.dataService.taskProgressTypes$
    ]).subscribe({
      next: ([activeGroupId, workGroups, workGroupTasks, tasks, workGroupProfiles, profiles, taskProgressTypes]) => {
        this.activeGroupId = activeGroupId;
        this.workGroups = workGroups;
        this.allTasks = tasks;
        this.taskProgressTypes = taskProgressTypes;
        
        // Map work group tasks
        this.workGroupTasks = {};
        workGroupTasks.forEach(workGroupTask => {
          if (!this.workGroupTasks[workGroupTask.work_group_id]) {
            this.workGroupTasks[workGroupTask.work_group_id] = [];
          }
          const task = tasks.find(t => t.task_id === workGroupTask.task_id);
          if (task) {
            if(task.task_progress_type_id == this.taskProgressTypes.find((taskProgressType: any) => taskProgressType.task_progress_type_name == "Nije dodijeljeno").task_progress_type_id){
              task.task_progress_type_id = this.taskProgressTypes.find((taskProgressType: any) => taskProgressType.task_progress_type_name == "Dodijeljeno").task_progress_type_id;
            }
            this.workGroupTasks[workGroupTask.work_group_id].push(task);
          }
        });

        // Map work group staff
        this.workGroupStaff = {};
        workGroupProfiles.forEach(assignment => {
          if (!this.workGroupStaff[assignment.work_group_id]) {
            this.workGroupStaff[assignment.work_group_id] = [];
          }
          const profile = profiles.find(p => p.id === assignment.profile_id);
          if (profile) {
            this.workGroupStaff[assignment.work_group_id].push(profile);
          }
        });

        if(workGroups.length > 0 && workGroupProfiles.length > 0 && workGroupTasks.length > 0){
          if(!this.workGroups.some(workGroup => this.lockedTeams.some(lockedTeam => parseInt(lockedTeam.id) == workGroup.work_group_id))){
            this.workGroups.forEach(workGroup => {
              this.lockedTeams.push({
                id: workGroup.work_group_id.toString(),
                name: "Team " + workGroup.work_group_id.toString(),
                members: this.workGroupStaff[workGroup.work_group_id],
                tasks: this.workGroupTasks[workGroup.work_group_id],
                homes: [],
                isLocked: activeGroupId != workGroup.work_group_id,       
              });
            });
            
            this.workGroupService.setLockedTeams(this.lockedTeams);
          }
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading work groups data:', error);
        this.loading = false;
      }
    });
  }

  getAssignedTasks(workGroupId: number): Task[] {
    let lockedTeam = this.workGroupService.getLockedTeams().find(lockedTeam => parseInt(lockedTeam.id) == workGroupId);

    if(lockedTeam && lockedTeam.tasks){
      console.log(lockedTeam);
    }

    if(lockedTeam?.tasks){
      return lockedTeam?.tasks || [];
    }

    return [];
  }

  getAssignedStaff(workGroupId: number): Profile[] {
    return this.workGroupStaff[workGroupId] || [];
  }

  setActiveGroup(workGroupId: number) {
    this.workGroupService.setActiveGroup(workGroupId);
  }

  createWorkGroup() {
    this.dataService.createWorkGroup().subscribe({
      next: (workGroup) => {
        if (workGroup) {
          this.setActiveGroup(workGroup.work_group_id);
        }
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
    
    // Get the tasks that will be removed from this work group
    const tasksToReturn = this.getAssignedTasks(workGroupId);
    
    // Get the progress type ID for "Nije dodijeljeno"
    this.dataService.taskProgressTypes$.pipe(
      map(types => types.find(type => type.task_progress_type_name === 'Nije dodijeljeno')),
      take(1)
    ).subscribe(nijeDodijeljenoType => {
      if (!nijeDodijeljenoType) {
        console.error('Could not find progress type "Nije dodijeljeno"');
        return;
      }
      
      // Create operations to update task progress types
      const updateOperations = tasksToReturn.map(task => 
        this.dataService.updateTaskProgressType(task.task_id, nijeDodijeljenoType.task_progress_type_id)
      );
      
      // Delete the work group
      this.dataService.deleteWorkGroup(workGroupId).subscribe({
        next: () => {
          // After work group is deleted, update all tasks to "Nije dodijeljeno"
          if (updateOperations.length > 0) {
            forkJoin(updateOperations).subscribe({
              next: () => {
                console.log(`Updated ${updateOperations.length} tasks to "Nije dodijeljeno"`);
                
                // Refresh the local state
                this.refreshData();
              },
              error: (error) => {
                console.error('Error updating tasks after work group deletion:', error);
              }
            });
          } else {
            // If no tasks to update, still refresh the data
            this.refreshData();
          }
        },
        error: (error: Error) => {
          console.error('Error deleting work group:', error);
        }
      });
    });
  }
  
  // Helper method to refresh all data
  refreshData() {
    // Reload tasks and work group tasks
    forkJoin([
      this.dataService.loadTasks(),
      this.dataService.loadWorkGroupTasks()
    ]).subscribe({
      next: () => {
        console.log('Data refreshed after work group deletion');
      },
      error: (error) => {
        console.error('Error refreshing data:', error);
      }
    });
  }

  onTaskRemoved(task: Task) {
    // Refresh the tasks list for the active group
    if (this.activeGroupId) {
      const tasks = this.getAssignedTasks(this.activeGroupId);
      const updatedTasks = tasks.filter(t => t.task_id !== task.task_id);
      this.workGroupTasks[this.activeGroupId] = updatedTasks;
    }
  }

  onStaffRemoved(staff: Profile) {
    // Refresh the staff list for the active group
    if (this.activeGroupId && staff.id) {
      const staffList = this.getAssignedStaff(this.activeGroupId);
      const updatedStaff = staffList.filter(s => s.id !== staff.id);
      this.workGroupStaff[this.activeGroupId] = updatedStaff;
    }
  }

  async publishWorkGroups() {
    let lockedWorkGroups = this.workGroupService.getLockedTeams();

    for (const lockedWorkGroup of lockedWorkGroups) {
      const isLocked = await this.workGroupService.lockWorkGroup(parseInt(lockedWorkGroup.id));
      console.log('Locked:', isLocked);
    }
  
    for (const lockedWorkGroup of lockedWorkGroups) {
      const isDeleted = await this.workGroupService.deleteAllWorkGroupTasksByWorkGroupId(parseInt(lockedWorkGroup.id));
      console.log('Deleted:', isDeleted);
    }
  
    for (const lockedWorkGroup of lockedWorkGroups) {
      if(!lockedWorkGroup.tasks){
        lockedWorkGroup.tasks = [];
      }

      for (const [index, task] of lockedWorkGroup.tasks.entries()) {
        const isCreated = await this.workGroupService.createWorkGroupTask(parseInt(lockedWorkGroup.id), task.task_id, index);
        console.log('Created:', isCreated);
      }
    }
    
    window.location.reload();
  }
} 