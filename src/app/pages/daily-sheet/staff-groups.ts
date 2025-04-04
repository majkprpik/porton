import { Component, OnInit } from '@angular/core';
import { StaffGroup } from './staff-group';
import { ChipModule } from 'primeng/chip';
import { DataService, Profile } from '../service/data.service';
import { CommonModule } from '@angular/common';

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
        <app-staff-group
          groupName="Cleaner"
          groupIcon="pi pi-home"
          [staffMembers]="getProfilesByRole('cleaner')"
        ></app-staff-group>

        <app-staff-group
          groupName="Maintenance"
          groupIcon="pi pi-wrench"
          [staffMembers]="getProfilesByRole('maintenance')"
        ></app-staff-group>

        <!-- @if (debug) {
          <div class="debug-info">
            <h4>Debug Information</h4>
            <p>Total Profiles: {{profiles.length}}</p>
            <p>Cleaners: {{getProfilesByRole('cleaner').length}}</p>
            <p>Maintenance: {{getProfilesByRole('maintenance').length}}</p>
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

  constructor(private dataService: DataService) {}

  ngOnInit() {
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

  getProfilesByRole(role: string): Profile[] {
    const filteredProfiles = this.profiles.filter(profile => 
      profile.role?.toLowerCase() === role.toLowerCase()
    );
    //console.log(`Profiles for role ${role}:`, filteredProfiles);
    return filteredProfiles;
  }

  getUniqueRoles(): (string | null)[] {
    return Array.from(new Set(this.profiles.map(profile => profile.role)));
  }
} 