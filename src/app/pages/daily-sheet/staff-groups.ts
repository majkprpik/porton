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
  `
})
export class StaffGroups implements OnInit {
  loading = true;
  profiles: Profile[] = [];

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.dataService.profiles$.subscribe(
      profiles => {
        this.profiles = profiles;
        this.loading = false;
      },
      error => {
        console.error('Error loading profiles:', error);
        this.loading = false;
      }
    );
  }

  getProfilesByRole(role: string): Profile[] {
    return this.profiles.filter(profile => profile.role?.toLowerCase() === role.toLowerCase());
  }
} 