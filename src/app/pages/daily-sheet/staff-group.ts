import { Component, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PanelModule } from 'primeng/panel';
import { ChipModule } from 'primeng/chip';
import { Profile } from '../service/data.service';
import { ContextMenuModule, ContextMenu } from 'primeng/contextmenu';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-staff-group',
  standalone: true,
  imports: [CommonModule, PanelModule, ChipModule, ContextMenuModule],
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
        <p-chip 
          *ngFor="let member of staffMembers" 
          [label]="getProfileDisplayName(member)"
          icon="pi pi-user"
          class="staff-chip"
          (contextmenu)="onContextMenu($event, member)"
        ></p-chip>
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
          .p-chip {
            background: var(--surface-card);
            border: 2px solid transparent;
            &:hover {
              border-color: var(--primary-color);
              background: var(--surface-hover);
            }
          }
        }

        &.maintenance-group {
          .p-panel-header {
            background: var(--surface-ground);
          }
          .p-chip {
            background: var(--surface-card);
            border: 2px solid transparent;
            &:hover {
              border-color: var(--primary-color);
              background: var(--surface-hover);
            }
          }
        }

        .staff-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          padding: 0.5rem;
        }

        .staff-chip {
          .p-chip {
            border: 2px solid transparent;
            background: var(--surface-card);
            cursor: pointer;
            transition: all 0.2s;

            &:hover {
              border-color: var(--primary-color);
              background: var(--surface-hover);
              transform: translateY(-1px);
              box-shadow: var(--card-shadow);
            }
          }
          .p-chip-text {
            color: var(--text-color);
          }
          .p-chip-icon {
            color: var(--text-color);
            margin-right: 0.5rem;
          }
        }
      }
    }

    .group-icon {
      font-size: 1.2rem;
      color: var(--text-color);
    }

    .group-name {
      font-weight: 600;
      color: var(--text-color);
    }
  `
})
export class StaffGroup {
  @Input() groupName: string = '';
  @Input() groupIcon: string = '';
  @Input() staffMembers: Profile[] = [];
  @ViewChild('cm') contextMenu!: ContextMenu;
  
  isExpanded: boolean = true;
  selectedProfile?: Profile;
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

  handleCollapsedChange(collapsed: boolean) {
    this.isExpanded = !collapsed;
  }

  getProfileDisplayName(profile: Profile): string {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    } else if (profile.first_name) {
      return profile.first_name;
    } else if (profile.last_name) {
      return profile.last_name;
    } else {
      return 'Unknown';
    }
  }

  onContextMenu(event: MouseEvent, profile: Profile) {
    event.preventDefault();
    this.selectedProfile = profile;
    this.contextMenu.show(event);
  }

  viewProfile() {
    if (this.selectedProfile) {
      console.log('View profile:', this.selectedProfile);
      // Implement view profile logic
    }
  }

  editProfile() {
    if (this.selectedProfile) {
      console.log('Edit profile:', this.selectedProfile);
      // Implement edit profile logic
    }
  }

  removeFromGroup() {
    if (this.selectedProfile) {
      console.log('Remove from group:', this.selectedProfile);
      // Implement remove from group logic
    }
  }
} 