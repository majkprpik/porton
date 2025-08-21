import { Component, Input, Output, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Task, Profile, WorkGroup as WorkGroupObject, WorkGroupTask, WorkGroupProfile, TaskProgressTypeName } from '../../core/models/data.models';
import { TaskCardComponent } from './task-card';
import { TagModule } from 'primeng/tag';
import { StaffCardComponent } from './staff-card';
import { MenuItem } from 'primeng/api';
import { ContextMenu, ContextMenuModule } from 'primeng/contextmenu';
import { combineLatest, Subject, takeUntil } from 'rxjs';
import { DragDropModule } from 'primeng/dragdrop';
import { TaskService } from '../../core/services/task.service';
import { WorkGroupService } from '../../core/services/work-group.service';
import { ConfirmationService } from 'primeng/api';
import { ProfileService } from '../../core/services/profile.service';
import { DialogModule } from 'primeng/dialog';
import { CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { HouseService } from '../../core/services/house.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TasksIndexSortPipe } from '../../shared/pipes/tasks-index-sort.pipe';
import { DataService } from '../../core/services/data.service';

@Component({
  selector: 'app-work-group',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule, 
    TaskCardComponent, 
    TagModule, 
    StaffCardComponent, 
    ContextMenuModule,
    DragDropModule,
    DialogModule,
    CdkDropList, 
    CdkDrag,
    ConfirmDialogModule,
    TranslateModule,
    TasksIndexSortPipe,
  ],
  providers: [ConfirmationService],
  template: `
    <div class="work-group-container" 
      [class.active]="isActive" 
      [class.active-with-tasks]="isActive && assignedTasks.length" 
      [style.background-color]="isActive ? getGroupColor() : null" 
      [style.border-color]="isActive ? getGroupBorderColor() : null"
    >
      <div class="active-border" [style.background-image]="isActive ? 'linear-gradient(to right, ' + getGroupBorderColor() + ' 50%, transparent 50%), linear-gradient(to bottom, ' + getGroupBorderColor() + ' 50%, transparent 50%), linear-gradient(to left, ' + getGroupBorderColor() + ' 50%, transparent 50%), linear-gradient(to top, ' + getGroupBorderColor() + ' 50%, transparent 50%)' : null"></div>
      <div class="work-group-header">
        <div class="work-group-title-area">
          <span class="work-group-title">{{getGroupColorName()}}</span>
          <p-tag 
            [value]="(workGroup?.is_locked ? 'DAILY-SHEET.WORK-GROUPS.PUBLISHED' : 'DAILY-SHEET.WORK-GROUPS.NOT-PUBLISHED') | translate"
            [severity]="workGroup?.is_locked ? 'success' : 'danger'"
          ></p-tag>
        </div>
        <p-button 
          [label]="(isActive ? 'DAILY-SHEET.WORK-GROUPS.FINISH-CHANGES' : 'DAILY-SHEET.WORK-GROUPS.START-CHANGES') | translate"
          [severity]="isActive ? 'secondary' : 'success'"
          (onClick)="onGroupClick()"
          class="activate-button"
        ></p-button>
        <div class="header-actions">
          <p-button 
            icon="pi pi-trash" 
            severity="danger" 
            [text]="true"
            [rounded]="true"
            (onClick)="onDeleteClick($event)"
          ></p-button>
        </div>
      </div>
      <div class="work-group-content">
        <div class="tasks-area">
          @if (assignedTasks.length === 0) {
            <div class="drop-area">{{ 'DAILY-SHEET.WORK-GROUPS.CLICK-TASKS' | translate }}</div>
          } @else {
            <div class="tasks-list">
              @for (task of assignedTasks | tasksIndexSort; track task.task_id; let i = $index) {
                <div 
                  class="task-card-container"
                >
                  <app-task-card 
                    [task]="task"
                    [isInActiveGroup]="isActive"
                    (removeFromGroup)="onRemoveTask(task)">
                  </app-task-card>
                </div>
              }
            </div>
          }
          @if(isActive && assignedTasks.length > 0){
            <div (click)="openSortDialog()" class="tasks-sort-icon">
              <i class="pi pi-sort-alt"></i>
            </div>
          }
        </div>
        <div class="staff-area">
          @if (assignedStaff.length === 0) {
            <div class="drop-area">{{ 'DAILY-SHEET.WORK-GROUPS.CLICK-STAFF' | translate }}</div>
          } @else {
            <div class="staff-list">
              @for (profile of assignedStaff; track profile.id) {
                <app-staff-card 
                  [profile]="profile"
                  [isInActiveGroup]="isActive"
                  (removeFromGroup)="onRemoveStaff(profile)"
                  (contextmenu)="onStaffContextMenu($event, profile)"
                ></app-staff-card>
              }
            </div>
          }
        </div>
      </div>
    </div>

    <p-dialog 
      [header]="'DAILY-SHEET.WORK-GROUPS.SORT-TASKS' | translate" 
      [modal]="true" 
      [(visible)]="isSortDialogVisible" 
      [style]="{ width: '25rem' }"
      [draggable]="false"
    >
      <div cdkDropList class="sorted-tasks-list" (cdkDropListDropped)="drop($event)">
        @for (task of assignedTasks | tasksIndexSort; track task.task_id; let i = $index) {
          <div class="task-box-container">
            <div class="task-index">
              ({{i + 1}})
            </div>
  
            <div 
              class="task-box" 
              cdkDrag
              [class.assigned]="taskService.isTaskAssigned(task)"
              [class.not-assigned]="taskService.isTaskNotAssigned(task)"
              [class.in-progress]="taskService.isTaskInProgress(task) || taskService.isTaskPaused(task)"
              [class.completed]="taskService.isTaskCompleted(task)"
            >
              <div class="house-number">
                {{houseService.getHouseName(task.house_id)}}
              </div>
  
              <div class="task-icon">
                <i [class]="taskService.getTaskIcon(task.task_type_id)"></i>
              </div>
            </div>
          </div>
        }
      </div>
    </p-dialog>

    <p-contextMenu #staffContextMenu [model]="staffMenuItems"></p-contextMenu>
    <p-confirmDialog header="Potvrda" icon="pi pi-exclamation-triangle"></p-confirmDialog>
  `,
  styles: `
    @keyframes borderDance {
      0% {
        background-position: 0 0, 100% 0, 100% 100%, 0 100%;
      }
      100% {
        background-position: 100% 0, 100% 100%, 0 100%, 0 0;
      }
    }

    .work-group-container {
      background-color: var(--surface-card);
      border-radius: 6px;
      padding: 1rem;
      margin-bottom: 1rem;
      box-shadow: var(--card-shadow);
      position: relative;
      transition: all 0.2s;

      &.active {
        .work-group-title {
          color: var(--text-color);
        }

        &:hover {
          opacity: 0.9;
        }

        .active-border {
          position: absolute;
          inset: 0;
          border-radius: 6px;
          pointer-events: none;
          background-size: 20px 2px, 2px 20px, 20px 2px, 2px 20px;
          background-position: 0 0, 100% 0, 100% 100%, 0 100%;
          background-repeat: repeat-x, repeat-y, repeat-x, repeat-y;
          animation: borderDance 5s infinite linear;
        }
      }

      &.active-with-tasks {
        .tasks-area {
          box-sizing: border-box;
          padding-bottom: 40px;
        }
      }

      .work-group-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        gap: 1rem;

        .work-group-title-area {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;

          .work-group-title {
            font-weight: 600;
            font-size: 1.1rem;
            color: var(--text-color);
          }
        }

        .header-actions {
          display: flex;
          gap: 0.5rem;
        }

        .activate-button-container {
          display: flex;
          justify-content: center;
          margin: -0.5rem 0 1rem 0;
        }
      }

      .work-group-content {
        display: flex;
        gap: 1rem;

        .tasks-area,
        .staff-area {
          flex: 1;
          min-height: 150px;
          border-radius: 4px;
          background: var(--surface-ground);
          padding: 0.5rem;
          position: relative;

          .drop-area {
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-color-secondary);
            font-style: italic;
          }

          .tasks-list,
          .staff-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .tasks-list {
            min-height: 50px;
            padding: 0.25rem;
            transition: all 0.2s ease;
          }

          .task-card-container {
            display: flex;
            align-items: center;
            transition: transform 0.1s ease;

            &.dragging {
              opacity: 0.5;
              transform: scale(0.98);
            }
          }

          .tasks-sort-icon {
            position: absolute;
            height: 30px;
            width: 30px;
            bottom: 10px;
            right: 10px;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            border-radius: 5px;
            transition: transform 0.3s ease;

            &:hover {
              cursor: pointer;
              background-color: lightgray;
              transform: scale(1.05);
            }
          }
        }
      }
    }

    .sorted-tasks-list {
      width: 500px;
      max-width: 100%;
      min-height: 60px;
      display: block;
      background: white;
      border-radius: 4px;
      overflow: hidden;

      .task-box-container {
        display: flex;
        flex-direction: row;
        gap: 5px;
        width: 100%;

        .task-index {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
        }
      }

      .task-box {
        width: 100%;
        padding: 20px 10px;
        border-bottom: solid 1px #ccc;
        color: rgba(0, 0, 0, 0.87);
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        box-sizing: border-box;
        cursor: move;
        background: white;
        font-size: 14px;
        border-radius: 5px;
        margin-bottom: 5px;

        .house-number {
          font-weight: 600;
        }

        &.completed {
          background: var(--p-red-400);
          color: var(--p-surface-0);
        }

        &.in-progress {
          background: var(--p-yellow-500);
          color: var(--p-surface-0);
        }

        &.assigned {
          background: var(--p-blue-500);
          color: var(--p-surface-0);
        }

        &.not-assigned {
          background: var(--p-green-500);
          color: var(--p-surface-0);
        }
      }

      .task-box:last-child {
        border: none;
      }

      &.cdk-drop-list-dragging {
        .task-box:not(.cdk-drag-placeholder) {
          transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
        }
      }
    }

    .cdk-drag-preview {
      border: none;
      box-sizing: border-box;
      border-radius: 4px;
      box-shadow:
        0 5px 5px -3px rgba(0, 0, 0, 0.2),
        0 8px 10px 1px rgba(0, 0, 0, 0.14),
        0 3px 14px 2px rgba(0, 0, 0, 0.12);
    }

    .cdk-drag-placeholder {
      opacity: 0;
    }

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    :host ::ng-deep {
      .activate-button {
        .p-button {
          min-width: 200px;
          font-size: 1.1rem;
          font-weight: 600;
          padding: 0.75rem 2rem;
          text-transform: uppercase;
        }
      }
    }
  `
})
export class WorkGroup implements OnInit {
  @Input() workGroup?: WorkGroupObject;
  @Input() isActive: boolean = false;
  @Input() assignedTasks: Task[] = [];
  @Input() assignedStaff: Profile[] = [];

  @Output() groupSelected = new EventEmitter<void>();
  @Output() deleteClicked = new EventEmitter<void>();
  
  @ViewChild('staffContextMenu') staffContextMenu!: ContextMenu;

  selectedStaff?: Profile;
  staffMenuItems: MenuItem[] = [];
  
  tasks: Task[] = [];
  profiles: Profile[] = [];
  workGroupTasks: WorkGroupTask[] = [];
  workGroupProfiles: WorkGroupProfile[] = [];
  workGroups: WorkGroupObject[] = [];

  isSortDialogVisible = false;

  workGroupColors = [
    { name: 'Tirkizna', background: 'rgba(50, 177, 151, 0.1)', border: 'rgba(50, 177, 151, 0.2)' },
    { name: 'Narančasta', background: 'rgba(255, 99, 71, 0.1)', border: 'rgba(255, 99, 71, 0.2)' },
    { name: 'Plava', background: 'rgba(65, 105, 225, 0.1)', border: 'rgba(65, 105, 225, 0.2)' },
    { name: 'Ljubičasta', background: 'rgba(147, 112, 219, 0.1)', border: 'rgba(147, 112, 219, 0.2)' },
    { name: 'Žuta', background: 'rgba(255, 165, 0, 0.1)', border: 'rgba(255, 165, 0, 0.2)' },
    { name: 'Zelena', background: 'rgba(46, 139, 87, 0.1)', border: 'rgba(46, 139, 87, 0.2)' },
    { name: 'Crvena', background: 'rgba(220, 20, 60, 0.1)', border: 'rgba(220, 20, 60, 0.2)' },
    { name: 'Svijetloplava', background: 'rgba(0, 191, 255, 0.1)', border: 'rgba(0, 191, 255, 0.2)' },
    { name: 'Zlatna', background: 'rgba(255, 215, 0, 0.1)', border: 'rgba(255, 215, 0, 0.2)' },
    { name: 'Indigo', background: 'rgba(138, 43, 226, 0.1)', border: 'rgba(138, 43, 226, 0.2)' },
    { name: 'Tirkizna 2', background: 'rgba(0, 128, 128, 0.1)', border: 'rgba(0, 128, 128, 0.2)' },
    { name: 'Koraljna', background: 'rgba(255, 69, 0, 0.1)', border: 'rgba(255, 69, 0, 0.2)' },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private dataService: DataService,
    private workGroupService: WorkGroupService,
    public taskService: TaskService,
    private confirmationService: ConfirmationService,
    private profileService: ProfileService,
    public houseService: HouseService,
    private translateService: TranslateService,
  ) {}

  ngOnInit() {
    this.subscribeToDataStreams();
    this.subscribeToWorkGroupEvents();
    this.subscribeToTaskEvents();
    this.subscribeToProfileEvents();
    this.subscribeToUpdates();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToDataStreams() {
    combineLatest([
      this.dataService.tasks$,
      this.dataService.workGroupTasks$,
      this.dataService.workGroupProfiles$,
      this.dataService.workGroups$,
      this.dataService.profiles$,
    ])
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ([tasks, workGroupTasks, workGroupProfiles, workGroups, profiles]) => {
        this.tasks = tasks;
        this.workGroupTasks = workGroupTasks;
        this.workGroupProfiles = workGroupProfiles;
        this.workGroups = workGroups;
        this.profiles = profiles;

        this.deleteCompletedWorkGroupTasks();
      },
      error: (error) => {
        console.error(error);
      }
    });
  }

  private subscribeToWorkGroupEvents() {
    this.workGroupService.$newGroupWhileGroupActive
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => {
        if (res) {
          this.onGroupClick();
          this.workGroupService.$newGroupWhileGroupActive.next(false);
        }
      });
  }

  private subscribeToTaskEvents() {
    if (!this.workGroup) return;

    this.taskService.$selectedTask
      .pipe(takeUntil(this.destroy$))
      .subscribe(selectedTask => this.handleSelectedTask(selectedTask));
  }

  private subscribeToProfileEvents() {
    this.profileService.$staffToAdd
      .pipe(takeUntil(this.destroy$))
      .subscribe(staffToAdd => this.handleStaffToAdd(staffToAdd));
  }

  private subscribeToUpdates() {
    this.dataService.$workGroupProfilesUpdate
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => this.handleWorkGroupProfilesUpdate(res));

    this.dataService.$workGroupTasksUpdate
      .pipe(takeUntil(this.destroy$))
      .subscribe(res => this.handleWorkGroupTasksUpdate(res));
  }
  
  private handleSelectedTask(selectedTask: any) {
    if(!selectedTask || this.workGroupTasks.some(wgt => wgt.task_id === selectedTask.task_id)) return;

    const activeGroup = this.workGroupService.getActiveGroup();
    if(!activeGroup || !this.workGroup || this.workGroup.work_group_id !== activeGroup) return;

    let lockedTeams = this.workGroupService.getLockedTeams();
    let lockedTeam = lockedTeams.find(team => team.id === activeGroup);
    if(!lockedTeam || lockedTeam.tasks?.find(task => task.task_id === selectedTask.task_id)) return;

    if(this.taskService.isTaskNotAssigned(selectedTask)){
      selectedTask.task_progress_type_id =
        this.taskService.getTaskProgressTypeByName(TaskProgressTypeName.Assigned)?.task_progress_type_id;
    }

    this.workGroupTasks = [
      ...this.workGroupTasks,
      {
        work_group_id: activeGroup,
        task_id: selectedTask.task_id,
        index: this.workGroupTasks.filter(wgt => wgt.work_group_id === activeGroup).length,
      }
    ];

    this.workGroup.is_locked = false;
    const wgtIndex = this.workGroups.findIndex(wgt => wgt.work_group_id === this.workGroup?.work_group_id);
    this.workGroups[wgtIndex] = this.workGroup;

    lockedTeam.tasks ??= [];
    lockedTeam.isLocked = false;
    lockedTeam.tasks.push(selectedTask);
    this.workGroupService.updateLockedTeam(lockedTeam);

    this.dataService.setWorkGroupTasks(this.workGroupTasks);
    this.dataService.setWorkGroups(this.workGroups);

    this.taskService.$selectedTask.next(null);
  }

  private handleStaffToAdd(staffToAdd: any) {
    const activeGroup = this.workGroupService.getActiveGroup();
    if(!staffToAdd || !this.workGroup || !activeGroup || this.workGroup.work_group_id !== activeGroup) return;

    let lockedTeams = this.workGroupService.getLockedTeams();
    let lockedTeam = lockedTeams.find(team => team.id === activeGroup);
    if(!lockedTeam || lockedTeam.members?.find(m => m.id === staffToAdd.id)) return;

    this.workGroupProfiles = [
      ...this.workGroupProfiles,
      { work_group_id: lockedTeam.id, profile_id: staffToAdd.id }
    ];

    this.workGroup.is_locked = false;
    lockedTeam.members ??= [];
    lockedTeam.isLocked = false;
    lockedTeam.members.push(staffToAdd);

    this.workGroupService.updateLockedTeam(lockedTeam);
    this.dataService.setWorkGroupProfiles(this.workGroupProfiles);

    this.profileService.$staffToAdd.next(null);
  }

  private handleWorkGroupProfilesUpdate(res: any) {
    if(!res || res.eventType !== 'INSERT') return;

    let lockedTeams = this.workGroupService.getLockedTeams();
    let lockedTeam = lockedTeams.find(lt => lt.id === res.new.work_group_id);
    if(!lockedTeam || lockedTeam.members?.find(member => member.id === res.new.profile_id)) return;

    lockedTeam.tasks ??= [];
    lockedTeam.isLocked = false;
    lockedTeam.members.push(res.new);
    this.workGroupService.updateLockedTeam(lockedTeam);

    this.profileService.$staffToAdd.next(null);
  }

  private handleWorkGroupTasksUpdate(res: any) {
    if(!res) return;

    let lockedTeams = this.workGroupService.getLockedTeams();
    let lockedTeam;

    if(res.eventType === 'INSERT') {
      if(this.workGroupTasks.find(wgt => wgt.task_id === res.new.task_id)) return;
      lockedTeam = lockedTeams.find(team => team.id === res.new.work_group_id);
      if(!lockedTeam || lockedTeam.tasks?.find(t => t.task_id === res.new.task_id)) return;

      let task = this.tasks.find(t => t.task_id === res.new.task_id);
      if(!task) return;

      lockedTeam.tasks ??= [];
      lockedTeam.isLocked = true;
      lockedTeam.tasks.push(task);
      this.workGroupService.updateLockedTeam(lockedTeam);

    } else if(res.eventType === 'DELETE') {
      if(!this.workGroupTasks.find(wgt => wgt.task_id === res.old.task_id)) return;
      lockedTeam = lockedTeams.find(team => team.id === res.old.work_group_id);
      if(!lockedTeam) return;

      lockedTeam.tasks ??= [];
      lockedTeam.tasks = lockedTeam.tasks.filter(task => task.task_id !== res.old.task_id);
      this.workGroupService.updateLockedTeam(lockedTeam);
    }
  }

  getGroupColor(): string {
    if (!this.workGroup) return this.workGroupColors[0].background; 
    const index = (this.workGroup.work_group_id - 1) % 12;
    return this.workGroupColors[index].background;
  }
  
  getGroupBorderColor(): string {
    if (!this.workGroup) return this.workGroupColors[0].border; 
    const index = (this.workGroup.work_group_id - 1) % 12;
    return this.workGroupColors[index].border;
  }

  getGroupColorName(): string {
    if (!this.workGroup) return this.workGroupColors[0].name;
    const index = (this.workGroup.work_group_id - 1) % 12;
    return this.workGroupColors[index].name;
  }

  onGroupClick() {
    if(!this.isActive){
      this.groupSelected.emit();
      return;
    }

    if(this.workGroup){
      this.workGroupService.updateLockedTeam({
        id: this.workGroup?.work_group_id,
        name: "Team " + this.workGroup.work_group_id,
        members: this.assignedStaff,
        tasks: this.assignedTasks,
        isLocked: this.workGroup.is_locked,
      });
    }

    let lockedTeams = this.workGroupService.getLockedTeams();
    let lockedWorkGroupTasks: WorkGroupTask[] = [];
    let lockedWorkGroupProfiles: WorkGroupProfile[] = [];
    
    lockedTeams.forEach(lockedTeam => {
      lockedTeam.tasks?.forEach((task) => {
        lockedWorkGroupTasks.push({
          work_group_id: lockedTeam.id,
          task_id: task.task_id,
          index: this.workGroupTasks.find((wgt: any) => wgt.task_id == task.task_id)?.index ?? 0,
        });
      });

      lockedTeam.members?.forEach(member => {
        lockedWorkGroupProfiles.push({
          work_group_id: lockedTeam.id,
          profile_id: member.id,
        });
      })
    });

    this.dataService.setWorkGroupTasks(lockedWorkGroupTasks);
    this.dataService.setWorkGroupProfiles(lockedWorkGroupProfiles);
    this.workGroupService.setActiveGroup(undefined);
  }

  onDeleteClick(event: Event) {
    event.stopPropagation();

    if(this.assignedTasks.find(task => this.taskService.isTaskInProgress(task) || this.taskService.isTaskPaused(task))){
      this.confirmationService.confirm({
        message: this.translateService.instant('DAILY-SHEET.WORK-GROUPS.DELETE.TASK-IN-PROGRESS'),
        header: this.translateService.instant('DAILY-SHEET.WORK-GROUPS.DELETE.HEADER'),
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: this.translateService.instant('BUTTONS.OK'),
        rejectVisible: false,
      });

      return; 
    }

    this.confirmationService.confirm({
      message: this.translateService.instant('DAILY-SHEET.WORK-GROUPS.DELETE.DELETE'),
      header: this.translateService.instant('DAILY-SHEET.WORK-GROUPS.DELETE.HEADER'),
      acceptLabel: this.translateService.instant('BUTTONS.YES'),
      rejectLabel: this.translateService.instant('BUTTONS.NO'),
      accept: () => {
        this.deleteClicked.emit();
      }
    });
  }

  onStaffContextMenu(event: MouseEvent, staff: Profile) {
    event.preventDefault();
    event.stopPropagation();
    this.selectedStaff = staff;
    this.staffContextMenu.show(event);
  }

  onRemoveTask(taskToRemove: Task) {
    if(
      this.taskService.isTaskCompleted(taskToRemove) || 
      this.taskService.isTaskInProgress(taskToRemove) ||
      this.taskService.isTaskPaused(taskToRemove)
    ) return;
    
    if(!this.workGroup?.work_group_id) return;

    if(this.workGroup.work_group_id == this.workGroupService.getActiveGroup()){
      this.workGroup.is_locked = false;
    }

    this.taskService.$taskToRemove.next(taskToRemove);
  }

  onRemoveStaff(staff: Profile) {
    if(!staff.id || !this.workGroup?.work_group_id) return;

    const lockedTeam = this.workGroupService.getLockedTeams().find(lockedTeam => lockedTeam.id == this.workGroup?.work_group_id);
    if(!lockedTeam) return; 

    this.workGroup.is_locked = false;
    this.workGroupProfiles = this.workGroupProfiles.filter((wgp: any) => !(wgp.profile_id == staff.id && wgp.work_group_id == this.workGroup?.work_group_id));
    this.dataService.setWorkGroupProfiles(this.workGroupProfiles);
    
    lockedTeam.isLocked = false;
    lockedTeam.members = lockedTeam.members.filter(member => member.id != staff.id);
    this.workGroupService.updateLockedTeam(lockedTeam);
  }

  openSortDialog(){
    this.isSortDialogVisible = true;
  }

  drop(event: any) {
    let lockedTeam = this.workGroupService.getLockedTeams().find(lt => lt.id == this.workGroup?.work_group_id);

    if(!this.workGroup || !lockedTeam) return;

    this.workGroup.is_locked = false;
    lockedTeam.isLocked = false;

    moveItemInArray(this.assignedTasks, event.previousIndex, event.currentIndex);

    this.assignedTasks.forEach((task, index) => {
      task.index = index;

      this.workGroupTasks = this.workGroupTasks.map((wgt: any) => {
        if(wgt.task_id == task.task_id){
          return {
            ...wgt,
            index: index,
          }
        } else {
          return wgt;
        }
      });
    });

    this.dataService.setWorkGroupTasks(this.workGroupTasks);
    this.workGroupService.updateLockedTeam(lockedTeam);
  }

  deleteCompletedWorkGroupTasks(){
    const workGroupTasks = this.workGroupTasks.filter(wgt => wgt.work_group_id == this.workGroup?.work_group_id);
    const tasks = this.tasks.filter(task => workGroupTasks.some(wgt => wgt.task_id == task.task_id));

    tasks.forEach(task => {
      if(this.taskService.isTaskCompleted(task) && this.isTaskOlderThan2Days(task)){
        this.workGroupService.deleteWorkGroupTask(task.task_id);
      }
    });
  }

  isTaskOlderThan2Days(task: Task){
    if(!task.end_time) return;

    const taskEndDate = new Date(task.end_time);
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    return taskEndDate < twoDaysAgo;
  }
} 