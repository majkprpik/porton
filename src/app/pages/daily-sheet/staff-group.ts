import { Component, Input, ViewChild, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PanelModule } from 'primeng/panel';
import { ChipModule } from 'primeng/chip';
import { Profile, DataService } from '../service/data.service';
import { ContextMenuModule, ContextMenu } from 'primeng/contextmenu';
import { MenuItem } from 'primeng/api';
import { StaffCardComponent } from './staff-card';
import { WorkGroupService } from '../service/work-group.service';
import { ProfileService } from '../service/profile.service';

@Component({
  selector: 'app-staff-group',
  standalone: true,
  imports: [CommonModule, PanelModule, ChipModule, ContextMenuModule, StaffCardComponent],
  template: `
    <p-panel 
      [toggleable]="true" 
      [collapsed]="!isExpanded"
      (collapsedChange)="handleCollapsedChange($event)"
      class="staff-group"
      [class.cleaner-group]="groupName === 'Cleaner'" 
      [class.maintenance-group]="groupName === 'Maintenance'"
    >
      <ng-template pTemplate="header">
        <div class="flex align-items-center">
          <i class="group-icon mr-2" [class]="groupIcon"></i>
          <span class="group-name">{{groupName}}</span>
        </div>
      </ng-template>
      <div class="staff-list">
        @for (member of availableStaff; track member.id) {
          <app-staff-card 
            [staff]="member"
            [canBeAssigned]="hasActiveWorkGroup"
            (staffClicked)="onStaffClicked(member)"
          ></app-staff-card>
        }
      </div>
    </p-panel>

    <p-contextMenu #cm [model]="menuItems"></p-contextMenu>
  `,
  styles: `
    :host ::ng-deep {
      .staff-group {
        margin-bottom: 0.5rem;

        .p-panel {
          background: transparent;
          margin-bottom: 0.5rem;
        }

        .p-panel-header {
          padding: 0.75rem 1.25rem;
          border: none;
          border-radius: 6px;
          background: var(--surface-ground);
          height: 40px;
        }

        .p-panel-content {
          padding: 1rem;
          border: none;
          background: transparent !important;
        }

        .p-panel-icons {
          order: 2;
        }

        &.cleaner-group {
          .p-panel-header {
            background: var(--surface-ground);
          }
        }

        &.maintenance-group {
          .p-panel-header {
            background: var(--surface-ground);
          }
        }

        .staff-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          padding: 0.5rem;
        }
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
  `
})
export class StaffGroup implements OnInit, OnChanges {
  @Input() groupName: string = '';
  @Input() groupIcon: string = '';
  @Input() staffMembers: Profile[] = [];
  @Input() isExpanded: boolean = true;
  @ViewChild('cm') contextMenu!: ContextMenu;
  
  selectedProfile?: Profile;
  hasActiveWorkGroup: boolean = false;
  availableStaff: Profile[] = [];

  menuItems: MenuItem[] = [
    {
      label: 'View Profile',
      icon: 'pi pi-user',
      command: () => this.viewProfile()
    },
    {
      label: 'Edit',
      icon: 'pi pi-pencil',
      command: () => this.editProfile()
    },
    { separator: true },
    {
      label: 'Remove from Group',
      icon: 'pi pi-times',
      command: () => this.removeFromGroup()
    }
  ];

  constructor(
    private workGroupService: WorkGroupService,
    private dataService: DataService,
    private profileService: ProfileService
  ) {
    this.workGroupService.activeGroupId$.subscribe(
      groupId => {
        this.hasActiveWorkGroup = groupId !== undefined;
        if (groupId !== undefined) {
          this.updateAvailableStaff(groupId);
        } else {
          this.availableStaff = this.staffMembers;
        }
      }
    );
  }

  ngOnInit() {
    this.availableStaff = this.staffMembers;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['staffMembers']) {
      const activeGroupId = this.workGroupService.getActiveGroup();
      if (activeGroupId !== undefined) {
        this.updateAvailableStaff(activeGroupId);
      } else {
        this.availableStaff = this.staffMembers;
      }
    }
  }

  updateAvailableStaff(workGroupId: number) {
    this.dataService.getAssignedStaffForWorkGroup(workGroupId).subscribe(assignedStaff => {
        const assignedIds = assignedStaff.map(staff => staff.id);
        this.availableStaff = this.staffMembers.filter(
          staff => staff.id && !assignedIds.includes(staff.id)
        );
      }
    );
  }

  handleCollapsedChange(collapsed: boolean) {
    this.isExpanded = !collapsed;
  }

  onContextMenu(event: MouseEvent, profile: Profile) {
    event.preventDefault();
    this.selectedProfile = profile;
    this.contextMenu.show(event);
  }

  onStaffClicked(staff: Profile) {
    const activeGroupId = this.workGroupService.getActiveGroup();
    if (activeGroupId !== undefined && staff.id) {
      this.profileService.$staffToAdd.next(staff);
      this.updateAvailableStaff(activeGroupId);
    }
  }

  viewProfile() {
    if (this.selectedProfile) {
      //console.log('View profile:', this.selectedProfile);
      // Implement view profile logic
    }
  }

  editProfile() {
    if (this.selectedProfile) {
      //console.log('Edit profile:', this.selectedProfile);
      // Implement edit profile logic
    }
  }

  removeFromGroup() {
    if (this.selectedProfile) {
      //console.log('Remove from group:', this.selectedProfile);
      // Implement remove from group logic
    }
  }
} 