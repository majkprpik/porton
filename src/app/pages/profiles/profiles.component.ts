import { Component, OnInit } from '@angular/core';
import { DataService } from '../service/data.service';
import { Profile } from '../service/data.service';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-profiles',
  standalone: true,
  imports: [
    CommonModule, 
    TableModule, 
    ButtonModule, 
    DialogModule, 
    DropdownModule, 
    FormsModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="card">
      <h1>Upravljanje profilima</h1>
      <p-table [value]="profiles" [tableStyle]="{'min-width': '50rem'}">
        <ng-template pTemplate="header">
          <tr>
            <th>Ime</th>
            <th>Pozicija</th>
            <th>Akcije</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-profile>
          <tr>
            <td>{{ profile.first_name }} {{ profile.last_name }}</td>
            <td>{{ getRoleLabel(profile.role) }}</td>
            <td>
              <p-button 
                icon="pi pi-pencil" 
                styleClass="p-button-rounded p-button-success mr-2" 
                (click)="editProfile(profile)">
              </p-button>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog [(visible)]="profileDialog" [style]="{width: '450px'}" header="Edit Profile" [modal]="true" [contentStyle]="{overflow: 'visible'}">
      <div class="p-field" *ngIf="selectedProfile">
        <label for="role">Role</label>
        <p-dropdown 
          [options]="availableRoles" 
          [(ngModel)]="selectedProfile.role" 
          placeholder="Select a Role" 
          [showClear]="true"
          [style]="{'width':'100%'}"
          optionLabel="label"
          optionValue="value"
          appendTo="body"
          id="role">
        </p-dropdown>
      </div>
      <div class="p-dialog-footer">
        <p-button label="Cancel" icon="pi pi-times" (click)="hideDialog()" styleClass="p-button-text"></p-button>
        <p-button label="Save" icon="pi pi-check" (click)="saveProfile()" [disabled]="!selectedProfile"></p-button>
      </div>
    </p-dialog>
    
    <p-toast></p-toast>
  `,
  styles: [
    `
    .card {
      padding: 2rem;
      background-color: var(--surface-card);
      border-radius: 8px;
      box-shadow: var(--card-shadow);
    }
    
    h1 {
      margin-top: 0;
      margin-bottom: 1.5rem;
      color: var(--text-color);
    }
    
    .p-field {
      margin-bottom: 1.5rem;
    }
    
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }
    
    .p-dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      padding-top: 1.5rem;
    }
    `
  ]
})
export class ProfilesComponent implements OnInit {
  profiles: Profile[] = [];
  profileDialog: boolean = false;
  selectedProfile: Profile | null = null;
  
  availableRoles = [
    { label: 'voditelj kampa', value: 'voditelj_kampa' },
    { label: 'savjetnik uprave', value: 'savjetnik_uprave' },
    { label: 'Voditelj recepcije', value: 'voditelj_recepcije' },
    { label: 'recepcija', value: 'recepcija' },
    { label: 'customer service', value: 'customer_service' },
    { label: 'noćni recepcioner', value: 'nocni_recepcioner' },
    { label: 'prodaja', value: 'prodaja' },
    { label: 'voditelj domaćinstva', value: 'voditelj_domacinstva' },
    { label: 'sobarica', value: 'sobarica' },
    { label: 'terase', value: 'terase' },
    { label: 'kućni majstor', value: 'kucni_majstor' },
    { label: 'održavanje', value: 'odrzavanje' }
  ];

  constructor(
    private dataService: DataService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.dataService.profiles$.subscribe(profiles => {
      this.profiles = profiles.sort((a, b) => {
        const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
        const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
    });
  }

  editProfile(profile: Profile) {
    this.selectedProfile = {...profile};
    this.profileDialog = true;
  }

  hideDialog() {
    this.profileDialog = false;
    this.selectedProfile = null;
  }

  saveProfile() {
    if (this.selectedProfile && this.selectedProfile.id) {
      this.dataService.updateProfile(this.selectedProfile.id, { 
        role: this.selectedProfile.role 
      }).subscribe({
        next: (updatedProfile) => {
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Success', 
            detail: 'Profile updated successfully', 
            life: 3000 
          });
          this.profileDialog = false;
          this.selectedProfile = null;
        },
        error: (error) => {
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: 'Failed to update profile', 
            life: 3000 
          });
          console.error('Error updating profile:', error);
        }
      });
    }
  }

  getRoleLabel(roleValue: string): string {
    const role = this.availableRoles.find(r => r.value === roleValue);
    return role ? role.label : roleValue;
  }
}
