import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Profile } from '../service/data.service';

@Component({
  selector: 'app-staff-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="staff-card" 
      [class.assignable]="canBeAssigned"
      (click)="onClick()"
    >
      <div class="staff-icon">
        <i class="pi pi-user"></i>
      </div>
      <div class="staff-info">
        <span class="staff-name">{{getStaffName()}}</span>
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
      cursor: pointer;
      transition: all 0.2s;
      width: fit-content;

      &:hover {
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
  @Input() staff?: Profile;
  @Input() canBeAssigned: boolean = false;
  
  @Output() staffClicked = new EventEmitter<void>();

  onClick() {
    if (this.canBeAssigned) {
      this.staffClicked.emit();
    }
  }

  getStaffName(): string {
    if (!this.staff) return 'Unknown';
    return `${this.staff.first_name} ${this.staff.last_name}`.trim() || 'Unknown';
  }
} 