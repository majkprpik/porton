import { Component, Input, ViewChild, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PanelModule } from 'primeng/panel';
import { ChipModule } from 'primeng/chip';
import { Profile, WorkGroup, WorkGroupProfile, ProfileRole, ProfileRoles } from '../../core/models/data.models';
import { ContextMenuModule, ContextMenu } from 'primeng/contextmenu';
import { StaffCardComponent } from './staff-card';
import { WorkGroupService } from '../../core/services/work-group.service';
import { ProfileService } from '../../core/services/profile.service';
import { combineLatest, Subject, takeUntil } from 'rxjs';
import { DataService } from '../../core/services/data.service';
import { nonNull } from '../../shared/rxjs-operators/non-null';

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
        @for (profile of availableProfiles; track profile.id) {
          <app-staff-card 
            [profile]="profile"
            [canBeAssigned]="hasActiveWorkGroup"
            (staffClicked)="onStaffClicked(profile)"
          ></app-staff-card>
        }
      </div>
    </p-panel>
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
  availableProfiles: Profile[] = [];
  workGroups: WorkGroup[] = [];
  workGroupProfiles: WorkGroupProfile[] = [];

  profileRoles: ProfileRole[] = [];
  repairProfileRoles: ProfileRole[] = [];
  cleaningProfileRoles: ProfileRole[] = [];
  profiles: Profile[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private workGroupService: WorkGroupService,
    private dataService: DataService,
    private profileService: ProfileService
  ) {
    this.monitorActiveWorkGroup(); 
  }

  ngOnInit() {
    this.availableProfiles = this.staffMembers;
    this.subscribeToDataStreams();
  }

  private monitorActiveWorkGroup() {
    this.workGroupService.activeGroupId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(groupId => {
        this.hasActiveWorkGroup = groupId !== undefined;
        if (groupId !== undefined) {
          this.updateAvailableStaff(groupId);
        } else {
          this.availableProfiles = this.staffMembers;
        }
      });
  }

  private subscribeToDataStreams() {
    combineLatest([
      this.dataService.workGroups$.pipe(nonNull()),
      this.dataService.workGroupProfiles$.pipe(nonNull()),
      this.dataService.profileRoles$.pipe(nonNull()),
      this.dataService.profiles$.pipe(nonNull()),
    ])
    .pipe(takeUntil(this.destroy$))
    .subscribe(([workGroups, workGroupProfiles, profileRoles, profiles]) => {
      this.workGroups = workGroups;
      this.workGroupProfiles = workGroupProfiles;
      this.profileRoles = profileRoles;
      this.profiles = profiles.filter(p => !p.is_deleted);

      this.repairProfileRoles = profileRoles.filter(pr =>
        pr.name === ProfileRoles.KucniMajstor || pr.name === ProfileRoles.Odrzavanje
      );

      this.cleaningProfileRoles = profileRoles.filter(pr =>
        pr.name === ProfileRoles.VoditeljDomacinstva ||
        pr.name === ProfileRoles.Sobarica ||
        pr.name === ProfileRoles.Terasar
      );
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['staffMembers']) {
      const activeGroupId = this.workGroupService.getActiveGroup();
      if (activeGroupId !== undefined) {
        this.updateAvailableStaff(activeGroupId);
      } else {
        this.availableProfiles = this.staffMembers;
      }
    }
  }

  updateAvailableStaff(workGroupId: number) {
    const filteredWorkGroupProfiles = this.workGroupService.getWorkGroupProfilesByWorkGroupId(workGroupId);
    const assignedProfiles = this.profiles.filter(profile => filteredWorkGroupProfiles.some(wgp => wgp.profile_id == profile.id));

    const selectedWorkGroup = this.workGroups.find(workGroup => workGroup.work_group_id == workGroupId);
    const selectedWorkGroupsDay = selectedWorkGroup?.created_at.split('T')[0] ?? new Date().toISOString();
    const workGroupsForSelectedDay = this.workGroups.filter(wg => wg.created_at.startsWith(selectedWorkGroupsDay));

    const workGroupProfilesForSelectedDayIds = this.workGroupProfiles
      .filter(wgp => workGroupsForSelectedDay.some(wg => wg.work_group_id == wgp.work_group_id))
      .map(wgp => {
        return wgp.profile_id;
      });

    if(selectedWorkGroup?.is_repair){
      this.staffMembers = this.staffMembers.filter(profile => this.cleaningProfileRoles.every(pr => pr.id != profile.role_id));
    } else if(!selectedWorkGroup?.is_repair){
      this.staffMembers = this.staffMembers.filter(profile => this.repairProfileRoles.every(pr => pr.id != profile.role_id));
    }

    this.availableProfiles = this.staffMembers.filter(staff => 
      staff.id && 
      !assignedProfiles.some(ap => ap.id == staff.id) && 
      !workGroupProfilesForSelectedDayIds.includes(staff.id)
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
} 