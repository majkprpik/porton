import { TaskProgressType, WorkGroup as WorkGroupObject, WorkGroupProfile, WorkGroupTask } from './../service/data.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { WorkGroup } from './work-group';
import { DataService, Task, Profile, LockedTeam } from '../service/data.service';
import { combineLatest, from, of } from 'rxjs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { WorkGroupService } from '../service/work-group.service';
import { TaskService } from '../service/task.service';
import { PanelModule } from 'primeng/panel';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-work-groups',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule, 
    WorkGroup, 
    ProgressSpinnerModule,
    PanelModule,
    TranslateModule
  ],
  template: `
    @if (loading) {
      <div class="loading-container">
        <p-progressSpinner strokeWidth="4" [style]="{ width: '50px', height: '50px' }" />
        <span>{{ 'DAILY-SHEET.WORK-GROUPS.LOADING' | translate }}</span>
      </div>
    } @else {
      <div class="work-groups-container">
        <div class="work-groups-header">
          <h2>{{ 'DAILY-SHEET.WORK-GROUPS.TITLE' | translate }}</h2>
          <div class="header-actions">
            <p-button 
              [label]="'DAILY-SHEET.WORK-GROUPS.PUBLISH' | translate" 
              icon="pi pi-check"
              (onClick)="publishWorkGroups()"
            ></p-button>
          </div>
        </div>

        <p-panel
          [toggleable]="true"
          class="cleaning-group"
          [(collapsed)]="isCleaningCollapsed"
        >
          <ng-template pTemplate="header" class="work-group-container-header">
            <div class="left-side">
              <span class="group-name">{{ 'DAILY-SHEET.WORK-GROUPS.CLEANING' | translate }}</span>
              <span class="work-groups-count">{{workGroupService.getNumberOfCleaningWorkGroups(workGroups)}}</span>
            </div>
            
            @if(!isCleaningCollapsed){
              <p-button 
                class="add-new-group-button"
                [label]="'DAILY-SHEET.WORK-GROUPS.NEW-GROUP' | translate" 
                icon="pi pi-plus"
                severity="secondary"
                (onClick)="createWorkGroup(false)"
              ></p-button>
            }
          </ng-template>

          <div class="work-groups-list" [class.has-active-group]="activeGroupId !== undefined">
            @if (!workGroupService.getNumberOfCleaningWorkGroups(workGroups)) {
              <div class="empty-state">
                <p>{{ 'DAILY-SHEET.WORK-GROUPS.NO-CLEANING-GROUPS' | translate }}</p>
              </div>
            } @else {
              <div class="groups-container">
                @for (group of cleaningGroups; track group.work_group_id; let i = $index) {
                  @if(i == 0 || !areDaysEqual(cleaningGroups[i].created_at, cleaningGroups[i-1].created_at)){
                    <div class="date-separator">
                      <div class="left-half-line"></div>
                      @if(isToday(group.created_at)){
                        <span>{{ 'DAILY-SHEET.WORK-GROUPS.TODAY' | translate }}</span>
                      } @else {
                        <span>{{ group.created_at | date: 'dd MMM YYYY' }}</span>
                      }
                      <div class="right-half-line"></div>
                    </div>
                  }
                  <div class="group-wrapper">
                    <app-work-group
                      [workGroup]="group"
                      [isActive]="group.work_group_id == activeGroupId"
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
          </div>
        </p-panel>

        <p-panel
          [toggleable]="true"
          class="cleaning-group"
          [(collapsed)]="isRepairsCollapsed"
        >
          <ng-template pTemplate="header" class="work-group-container-header">
            <div class="left-side">
              <span class="group-name">{{ 'DAILY-SHEET.WORK-GROUPS.REPAIRS' | translate }}</span>
              <span class="work-groups-count">{{workGroupService.getNumberOfRepairWorkGroups(workGroups)}}</span>
            </div>
            
            @if(!isRepairsCollapsed){
              <p-button 
                class="add-new-group-button"
                [label]="'DAILY-SHEET.WORK-GROUPS.NEW-GROUP' | translate" 
                icon="pi pi-plus"
                severity="secondary"
                (onClick)="createWorkGroup(true)"
              ></p-button>
            }
          </ng-template>
          
          <div class="work-groups-list" [class.has-active-group]="activeGroupId !== undefined">
            @if (!workGroupService.getNumberOfRepairWorkGroups(workGroups)) {
              <div class="empty-state">
                <p>{{ 'DAILY-SHEET.WORK-GROUPS.NO-REPAIR-GROUPS' | translate }}</p>
              </div>
            } @else {
              <div class="groups-container">
                @for (group of repairGroups; track group.work_group_id; let i = $index) {
                  @if(i == 0 || !areDaysEqual(repairGroups[i].created_at, repairGroups[i-1].created_at)){
                    <div class="date-separator">
                      <div class="left-half-line"></div>
                      @if(isToday(group.created_at)){
                        <span>Danas</span>
                      } @else {
                        <span>{{ group.created_at | date: 'dd MMM YYYY' }}</span>
                      }
                      <div class="right-half-line"></div>
                    </div>
                  }
                  <div class="group-wrapper">
                    <app-work-group
                      [workGroup]="group"
                      [isActive]="group.work_group_id == activeGroupId"
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
          </div>
        </p-panel>
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
      padding-left: 30px;
      background-color: var(--surface-card);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      scrollbar-gutter: stable;
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

    :host ::ng-deep {
      .cleaning-group {
        margin-bottom: 0.5rem;

        .left-side{
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 10px;

          .work-groups-count {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 1.5rem;
            height: 1.5rem;
            padding: 0 0.5rem;
            background: var(--primary-color);
            color: var(--primary-color-text);
            border-radius: 1rem;
            font-size: 0.75rem;
            font-weight: 700;
          }
        }

        .work-group-header-actions{
          width: 100%;
          margin-bottom: 1rem;
        }

        .p-panel {
          background: transparent;
          margin-bottom: 0.5rem;
        }

        .p-panel-header {
          padding: 0.75rem 1.25rem;
          border: none;
          border-radius: 6px;
          background: var(--surface-ground);
          height: 45px;

          .add-new-group-button{
            margin-right: 70px;
          }
        }

        .p-panel-content {
          padding: 1rem;
          border: none;
          background: transparent !important;
        }

        .p-panel-icons {
          order: 2;
        }
      }

      .group-icon {
        font-size: 1.2rem;
        color: var(--text-color);
      }

      .group-name {
        font-weight: 500;
        color: var(--text-color);
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

      .date-separator{
        width: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;

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
  workGroups: WorkGroupObject[] = [];
  activeGroupId?: number;
  workGroupTasks: { [key: number]: Task[] } = {};
  workGroupStaff: { [key: number]: Profile[] } = {};
  allTasks: Task[] = [];
  lockedTeams: LockedTeam[] = [];
  taskProgressTypes: TaskProgressType[] = [];
  wgt: any[] = [];
  isRepairsCollapsed: boolean = true;
  isCleaningCollapsed: boolean = false;
  tasksToRemove: Task[] = [];

  get cleaningGroups() {
    return this.workGroups
      .filter(g => !g.is_repair)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  get repairGroups() {
    return this.workGroups
      .filter(g => g.is_repair)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  constructor(
    private dataService: DataService,
    public workGroupService: WorkGroupService,
    private taskService: TaskService,
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
      next: (data) => {
        this.handleDataAsync(data).catch(error => {
          console.error('Error processing work groups data:', error);
          this.loading = false;
        });
      },
      error: (error) => {
        console.error('Error loading work groups data:', error);
        this.loading = false;
      }
    });

    this.dataService.$tasksUpdate.subscribe(res => {
      if(res && res.eventType == 'UPDATE'){
        let lockedTeam = this.lockedTeams.find(lt => lt.tasks?.some(task => task.task_id == res.new.task_id));
        let taskIndex = lockedTeam?.tasks?.findIndex(task => task.task_id == res.new.task_id) ?? -1;
        let updatedLockedTeam: any;

        if(taskIndex != -1 && lockedTeam?.tasks){
          const updatedTasks = [...lockedTeam.tasks.slice(0, taskIndex), res.new, ...lockedTeam.tasks.slice(taskIndex + 1)];
          updatedLockedTeam = { ...lockedTeam, tasks: updatedTasks };
  
          this.lockedTeams = this.lockedTeams.map(lt =>
            lt.id === lockedTeam.id ? updatedLockedTeam : lt
          );
        }

        this.workGroupService.setLockedTeams(this.lockedTeams);
      }
    });

    this.dataService.$workGroupsUpdate.subscribe(res => {
      if(res && res.eventType == 'INSERT'){
        if(!this.workGroups.find((wgp: any) => wgp.work_group_id == res.new.work_group_id)){
          this.lockedTeams = [...this.lockedTeams, {
            id: res.new.work_group_id,
            name: "Team " + res.new.work_group_id.toString(),
            members: [],
            tasks: [],
            homes: [],
            isLocked: res.new.is_locked,
          }];

          this.workGroupService.setLockedTeams(this.lockedTeams);
        }
      } else if(res && res.eventType == 'UPDATE'){
        if(res.new.is_locked){
          if(this.activeGroupId == res.new.work_group_id){
            this.workGroupService.setActiveGroup(undefined);
          }
        }
      }
    });

    this.taskService.$taskToRemove.subscribe(res => {
      if(res){
        this.tasksToRemove.push(res);
      }
    });

    this.taskService.$selectedTask.subscribe(res => {
      if(res){
        this.tasksToRemove = this.tasksToRemove.filter(ttrm => ttrm.task_id != res.task_id);
      }
    })
  }

  private async handleDataAsync([
    activeGroupId,
    workGroups,
    workGroupTasks,
    tasks,
    workGroupProfiles,
    profiles,
    taskProgressTypes
  ]: [
    number | undefined,
    WorkGroupObject[],
    WorkGroupTask[],
    Task[],
    WorkGroupProfile[],
    Profile[],
    TaskProgressType[]
  ]) {
    this.activeGroupId = activeGroupId;
    this.workGroups = workGroups;
    this.allTasks = tasks;
    this.taskProgressTypes = taskProgressTypes;
    this.wgt = workGroupTasks;

    // Map work group tasks
    this.workGroupTasks = {};
    workGroupTasks.forEach(workGroupTask => {
      if (!this.workGroupTasks[workGroupTask.work_group_id]) {
        this.workGroupTasks[workGroupTask.work_group_id] = [];
      }

      const task = tasks.find(t => t.task_id === workGroupTask.task_id);

      if (task) {
        const taskCopy = { ...task };
        const notAssignedType = this.taskProgressTypes.find((type: any) => type.task_progress_type_name === "Nije dodijeljeno");
        const assignedType = this.taskProgressTypes.find((type: any) => type.task_progress_type_name === "Dodijeljeno");

        if (task.task_progress_type_id == notAssignedType?.task_progress_type_id) {
          taskCopy.task_progress_type_id = assignedType!.task_progress_type_id;
        }
        this.workGroupTasks[workGroupTask.work_group_id] = [...this.workGroupTasks[workGroupTask.work_group_id], taskCopy];
      }
    });

    this.workGroupStaff = {};
    workGroupProfiles.forEach(assignment => {
      if (!this.workGroupStaff[assignment.work_group_id]) {
        this.workGroupStaff[assignment.work_group_id] = [];
      }
      const profile = profiles.find(p => p.id === assignment.profile_id);
      if (profile) {
        this.workGroupStaff[assignment.work_group_id] = [...this.workGroupStaff[assignment.work_group_id], profile];
      }
    });

    this.lockedTeams = [];

    if(workGroups){
      for (const workGroup of this.workGroups) {
        if (!workGroup.is_repair && this.is3DaysOld(workGroup)) {
          const workGroupTasks = this.wgt.filter(wgt => wgt.work_group_id == workGroup.work_group_id);
          const tasks = this.allTasks.filter(task => workGroupTasks.some(wgt => wgt.task_id == task.task_id));
  
          const hasTasksInprogress = tasks.some(task => this.taskService.isTaskInProgress(task) || this.taskService.isTaskPaused(task));

          if(!hasTasksInprogress){
            this.deleteWorkGroup(workGroup.work_group_id);
          }
        } else {
          this.lockedTeams.push({
            id: workGroup.work_group_id.toString(),
            name: "Team " + workGroup.work_group_id.toString(),
            members: this.workGroupStaff[workGroup.work_group_id],
            tasks: this.workGroupTasks[workGroup.work_group_id],
            homes: [],
            isLocked: workGroup.is_locked,
          });
        }
      }
      this.workGroupService.setLockedTeams(this.lockedTeams);
    }

    this.loading = false;
  }

  getAssignedTasks(workGroupId: number): Task[] {
    let lockedTeams = this.workGroupService.getLockedTeams();
    let lockedTeam = lockedTeams.find(lockedTeam => parseInt(lockedTeam.id) == workGroupId);
    const workGroupTasks = this.wgt.filter(wgt => wgt.work_group_id == lockedTeam?.id);

    if(lockedTeam?.tasks){
      return lockedTeam.tasks.map(task => {
        const workGroupTask = workGroupTasks.find(wgt => wgt.task_id == task.task_id);

        return {
          ...task,
          index: workGroupTask.index,
        }
      });
    }

    return [];
  }

  getAssignedStaff(workGroupId: number): Profile[] {
    return this.workGroupStaff[workGroupId] || [];
  }

  setActiveGroup(workGroupId: number) {
    this.workGroupService.setActiveGroup(workGroupId);
  }

  createWorkGroup(isRepairWorkGroup: boolean) {
    if(this.activeGroupId){
      this.workGroupService.$newGroupWhileGroupActive.next(true);
    }
    this.dataService.createWorkGroup(isRepairWorkGroup).subscribe({
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
    if (this.activeGroupId == workGroupId) {
      this.workGroupService.setActiveGroup(undefined);
    }

    const assignedTaskType = this.taskProgressTypes.find((tpt: any) => tpt.task_progress_type_name == 'Dodijeljeno');
    const notAssignedTaskType = this.taskProgressTypes.find((tpt: any) => tpt.task_progress_type_name == 'Nije dodijeljeno')
    const tasksToReturn = this.getAssignedTasks(workGroupId);
    
    if(tasksToReturn && tasksToReturn.length > 0){
      this.wgt = this.wgt.filter(wgt => !this.workGroupTasks[workGroupId].some(wgtask => wgtask.task_id == wgt.task_id));
      this.workGroupTasks[workGroupId] = this.workGroupTasks[workGroupId].filter(task => !tasksToReturn.some(ttr => ttr.task_id == task.task_id));
      this.dataService.setWorkGroupTasks(this.wgt);
    }

    let updateObservables = tasksToReturn
        .filter(task => task.task_progress_type_id === assignedTaskType!.task_progress_type_id)
        .map(task => 
          from(this.taskService.updateTaskProgressType(task.task_id, notAssignedTaskType!.task_progress_type_id))
        );

    forkJoin(updateObservables.length > 0 ? updateObservables : [of(null)]).pipe(
      switchMap(() => this.dataService.deleteWorkGroup(workGroupId)),
      catchError((err) => {
        console.error("Error:", err);
        throw new Error("Error deleting work group!");
      })
    ).subscribe();
  }

  async publishWorkGroups() {
    let lockedWorkGroups = this.workGroupService.getLockedTeams();
    let assignedTaskProgressType = this.taskProgressTypes.find((tpt: any) => tpt.task_progress_type_name == "Dodijeljeno");
    let notAssignedTaskProgressType = this.taskProgressTypes.find((tpt: any) => tpt.task_progress_type_name == "Nije dodijeljeno");
    let inProgressTaskProgressType = this.taskProgressTypes.find((tpt: any) => tpt.task_progress_type_name == "U tijeku");
    let completedTaskProgressType = this.taskProgressTypes.find((tpt: any) => tpt.task_progress_type_name == 'Završeno');
    let pausedTaskProgressType = this.taskProgressTypes.find((tpt: any) => tpt.task_progress_type_name == 'Pauzirano');
    let unlockedWorkGroups = lockedWorkGroups.filter(lwg => !lwg.isLocked);

    const workGroupPromises = unlockedWorkGroups.map(async (lockedWorkGroup) => {
      const workGroupId = parseInt(lockedWorkGroup.id);
      const deletedWorkGroupTasks = this.wgt;
  
      await this.workGroupService.lockWorkGroup(workGroupId);
  
      await Promise.all([
        this.workGroupService.deleteAllWorkGroupTasksByWorkGroupId(workGroupId),
        this.workGroupService.deleteAllWorkGroupProfilesByWorkGroupId(workGroupId)
      ]);
    
      lockedWorkGroup.tasks ??= [];
      lockedWorkGroup.members ??= [];
  
      const createTaskPromises = lockedWorkGroup.tasks.map((task) => 
        this.workGroupService.createWorkGroupTask(workGroupId, task.task_id, deletedWorkGroupTasks.find(wgt => wgt.task_id == task.task_id).index)
      );

      const updateTaskProgressPromises = lockedWorkGroup.tasks
        .filter(task => 
          task.task_progress_type_id != completedTaskProgressType!.task_progress_type_id && 
          task.task_progress_type_id != inProgressTaskProgressType!.task_progress_type_id &&
          task.task_progress_type_id != pausedTaskProgressType!.task_progress_type_id)
        .map(task => 
          this.taskService.updateTaskProgressType(task.task_id, assignedTaskProgressType!.task_progress_type_id)
        );
      
      const updateRemovedTasksPromises = this.tasksToRemove.map(ttrm =>
        this.taskService.updateTaskProgressType(ttrm.task_id, notAssignedTaskProgressType!.task_progress_type_id)
      );

      this.tasksToRemove = [];

      const createProfilePromises = lockedWorkGroup.members.map(member =>
        this.workGroupService.createWorkGroupProfile(workGroupId, member.id)
      );
  
      await Promise.all([
        ...createTaskPromises,
        ...updateTaskProgressPromises,
        ...createProfilePromises,
        ...updateRemovedTasksPromises
      ]);
    });
  
    await Promise.all(workGroupPromises);
  }

  areDaysEqual(date1: string, date2: string){
    return date1.slice(0, 10).split('-')[2] === date2.slice(0, 10).split('-')[2];
  }

  is3DaysOld(workGroup: WorkGroupObject): boolean {
    const createdAt = new Date(workGroup.created_at);
    const threeDaysAgo = new Date();

    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    return createdAt < threeDaysAgo;
  }
  
  isToday(time_sent: string | Date): boolean {
    const date = new Date(time_sent);
    const today = new Date();

    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  }
} 