import { Component, OnInit } from '@angular/core';
import { StaffGroup } from './staff-group';
import { ChipModule } from 'primeng/chip';
import { DataService, Profile, ProfileRole } from '../service/data.service';
import { CommonModule } from '@angular/common';
import { WorkGroupService } from '../service/work-group.service';

@Component({
  selector: 'app-staff-groups',
  standalone: true,
  imports: [CommonModule, StaffGroup, ChipModule],
  template: `
    <div class="staff-groups-container">
      @if (loading) {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner"></i>
          <span>Loading staff...</span>
        </div>
      } @else {
        @if (activeWorkGroupId) {
          <div class="staff-groups-header">
            <h3>Available Staff for Team {{activeWorkGroupId}}</h3>
          </div>
        }

        <app-staff-group
          groupName="ODJEL DOMAĆINSTVA"
          groupIcon="pi pi-home"
          [staffMembers]="getProfilesByRoles(housekeepingRoles)"
        ></app-staff-group>

        <app-staff-group
          groupName="ODJEL TEHNIKA"
          groupIcon="pi pi-wrench"
          [staffMembers]="getProfilesByRoles(technicalRoles)"
        ></app-staff-group>
        
        <app-staff-group
          groupName="ODJEL RECEPCIJA"
          groupIcon="pi pi-users"
          [isExpanded]="false"
          [staffMembers]="getProfilesByRoles(receptionRoles)"
        ></app-staff-group>
        
        <app-staff-group
          groupName="UPRAVA"
          groupIcon="pi pi-briefcase"
          [isExpanded]="false"
          [staffMembers]="getProfilesByRoles(managementRoles)"
        ></app-staff-group>

        <!-- @if (getProfilesByRoles(otherRoles).length > 0) {
          <app-staff-group
            groupName="OSTALO"
            groupIcon="pi pi-circle"
            [staffMembers]="getProfilesByRoles(otherRoles)"
          ></app-staff-group>
        } -->

        <!-- @if (debug) {
          <div class="debug-info">
            <h4>Debug Information</h4>
            <p>Total Profiles: {{profiles.length}}</p>
            <p>Management: {{getProfilesByRoles(managementRoles).length}}</p>
            <p>Reception: {{getProfilesByRoles(receptionRoles).length}}</p>
            <p>Housekeeping: {{getProfilesByRoles(housekeepingRoles).length}}</p>
            <p>Technical: {{getProfilesByRoles(technicalRoles).length}}</p>
            <p>Other: {{getProfilesByRoles(otherRoles).length}}</p>
            <div class="roles-list">
              <h5>Available Roles:</h5>
              <ul>
                @for (role of getUniqueRoles(); track role) {
                  <li>{{role || 'null'}}</li>
                }
              </ul>
            </div>
          </div>
        } -->
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

  // Role categories, matching the ones in ProfilesComponent
  managementRoles = ['Voditelj kampa', 'Savjetnik uprave'];
  receptionRoles = ['Voditelj recepcije', 'Recepcija', 'Korisnicka sluzba', 'Nocna recepcija', 'Prodaja'];
  housekeepingRoles = ['Voditelj domacinstva', 'Sobarica', 'Terasar'];
  technicalRoles = ['Kucni majstor', 'Odrzavanje'];
  otherRoles: string[] = [];
  profileRoles: ProfileRole[] = [];

  constructor(
    private dataService: DataService,
    private workGroupService: WorkGroupService,
  ) {}

  ngOnInit() {
    this.workGroupService.activeGroupId$.subscribe(
      (groupId: number | undefined) => {
        this.activeWorkGroupId = groupId;
      }
    );

    this.dataService.profileRoles$.subscribe(profileRoles => {
      this.profileRoles = profileRoles;
    })

    this.dataService.profiles$.subscribe({
      next: profiles => {
        //console.log('Loaded profiles:', profiles);
        this.profiles = profiles;
        this.loading = false;
      },
      error: error => {
        console.error('Error loading profiles:', error);
        this.loading = false;
      }
    });
  }

  getProfilesByRoles(roles: string[]): Profile[] {
    if (roles === this.otherRoles) {
      // For "Other" category, get profiles that don't match any of the defined categories
      return this.profiles.filter(profile => {
        if (!profile.role_id) return true;

        const roleName = this.profileRoles.find(role => role.id == profile.role_id)?.name;
        if (!roleName) return true; // Treat undefined as "other"

        return !this.managementRoles.includes(roleName) &&
              !this.receptionRoles.includes(roleName) &&
              !this.housekeepingRoles.includes(roleName) &&
              !this.technicalRoles.includes(roleName);
      })
      .sort(this.sortByName);
    }

    return this.profiles.filter(profile =>
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

  getProfilesByRole(role: string): Profile[] {
    const filteredProfiles = this.profiles.filter(profile => 
      this.profileRoles.find(role => role.id == profile.role_id)?.name?.toLowerCase() === role.toLowerCase()
    );
    //console.log(`Profiles for role ${role}:`, filteredProfiles);
    return filteredProfiles;
  }

  getUniqueRoles(): (string | null | undefined)[] {
    return Array.from(new Set(this.profiles.map(profile => this.profileRoles.find(role => role.id == profile.role_id)?.name)));
  }
} 