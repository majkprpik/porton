import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Profile } from '../service/data.models';
import { ProfileService } from '../service/profile.service';

@Component({
  selector: 'app-staff-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="staff-card" 
      [class.assignable]="canBeAssigned"
      [class.in-active-group]="isInActiveGroup"
      (click)="onClick($event)"
    >
      <div class="staff-icon">
        <i class="pi pi-user"></i>
      </div>
      <div class="staff-info">
        <span class="staff-name">{{ profileService.getProfileById(profile?.id)?.first_name }}</span>
      </div>
    </div>
  `,
  styles: `
    .staff-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      background: var(--surface-card);
      color: var(--text-color);
      font-size: 0.875rem;
      transition: all 0.2s;
      width: fit-content;
      transition: transform 0.1s ease;
              
      &:hover {
        transform: scale(1.03);
        cursor: pointer;
        background-color: var(--p-gray-200);
        box-shadow: var(--card-shadow);
      }

      &.assignable {
        position: relative;
        &:after {
          content: '';
          position: absolute;
          inset: 0;
          border: 2px dashed var(--primary-color);
          border-radius: 20px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        &:hover:after {
          opacity: 1;
        }
      }

      .staff-icon {
        i {
          color: var(--text-color-secondary);
        }
      }

      .staff-name {
        font-weight: 500;
      }
    }
  `
})
export class StaffCardComponent {
  @Input() profile?: Profile;
  @Input() canBeAssigned: boolean = false;
  @Input() isInActiveGroup: boolean = false;
  @Input() isClickedFromTeamDetails: boolean = false;
  
  @Output() staffClicked = new EventEmitter<void>();
  @Output() removeFromGroup = new EventEmitter<void>();

  constructor(public profileService: ProfileService) {

  }

  onClick(event: MouseEvent) {
    event.stopPropagation();
    
    if (this.isInActiveGroup && !this.isClickedFromTeamDetails) {
      this.removeFromGroup.emit();
    } else if (this.canBeAssigned) {
      this.staffClicked.emit();
    } else {
      this.profileService.$profileModalData.next(this.profile);
    }
  }
} 