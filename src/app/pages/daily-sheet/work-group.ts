import { Component, Input, Output, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Task, Profile, DataService, House, TaskType, WorkGroup as WorkGroupObject } from '../service/data.service';
import { TaskCardComponent } from './task-card';
import { TagModule } from 'primeng/tag';
import { StaffCardComponent } from './staff-card';
import { MenuItem } from 'primeng/api';
import { ContextMenu, ContextMenuModule } from 'primeng/contextmenu';
import { combineLatest, forkJoin } from 'rxjs';
import { TooltipModule } from 'primeng/tooltip';
import { DragDropModule } from 'primeng/dragdrop';
import { TaskService } from '../service/task.service';
import { WorkGroupService } from '../service/work-group.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ProfileService } from '../service/profile.service';
import { DialogModule } from 'primeng/dialog';
import { CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { HouseService } from '../service/house.service';

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
    TooltipModule,
    DragDropModule,
    ConfirmDialogModule,
    DialogModule,
    CdkDropList, 
    CdkDrag
  ],
  providers: [ConfirmationService],
  template: `
    <div class="work-group-container" [class.active]="isActive" [style.background-color]="isActive ? getGroupColor() : null" [style.border-color]="isActive ? getGroupBorderColor() : null">
      <div class="active-border" [style.background-image]="isActive ? 'linear-gradient(to right, ' + getGroupBorderColor() + ' 50%, transparent 50%), linear-gradient(to bottom, ' + getGroupBorderColor() + ' 50%, transparent 50%), linear-gradient(to left, ' + getGroupBorderColor() + ' 50%, transparent 50%), linear-gradient(to top, ' + getGroupBorderColor() + ' 50%, transparent 50%)' : null"></div>
      <div class="work-group-header">
        <div class="work-group-title-area">
          <span class="work-group-title">{{getGroupColorName()}}</span>
          <p-tag 
            [value]="workGroup?.is_locked ? 'OBJAVLJENO' : 'NEOBJAVLJENO'"
            [severity]="workGroup?.is_locked ? 'success' : 'secondary'"
          ></p-tag>
        </div>
        <p-button 
          [label]="isActive ? 'ZAVRŠI IZMJENE' : 'ZAPOČNI IZMJENE'"
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
            pTooltip="Delete Group"
          ></p-button>
        </div>
      </div>
      <div class="work-group-content">
        <div class="tasks-area">
          @if (assignedTasks.length === 0) {
            <div class="drop-area">Kliknite zadatke za dodjelu</div>
          } @else {
            <div class="tasks-list" pDroppable="tasks" (onDrop)="onDrop($event)">
              @for (task of assignedTasks; track task.task_id; let i = $index) {
                <div 
                  class="task-card-container"
                  [class.dragging]="draggedTaskIndex === i"
                  pDraggable="tasks"
                  (onDragStart)="onDragStart($event, i)"
                  (onDragEnd)="onDragEnd()"
                >
                  <app-task-card 
                    [houseNumber]="houseService.getHouseNumber(task.house_id)"
                    [houseName]="houseService.getHouseName(task.house_id)"
                    [task]="task"
                    [state]="isTaskCompleted(task) ? 'completed' : 'assigned'"
                    [taskIcon]="taskService.getTaskIcon(task.task_type_id)"
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
            <div class="drop-area">Kliknite osoblje za dodjelu</div>
          } @else {
            <div class="staff-list">
              @for (staff of assignedStaff; track staff.id) {
                <app-staff-card 
                  [staff]="staff"
                  [isInActiveGroup]="isActive"
                  (removeFromGroup)="onRemoveStaff(staff)"
                  (contextmenu)="onStaffContextMenu($event, staff)"
                ></app-staff-card>
              }
            </div>
          }
        </div>
      </div>
    </div>

    <p-dialog 
      header="Poredaj zadatke" 
      [modal]="true" 
      [(visible)]="isSortDialogVisible" 
      [style]="{ width: '25rem' }"
      [draggable]="false"
    >
      <div cdkDropList class="sorted-tasks-list" (cdkDropListDropped)="drop($event)">
        @for (task of assignedTasks; track trackByTaskId($index, task)) {
          <div class="task-box-container">
            <div class="task-index">
              ({{$index + 1}})
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
                {{houseService.getHouseNumber(task.house_id)}}
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

      &:hover {
        background-color: var(--surface-hover);
      }

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
    }

    .work-group-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      gap: 1rem;
    }

    .work-group-title-area {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .work-group-title {
      font-weight: 600;
      font-size: 1.1rem;
      color: var(--text-color);
    }

    .activate-button-container {
      display: flex;
      justify-content: center;
      margin: -0.5rem 0 1rem 0;
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

    .work-group-content {
      display: flex;
      gap: 1rem;
    }

    .tasks-area, .staff-area {
      flex: 1;
      min-height: 150px;
      border: 2px dashed var(--surface-border);
      border-radius: 4px;
      background: var(--surface-ground);
      padding: 0.5rem;
      position: relative;

      .tasks-sort-icon{
        position: absolute;
        height: 30px;
        width: 30px;
        bottom: 10px;
        right: 10px;
        transition: transform 0.3s ease;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        border-radius: 5px;

        &:hover{
          cursor: pointer;
          background-color: lightgray;
        }
      }
    }

    .drop-area {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-color-secondary);
      font-style: italic;
    }

    .tasks-list, .staff-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .tasks-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      min-height: 50px;
      padding: 0.25rem;
      transition: all 0.2s ease;

      &.p-droppable-enter {
        background-color: var(--surface-hover);
      }
    }

    .task-card-container {
      display: flex;
      align-items: center;
      cursor: move;

      &:hover {
        transform: translateY(-2px);
      }

      &.dragging {
        opacity: 0.5;
        transform: scale(0.98);
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

      .task-box-container{
        display: flex;
        flex-direction: row;
        gap: 5px;
        width: 100%;

        .task-index{
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
        }
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

      .house-number{
        font-weight: 600;
      }

      &.completed{
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

    .cdk-drag-preview {
      border: none;
      box-sizing: border-box;
      border-radius: 4px;
      box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
                  0 8px 10px 1px rgba(0, 0, 0, 0.14),
                  0 3px 14px 2px rgba(0, 0, 0, 0.12);
    }

    .cdk-drag-placeholder {
      opacity: 0;
    }

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .task-box:last-child {
      border: none;
    }

    .sorted-tasks-list.cdk-drop-list-dragging .task-box:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
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
  @Output() staffRemoved = new EventEmitter<Profile>();
  
  @ViewChild('staffContextMenu') staffContextMenu!: ContextMenu;

  selectedStaff?: Profile;
  staffMenuItems: MenuItem[] = [
    {
      label: 'Remove from Work Group',
      icon: 'pi pi-times',
      command: () => this.removeStaffFromGroup()
    }
  ];

  draggedTaskIndex: number = -1;
  isSortDialogVisible = false;
  
  // Array of 12 distinct colors for work groups
  private groupColors = [
    'rgba(50, 177, 151, 0.1)',   // Teal
    'rgba(255, 99, 71, 0.1)',    // Tomato
    'rgba(65, 105, 225, 0.1)',   // Royal Blue
    'rgba(147, 112, 219, 0.1)',  // Medium Purple
    'rgba(255, 165, 0, 0.1)',    // Orange
    'rgba(46, 139, 87, 0.1)',    // Sea Green
    'rgba(220, 20, 60, 0.1)',    // Crimson
    'rgba(0, 191, 255, 0.1)',    // Deep Sky Blue
    'rgba(255, 215, 0, 0.1)',    // Gold
    'rgba(138, 43, 226, 0.1)',   // Blue Violet
    'rgba(0, 128, 128, 0.1)',    // Teal
    'rgba(255, 69, 0, 0.1)'      // Red Orange
  ];
  
  // Array of color names matching the colors above
  private groupColorNames = [
    'Tirkizna',    // Teal
    'Narančasta',  // Tomato
    'Plava',       // Royal Blue
    'Ljubičasta',  // Medium Purple
    'Žuta',        // Orange
    'Zelena',      // Sea Green
    'Crvena',      // Crimson
    'Svijetloplava', // Deep Sky Blue
    'Zlatna',      // Gold
    'Indigo',      // Blue Violet
    'Tirkizna 2',  // Teal
    'Koraljna'     // Red Orange
  ];
  
  // Array of 12 distinct border colors for work groups
  private groupBorderColors = [
    'rgba(50, 177, 151, 0.2)',   // Teal
    'rgba(255, 99, 71, 0.2)',    // Tomato
    'rgba(65, 105, 225, 0.2)',   // Royal Blue
    'rgba(147, 112, 219, 0.2)',  // Medium Purple
    'rgba(255, 165, 0, 0.2)',    // Orange
    'rgba(46, 139, 87, 0.2)',    // Sea Green
    'rgba(220, 20, 60, 0.2)',    // Crimson
    'rgba(0, 191, 255, 0.2)',    // Deep Sky Blue
    'rgba(255, 215, 0, 0.2)',    // Gold
    'rgba(138, 43, 226, 0.2)',   // Blue Violet
    'rgba(0, 128, 128, 0.2)',    // Teal
    'rgba(255, 69, 0, 0.2)'      // Red Orange
  ];
  
  // Get the color for this work group based on its ID
  getGroupColor(): string {
    if (!this.workGroup) return 'rgba(50, 177, 151, 0.1)'; // Default teal
    const index = (this.workGroup.work_group_id - 1) % 12;
    return this.groupColors[index];
  }
  
  // Get the border color for this work group based on its ID
  getGroupBorderColor(): string {
    if (!this.workGroup) return 'rgba(50, 177, 151, 0.2)'; // Default teal
    const index = (this.workGroup.work_group_id - 1) % 12;
    return this.groupBorderColors[index];
  }

  // Get the color name for this work group based on its ID
  getGroupColorName(): string {
    if (!this.workGroup) return this.groupColorNames[0];
    const index = (this.workGroup.work_group_id - 1) % 12;
    return this.groupColorNames[index];
  }
  
  taskProgressTypes: any;
  tasks: any;
  workGroupTasks: any;
  workGroupProfiles: any;
  houses: House[] = [];
  taskTypes: TaskType[] = [];

  constructor(
    private dataService: DataService,
    private workGroupService: WorkGroupService,
    public taskService: TaskService,
    private confirmationService: ConfirmationService,
    private profileService: ProfileService,
    public houseService: HouseService,
  ) {}

  ngOnInit() {
    combineLatest([
      this.dataService.taskProgressTypes$,
      this.dataService.tasks$,
      this.dataService.workGroupTasks$,
      this.dataService.houses$,
      this.dataService.taskTypes$,
      this.dataService.workGroupProfiles$
    ]).subscribe({
      next: ([taskProgressTypes, tasks, workGroupTasks, houses, taskTypes, workGroupProfiles]) => {
        this.taskProgressTypes = taskProgressTypes;
        this.tasks = tasks;
        this.workGroupTasks = workGroupTasks;
        this.houses = houses;
        this.taskTypes = taskTypes;
        this.workGroupProfiles = workGroupProfiles;

      },
      error: (error) => {
        console.error(error);
      }
    });

    this.workGroupService.$newGroupWhileGroupActive.subscribe(res => {
      if(res){
        this.onGroupClick();
        this.workGroupService.$newGroupWhileGroupActive.next(false);
      }
    });

    if (this.workGroup) {
      this.taskService.$selectedTask.subscribe(selectedTask => {
        if(selectedTask && !this.workGroupTasks.some((wgt: any) => wgt.task_id == selectedTask.task_id)){
          const activeGroup = this.workGroupService.getActiveGroup();
          
          if(activeGroup && this.workGroup && this.workGroup?.work_group_id == activeGroup){
            this.workGroup.is_locked = false;
            let lockedTeams = this.workGroupService.getLockedTeams();
            let lockedTeam = lockedTeams.find(lockedTeam => parseInt(lockedTeam.id) == activeGroup)

            if(lockedTeam && !lockedTeam.tasks?.find(task => task.task_id == selectedTask.task_id)){
              if(selectedTask.task_progress_type_id == this.taskProgressTypes.find((taskProgressType: any) => taskProgressType.task_progress_type_name == "Nije dodijeljeno").task_progress_type_id){
                selectedTask.task_progress_type_id = this.taskProgressTypes.find((taskProgressType: any) => taskProgressType.task_progress_type_name == "Dodijeljeno").task_progress_type_id;
              }
              if(!lockedTeam.tasks){
                lockedTeam.tasks = [];
              }

              this.workGroupTasks = [...this.workGroupTasks, {
                work_group_id: activeGroup,
                task_id: selectedTask.task_id,
                index: undefined,
              }];

              lockedTeam.isLocked = false;
              lockedTeam.tasks.push(selectedTask);
              this.workGroupService.updateLockedTeam(lockedTeam);
              this.dataService.setWorkGroupTasks(this.workGroupTasks);
              this.taskService.$selectedTask.next(null);
            }
          }
        }
      });

      this.loadAssignedStaff();
    }

    if (this.workGroup){
      const workGroup = this.workGroup;

      this.profileService.$staffToAdd.subscribe(staffToAdd => {
        if(staffToAdd){
          const activeGroup = this.workGroupService.getActiveGroup();

          if(activeGroup && workGroup.work_group_id == activeGroup){
            workGroup.is_locked = false;
            let lockedTeams = this.workGroupService.getLockedTeams();
            let lockedTeam = lockedTeams.find(lockedTeam => parseInt(lockedTeam.id) == activeGroup);

            if(lockedTeam && !lockedTeam.members?.find(member => member.id == staffToAdd.id)){
              if(!lockedTeam?.members){
                lockedTeam.members = [];
              }

              this.workGroupProfiles = [...this.workGroupProfiles, {
                work_group_id: parseInt(lockedTeam.id),
                profile_id: staffToAdd.id,
              }];

              lockedTeam.isLocked = false;
              lockedTeam.members.push(staffToAdd);
              this.workGroupService.updateLockedTeam(lockedTeam);
              this.dataService.setWorkGroupProfiles(this.workGroupProfiles);
              this.profileService.$staffToAdd.next(null);
            }
          }
        }
      });
    }

    this.dataService.$workGroupProfilesUpdate.subscribe(res => {
      if(res && res.eventType == 'INSERT'){
        let lockedTeams = this.workGroupService.getLockedTeams();
        let lockedTeam = lockedTeams.find(lt => lt.id == res.new.work_group_id);

        if(lockedTeam && !lockedTeam.members?.find(member => member.id == res.new.profile_id)){
          if(!lockedTeam?.members){
            lockedTeam.members = [];
          }

          lockedTeam.isLocked = false;
          lockedTeam.members.push(res.new);

          this.workGroupService.updateLockedTeam(lockedTeam);
          this.profileService.$staffToAdd.next(null);
        }
      }
    });

    this.dataService.$workGroupTasksUpdate.subscribe(res => {
      if(res && res.eventType == 'INSERT'){
        if(!this.workGroupTasks.find((wgt: any) => wgt.task_id == res.new.task_id)){
          let lockedTeams = this.workGroupService.getLockedTeams();
          let lockedTeam = lockedTeams.find(lockedTeam => parseInt(lockedTeam.id) == res.new.work_group_id);

          if(lockedTeam && !lockedTeam.tasks?.find(task => task.task_id == res.new.task_id)){
            if(!lockedTeam.tasks){
              lockedTeam.tasks = [];
            }
            let task = this.tasks.find((task: any) => task.task_id == res.new.task_id);
  
            lockedTeam.isLocked = true;
            lockedTeam.tasks.push(task);
            this.workGroupService.updateLockedTeam(lockedTeam);
          }
        }
      } else if(res && res.eventType == 'DELETE'){
        if(this.workGroupTasks.find((wgt: any) => wgt.task_id == res.old.task_id)){
          let lockedTeams = this.workGroupService.getLockedTeams();
          let lockedTeam = lockedTeams.find(lockedTeam => parseInt(lockedTeam.id) == res.old.work_group_id);

          if(lockedTeam && !lockedTeam?.tasks){
            lockedTeam.tasks = [];
          }

          if(lockedTeam && lockedTeam?.tasks){
            lockedTeam.tasks = lockedTeam?.tasks?.filter(task => task.task_id != res.old.task_id);
            this.workGroupService.updateLockedTeam(lockedTeam);
          }
        }
      }
    });
  }

  loadAssignedStaff() {
    if (this.workGroup?.work_group_id) {
      this.dataService.getAssignedStaffForWorkGroup(this.workGroup.work_group_id)
        .subscribe(staff => {
          this.assignedStaff = staff;
        });
    }
  }

  isTaskCompleted(task: Task){
    let completedTaskProgressType = this.taskProgressTypes.find((tpt: any) => tpt.task_progress_type_name == 'Završeno');
    return completedTaskProgressType.task_progress_type_id == task.task_progress_type_id;
  }

  onGroupClick() {
    if (this.isActive) {
      if(this.workGroup){
        this.workGroupService.updateLockedTeam({
          id: this.workGroup?.work_group_id.toString(),
          name: "Team " + this.workGroup.work_group_id,
          members: this.assignedStaff,
          tasks: this.assignedTasks,
          homes: [],
          isLocked: this.workGroup.is_locked,
        });
      }

      let lockedTeams = this.workGroupService.getLockedTeams();
      let lockedWorkGroupTasks: any[] = [];
      let lockedWorkGroupProfiles: any[] = [];
      
      lockedTeams.forEach(lockedTeam => {
        lockedTeam.tasks?.forEach((task, index) => {
          lockedWorkGroupTasks.push({
            work_group_id: parseInt(lockedTeam.id),
            task_id: task.task_id,
            index: index,
          });
        });

        lockedTeam.members?.forEach(member => {
          lockedWorkGroupProfiles.push({
            work_group_id: parseInt(lockedTeam.id),
            profile_id: member.id,
          });
        })
      });

      this.dataService.setWorkGroupTasks(lockedWorkGroupTasks);
      this.dataService.setWorkGroupProfiles(lockedWorkGroupProfiles);
      this.workGroupService.setActiveGroup(undefined);
    } else {
      // If the group is not active, activate it
      this.groupSelected.emit();
    }
  }

  onDeleteClick(event: Event) {
    event.stopPropagation();

    if(this.assignedTasks && this.assignedTasks.length > 0){
      const inProgressTaskProgressType = this.taskProgressTypes.find((tpt: any) => tpt.task_progress_type_name == "U tijeku");
      const pausedTaskProgressType = this.taskProgressTypes.find((tpt: any) => tpt.task_progress_type_name == "Pauzirano");

      if(this.assignedTasks.find(task => task.task_progress_type_id == inProgressTaskProgressType.task_progress_type_id || task.task_progress_type_id == pausedTaskProgressType.task_progress_type_id)){
        this.confirmationService.confirm({
          message: `Jedan od zadataka je u tijeku. Greška prilikom brisanja grupe.`,
          header: 'Upozorenje',
          icon: 'pi pi-exclamation-triangle',
          acceptLabel: 'OK',
          rejectVisible: false,
        });

        return; 
      }
    }

    this.confirmationService.confirm({
      message: `Jeste li sigurni da želite obrisati ovu radnu grupu? <br> <b>Završeni zadaci biti će arhivirani, a nezavršeni vraćeni u status "Nije dodijeljeno".</b>`,
      header: 'Upozorenje',
      acceptLabel: 'Da',
      rejectLabel: 'Ne',
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
    let completedTaskProgressType = this.taskProgressTypes.find((tpt: any) => tpt.task_progress_type_name == 'Završeno');
    let inProgressTaskProgressType = this.taskProgressTypes.find((tpt: any) => tpt.task_progress_type_name == 'U tijeku');

    if(
      taskToRemove.task_progress_type_id == completedTaskProgressType.task_progress_type_id || 
      taskToRemove.task_progress_type_id == inProgressTaskProgressType.task_progress_type_id
    ) {
      return;
    }

    if (this.workGroup?.work_group_id) {
      if(this.workGroup.work_group_id == this.workGroupService.getActiveGroup()){
        this.workGroup.is_locked = false;
      }

      this.taskService.$taskToRemove.next(taskToRemove);
    }
  }

  onRemoveStaff(staff: Profile) {
    if (staff.id && this.workGroup?.work_group_id) {
      this.workGroupProfiles = this.workGroupProfiles.filter((wgp: any) => !(wgp.profile_id == staff.id && wgp.work_group_id == this.workGroup?.work_group_id));
      this.dataService.setWorkGroupProfiles(this.workGroupProfiles);
      this.workGroup.is_locked = false;
    }
  }

  removeStaffFromGroup() {
    if (this.selectedStaff?.id && this.workGroup?.work_group_id) {
      const operations = [
        this.dataService.removeStaffFromWorkGroup(this.selectedStaff.id, this.workGroup.work_group_id),
        this.dataService.updateWorkGroupLocked(this.workGroup.work_group_id, false)
      ];

      forkJoin(operations).subscribe({
        next: () => {
          if (this.workGroup) {
            this.workGroup.is_locked = false;
          }
          this.staffRemoved.emit(this.selectedStaff);
          this.loadAssignedStaff();
        },
        error: (error: any) => {
          console.error('Error removing staff:', error);
        }
      });
    }
  }

  onDragStart(event: any, index: number) {
    this.draggedTaskIndex = index;
    event.currentTarget.classList.add('dragging');
  }

  onDragEnd() {
    const draggingElement = document.querySelector('.dragging');
    if (draggingElement) {
      draggingElement.classList.remove('dragging');
    }
    this.draggedTaskIndex = -1;
  }

  onDrop(event: any) {
    if (this.draggedTaskIndex !== -1 && this.workGroup?.work_group_id) {
      const dropIndex = this.calculateDropIndex(event);
      if (this.draggedTaskIndex !== dropIndex) {
        const [movedTask] = this.assignedTasks.splice(this.draggedTaskIndex, 1);
        this.assignedTasks.splice(dropIndex, 0, movedTask);
        
        // Update work group to unlocked state when tasks are reordered
        this.dataService.updateWorkGroupLocked(this.workGroup.work_group_id, false)
          .subscribe({
            next: () => {
              if (this.workGroup) {
                this.workGroup.is_locked = false;
              }
            },
            error: (error: any) => {
              console.error('Error updating work group lock state:', error);
            }
          });
      }
    }
  }

  private calculateDropIndex(event: any): number {
    const taskElements = Array.from(document.querySelectorAll('.task-card-container'));
    const dropY = event.pageY;
    
    for (let i = 0; i < taskElements.length; i++) {
      const rect = taskElements[i].getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      
      if (dropY < centerY) {
        return i;
      }
    }
    
    return taskElements.length;
  }

  // Method to handle staff assignment
  onStaffAssigned(staff: Profile) {
    if (staff.id && this.workGroup?.work_group_id) {
      const operations = [
        this.dataService.assignStaffToWorkGroup(staff.id, this.workGroup.work_group_id),
        this.dataService.updateWorkGroupLocked(this.workGroup.work_group_id, false)
      ];

      forkJoin(operations).subscribe({
        next: () => {
          if (this.workGroup) {
            this.workGroup.is_locked = false;
          }
          this.loadAssignedStaff();
        },
        error: (error: any) => {
          console.error('Error assigning staff:', error);
        }
      });
    }
  }

  openSortDialog(){
    this.isSortDialogVisible = true;
  }

  drop(event: any) {
    let lockedTeam = this.workGroupService.getLockedTeams().find(lt => parseInt(lt.id) == this.workGroup?.work_group_id);

    if(this.workGroup && lockedTeam){
      this.workGroup.is_locked = false;
      lockedTeam.isLocked = false;
      this.workGroupService.updateLockedTeam(lockedTeam);
    }

    moveItemInArray(this.assignedTasks, event.previousIndex, event.currentIndex);
  }

  trackByTaskId(index: number, task: Task): number {
    return task.task_id;
  }
} 