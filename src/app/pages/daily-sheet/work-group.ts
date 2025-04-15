import { Component, Input, Output, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Task, Profile, DataService, House, TaskType } from '../service/data.service';
import { TaskCardComponent } from './task-card';
import { TagModule } from 'primeng/tag';
import { StaffCardComponent } from './staff-card';
import { MenuItem } from 'primeng/api';
import { ContextMenu, ContextMenuModule } from 'primeng/contextmenu';
import { forkJoin } from 'rxjs';
import { WorkGroupService } from './work-group.service';
import { TooltipModule } from 'primeng/tooltip';
import { DragDropModule } from 'primeng/dragdrop';
import { TaskService } from '../service/task.service';
import { WorkGroupService } from '../service/work-group.service';

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
    DragDropModule
  ],
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
                    [houseNumber]="getHouseNumber(task.house_id)"
                    [state]="'in-progress'"
                    [taskIcon]="getTaskIcon(task.task_type_id)"
                    [isInActiveGroup]="isActive"
                    (removeFromGroup)="onRemoveTask(task)">
                  </app-task-card>
                </div>
              }
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

    <p-contextMenu #staffContextMenu [model]="staffMenuItems"></p-contextMenu>
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
  `
})
export class WorkGroup implements OnInit {
  @Input() workGroup?: { work_group_id: number; is_locked: boolean };
  @Input() isActive: boolean = false;
  @Input() assignedTasks: Task[] = [];
  @Input() assignedStaff: Profile[] = [];
  
  @Output() groupSelected = new EventEmitter<void>();
  @Output() deleteClicked = new EventEmitter<void>();
  @Output() taskRemoved = new EventEmitter<Task>();
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
  houses: House[] = [];
  taskTypes: TaskType[] = [];

  constructor(
    private dataService: DataService,
    private workGroupService: WorkGroupService,
    private taskService: TaskService,
  ) {}

  ngOnInit() {
    this.dataService.taskProgressTypes$.subscribe(taskProgressTypes => {
      this.taskProgressTypes = taskProgressTypes;
    });

    this.dataService.tasks$.subscribe(tasks => {
      this.tasks = tasks;
    });

    this.dataService.workGroupTasks$.subscribe(workGroupTasks => {
      this.workGroupTasks = workGroupTasks;
    });

    this.dataService.houses$.subscribe(houses => {
      this.houses = houses;
    });

    this.dataService.taskTypes$.subscribe(taskTypes => {
      this.taskTypes = taskTypes;
    });

    if (this.workGroup) {
      const workGroup = this.workGroup;

      this.taskService.$selectedTask.subscribe(selectedTask => {
        if(selectedTask){
          const activeGroup = this.workGroupService.getActiveGroup();
          
          if(activeGroup && workGroup?.work_group_id == activeGroup){
            workGroup.is_locked = false;
            let lockedTeams = this.workGroupService.getLockedTeams();
            let lockedTeam = lockedTeams.find(lockedTeam => parseInt(lockedTeam.id) == activeGroup)
            if(lockedTeam && !lockedTeam.tasks?.find(task => task.task_id == selectedTask.task_id)){
              if(selectedTask.task_progress_type_id == this.taskProgressTypes.find((taskProgressType: any) => taskProgressType.task_progress_type_name == "Nije dodijeljeno").task_progress_type_id){
                selectedTask.task_progress_type_id = this.taskProgressTypes.find((taskProgressType: any) => taskProgressType.task_progress_type_name == "Dodijeljeno").task_progress_type_id;
              }
              if(!lockedTeam.tasks){
                lockedTeam.tasks = [];
              }
              lockedTeam.isLocked = false;
              lockedTeam.tasks.push(selectedTask);
              this.workGroupService.updateLockedTeam(lockedTeam);
            }
          }
        }
      });

      this.loadAssignedStaff();
    }
  }

  getHouseNumber(houseId: number){
    return this.houses.find(house => house.house_id == houseId)?.house_number ?? 0;
  }

  loadAssignedStaff() {
    if (this.workGroup?.work_group_id) {
      this.dataService.getAssignedStaffForWorkGroup(this.workGroup.work_group_id)
        .subscribe(staff => {
          this.assignedStaff = staff;
        });
    }
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
      
      lockedTeams.forEach(lockedTeam => {
        lockedTeam.tasks?.forEach((task, index) => {
          lockedWorkGroupTasks.push({
            work_group_id: parseInt(lockedTeam.id),
            task_id: task.task_id,
            index: index,
          });
        });
      });

      this.dataService.updateWorkGroupTasks(lockedWorkGroupTasks);
      this.workGroupService.setActiveGroup(undefined);
    } else {
      // If the group is not active, activate it
      this.groupSelected.emit();
    }
  }

  onDeleteClick(event: Event) {
    event.stopPropagation();
    this.deleteClicked.emit();
  }

  onStaffContextMenu(event: MouseEvent, staff: Profile) {
    event.preventDefault();
    event.stopPropagation();
    this.selectedStaff = staff;
    this.staffContextMenu.show(event);
  }

  onRemoveTask(taskToRemove: Task) {
    if (this.workGroup?.work_group_id) {
      if(this.workGroup.work_group_id == this.workGroupService.getActiveGroup()){
        this.workGroup.is_locked = false;
      }

      this.taskService.$taskToRemove.next(taskToRemove);
      let lockedTeams = this.workGroupService.getLockedTeams();
      let lockedTeam = lockedTeams.find(lockedTeam => parseInt(lockedTeam.id) == this.workGroup?.work_group_id)

      if(lockedTeam?.tasks){
        lockedTeam.tasks = lockedTeam.tasks.filter(task => task.task_id != taskToRemove.task_id);
        const nijeDodijeljenoType = this.taskProgressTypes.find((taskProgressType: any) => taskProgressType.task_progress_type_name == "Nije dodijeljeno");
        if (nijeDodijeljenoType) {
          // Directly update the task progress type to "Nije dodijeljeno"
          this.dataService.updateTaskProgressType1(taskToRemove.task_id, nijeDodijeljenoType.task_progress_type_id)
            .then(() => {
              // Emit the task to parent component
              this.taskRemoved.emit(taskToRemove);
            })
            .catch(error => {
              console.error('Error updating task progress type:', error);
            });
          
          // Also update local state
          if (taskToRemove.task_progress_type_id == this.taskProgressTypes.find((taskProgressType: any) => 
            taskProgressType.task_progress_type_name == "Dodijeljeno").task_progress_type_id) {
            let task = this.tasks.find((task: any) => task.task_id == taskToRemove.task_id);
            if (task) {
              task.task_progress_type_id = nijeDodijeljenoType.task_progress_type_id;
            }
          }
        }
        lockedTeam.isLocked = false;
        this.workGroupService.updateLockedTeam(lockedTeam);
      }
    }
  }

  onRemoveStaff(staff: Profile) {
    if (staff.id && this.workGroup?.work_group_id) {
      const operations = [
        this.dataService.removeStaffFromWorkGroup(staff.id, this.workGroup.work_group_id),
        this.dataService.updateWorkGroupLocked(this.workGroup.work_group_id, false)
      ];

      forkJoin(operations).subscribe({
        next: () => {
          if (this.workGroup) {
            this.workGroup.is_locked = false;
          }
          this.staffRemoved.emit(staff);
        },
        error: (error: any) => {
          console.error('Error removing staff:', error);
        }
      });
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

  getTaskIcon(taskTypeId: number): string {
    switch(taskTypeId){
      case this.taskTypes.find(tt => tt.task_type_name == "Čišćenje kućice")?.task_type_id: 
        return 'pi pi-home';
      case this.taskTypes.find(tt => tt.task_type_name == "Čišćenje terase")?.task_type_id: 
        return 'pi pi-table';
      case this.taskTypes.find(tt => tt.task_type_name == "Mijenjanje posteljine")?.task_type_id: 
        return 'pi pi-inbox';
      case this.taskTypes.find(tt => tt.task_type_name == "Mijenjanje ručnika")?.task_type_id: 
        return 'pi pi-bookmark';
      case this.taskTypes.find(tt => tt.task_type_name == "Popravak")?.task_type_id: 
        return 'pi pi-wrench';
      default: 
        return 'pi pi-file';
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
} 