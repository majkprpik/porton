import { Component, OnInit } from '@angular/core';
import { StaffGroup } from './staff-group';
import { ChipModule } from 'primeng/chip';
import { Profile, ProfileRole, ProfileRoles } from '../service/data.models';
import { CommonModule } from '@angular/common';
import { WorkGroupService } from '../service/work-group.service';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { combineLatest } from 'rxjs';
import { DataService } from '../service/data.service';

@Component({
  selector: 'app-staff-groups',
  standalone: true,
  imports: [
    CommonModule, 
    StaffGroup, 
    ChipModule,
    TranslateModule,
    FormsModule,
    InputTextModule,
  ],
  template: `
    <div class="staff-groups-container">
      @if (loading) {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner"></i>
          <span>{{ 'DAILY-SHEET.STAFF.LOADING' | translate }}</span>
        </div>
      } @else {
        @if (activeWorkGroupId) {
          <div class="staff-groups-header">
            <h3>{{ 'DAILY-SHEET.STAFF.AVAILABLE-STAFF' | translate }}{{activeWorkGroupId}}</h3>
          </div>
        }

        <div class="staff-controls">
          <div class="search-container">
            <input 
              type="text"
              pInputText 
              [placeholder]="'DAILY-SHEET.STAFF.SEARCH-STAFF' | translate" 
              [(ngModel)]="searchTerm"
              [min]="0"
            >
          </div>
        </div>

        <app-staff-group
          [groupName]="'DAILY-SHEET.STAFF.HOUSEKEEPING' | translate"
          groupIcon="pi pi-home"
          [staffMembers]="getProfilesByRoles(housekeepingRoles)"
        ></app-staff-group>

        <app-staff-group
          [groupName]="'DAILY-SHEET.STAFF.TECHNICAL-DEPARTMENT' | translate"
          groupIcon="pi pi-wrench"
          [staffMembers]="getProfilesByRoles(technicalRoles)"
        ></app-staff-group>
        
        <app-staff-group
          [groupName]="'DAILY-SHEET.STAFF.RECEPTION' | translate"
          groupIcon="pi pi-users"
          [isExpanded]="false"
          [staffMembers]="getProfilesByRoles(receptionRoles)"
        ></app-staff-group>
        
        <app-staff-group
          [groupName]="'DAILY-SHEET.STAFF.MANAGEMENT' | translate"
          groupIcon="pi pi-briefcase"
          [isExpanded]="false"
          [staffMembers]="getProfilesByRoles(managementRoles)"
        ></app-staff-group>
      }
    </div>
  `,
  styles: `
    .staff-groups-container {
      height: 100%;
      padding: 1rem;
      background-color: var(--surface-card);
      border-radius: 8px;
      overflow-y: auto;

      .staff-controls{
        padding-bottom: 10px;
        display: flex;
        flex-direction: row; 
        align-items: center;
        justify-content: space-between;

        .search-container{
          width: 100%;

          input{
            width: 100%;
          }
        }
      }
    }

    .staff-groups-header {
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--surface-border);

      h3 {
        margin: 0;
        color: var(--text-color);
        font-size: 1.2rem;
        font-weight: 600;
      }
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: var(--text-color-secondary);

      i {
        font-size: 2rem;
        margin-bottom: 1rem;
      }
    }

    .debug-info {
      margin-top: 2rem;
      padding: 1rem;
      background: var(--surface-ground);
      border-radius: 4px;

      h4, h5 {
        margin: 0 0 0.5rem 0;
        color: var(--text-color);
      }

      p {
        margin: 0.25rem 0;
        color: var(--text-color-secondary);
      }

      .roles-list {
        margin-top: 1rem;

        ul {
          margin: 0;
          padding-left: 1.5rem;
          color: var(--text-color-secondary);
        }
      }
    }
  `
})
export class StaffGroups implements OnInit {
  loading = true;
  profiles: Profile[] = [];
  debug = true; // Enable debug mode
  activeWorkGroupId?: number;

  managementRoles: string[] = [ProfileRoles.VoditeljKampa, ProfileRoles.SavjetnikUprave, ProfileRoles.Uprava];
  receptionRoles: string[] = [ProfileRoles.VoditeljRecepcije, ProfileRoles.Recepcija, ProfileRoles.KorisnickaSluzba, ProfileRoles.NocnaRecepcija, ProfileRoles.Prodaja];
  housekeepingRoles: string[] = [ProfileRoles.VoditeljDomacinstva, ProfileRoles.Sobarica, ProfileRoles.Terasar];
  technicalRoles: string[] = [ProfileRoles.KucniMajstor, ProfileRoles.Odrzavanje];
  otherRoles: string[] = [ProfileRoles.Ostalo];
  profileRoles: ProfileRole[] = [];

  searchTerm: string = '';

  constructor(
    private dataService: DataService,
    private workGroupService: WorkGroupService,
  ) {}

  ngOnInit() {
    this.workGroupService.activeGroupId$.subscribe((groupId: number | undefined) => {
        this.activeWorkGroupId = groupId;
      }
    );

    combineLatest([
      this.dataService.profileRoles$,
      this.dataService.profiles$
    ]).subscribe({
      next: ([profileRoles, profiles]) => {
        this.profileRoles = profileRoles;
        this.profiles = profiles;
        
        this.loading = false;
      },
      error: error => {
        console.error('Error loading data:', error);
        this.loading = false;
      }
    });
  }

  getProfilesByRoles(roles: string[]): Profile[] {
    const searchTermLower = this.searchTerm?.toLowerCase() || '';

    const filtered = this.profiles.filter(profile =>
      !searchTermLower || profile.first_name?.toLowerCase().includes(searchTermLower)
    );

    if (roles.some(role => this.otherRoles.includes(role))) {
      return filtered.filter(profile => {
        if (!profile.role_id) {
          return true;
        }

        const roleName = this.profileRoles.find(role => role.id == profile.role_id)?.name;

        if (!roleName) {
          return true;
        } 

        return !this.managementRoles.includes(roleName) &&
               !this.receptionRoles.includes(roleName) &&
               !this.housekeepingRoles.includes(roleName) &&
               !this.technicalRoles.includes(roleName);
        }
      ).sort(this.sortByName);
    }

    return filtered.filter(profile =>
      roles.some(roleName =>
        this.profileRoles.find(role => role.name === roleName)?.id === profile.role_id
      )
    ).sort(this.sortByName);
  }

  sortByName(a: Profile, b: Profile): number {
    const nameA = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
    const nameB = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
    return nameA.localeCompare(nameB);
  }
} 