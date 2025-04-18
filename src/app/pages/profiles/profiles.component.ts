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
import { AuthService } from '../service/auth.service';

// Extended Profile interface to include the isDivider property
interface ExtendedProfile extends Profile {
  isDivider?: boolean;
  password?: string;
  email?: string;
}

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
            <th>Email</th>
            <th>Lozinka</th>
            <th>Akcije</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-profile>
          <tr [ngClass]="{'divider-row': profile.isDivider}">
            <td *ngIf="profile.isDivider" colspan="5" class="divider-cell">{{ profile.first_name }}</td>
            <ng-container *ngIf="!profile.isDivider">
              <td>{{ profile.first_name }} {{ profile.last_name }}</td>
              <td>{{ getRoleLabel(profile.role || '') }}</td>
              <td>{{ getDisplayEmail(profile.email) }}</td>
              <td>{{ profile.password || '' }}</td>
              <td>
                <p-button 
                  icon="pi pi-pencil" 
                  styleClass="p-button-rounded p-button-success mr-2" 
                  (click)="editProfile(profile)">
                </p-button>
              </td>
            </ng-container>
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
    
    .divider-row {
      background-color: var(--primary-color);
    }
    
    .divider-cell {
      font-weight: bold;
      text-align: center;
      padding: 0.75rem;
      color: white;
    }
    `
  ]
})
export class ProfilesComponent implements OnInit {
  profiles: ExtendedProfile[] = [];
  profileDialog: boolean = false;
  selectedProfile: ExtendedProfile | null = null;
  userPasswordMap: { [name: string]: string } = {};
  
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
    private messageService: MessageService,
    private authService: AuthService
  ) {
    // Create a map of user names to passwords from the auth service
    this.initializePasswordMap();
  }

  initializePasswordMap() {
    const users = [
      { name: 'Matej Adrić', password: 'NzW3dj' },
      { name: 'Marko Sovulj', password: 'uNgVn1' },
      { name: 'Mirela Dronjić', password: '2Az84E' }, 
      { name: 'Elena Rudan', password: 't3Wd6N' },
      { name: 'Simona Gjeorgievska', password: 'u2Xe7P' },
      { name: 'Mia Lukić', password: 'v1Yf8Q' },
      { name: 'Mila Malivuk', password: 'aYqv9A' },
      { name: 'Ana Perak', password: 'p9Xm2K' },
      { name: 'Mina Cvejić', password: 'k8DN4U' },
      { name: 'Mauro Boljunčić', password: 'f2Ip8A' },
      { name: 'Damir Zaharija', password: 'r7Yb5L' },
      { name: 'Ivica Nagel', password: 's4Vc8M' },
      { name: 'Liudmyla Babii', password: 'w5Zg9R' },
      { name: 'Iryna Kara', password: 'x4Ah0S' },
      { name: 'Tetiana Leonenko', password: 'y3Bi1T' },
      { name: 'Iuliia Myronova', password: 'z2Cj2U' },
      { name: 'Jasenka Savković Cvet', password: 'a1Dk3V' },
      { name: 'Nataliia Vladimyrova', password: 'b6El4W' },
      { name: 'Slavica Petković', password: 'c5Fm5X' },
      { name: 'Jelena Kaluđer', password: 'd4Gn6Y' },
      { name: 'Sandi Maružin', password: 'e3Ho7Z' },
      { name: 'Đani Guštin', password: 'g1Jq9B' },
      { name: 'Dražen Pendeš', password: 'h5Kr0C' },
      { name: 'Ivo Pranjić', password: 'i4Ls1D' },
      { name: 'Daniel Begzić', password: 'j3Mt2E' },
    ];

    users.forEach(user => {
      this.userPasswordMap[user.name] = user.password;
    });
  }

  ngOnInit() {
    this.dataService.profiles$.subscribe(profiles => {
      // Group profiles by role categories
      const managementRoles = ['voditelj_kampa', 'savjetnik_uprave'];
      const receptionRoles = ['voditelj_recepcije', 'recepcija', 'customer_service', 'nocni_recepcioner', 'prodaja'];
      const housekeepingRoles = ['voditelj_domacinstva', 'sobarica', 'terase'];
      const technicalRoles = ['kucni_majstor', 'odrzavanje'];
      
      const sortedProfiles: ExtendedProfile[] = [];
      
      // Add management profiles
      const managementProfiles = profiles
        .filter(p => p.role && managementRoles.includes(p.role))
        .sort(this.sortByName);
      if (managementProfiles.length > 0) {
        sortedProfiles.push(this.createDividerProfile('UPRAVA'));
        sortedProfiles.push(...this.addPasswordsAndEmailsToProfiles(managementProfiles));
      }
      
      // Add reception profiles
      const receptionProfiles = profiles
        .filter(p => p.role && receptionRoles.includes(p.role))
        .sort(this.sortByName);
      if (receptionProfiles.length > 0) {
        sortedProfiles.push(this.createDividerProfile('ODJEL RECEPCIJA'));
        sortedProfiles.push(...this.addPasswordsAndEmailsToProfiles(receptionProfiles));
      }
      
      // Add housekeeping profiles
      const housekeepingProfiles = profiles
        .filter(p => p.role && housekeepingRoles.includes(p.role))
        .sort(this.sortByName);
      if (housekeepingProfiles.length > 0) {
        sortedProfiles.push(this.createDividerProfile('ODJEL DOMAĆINSTVA'));
        sortedProfiles.push(...this.addPasswordsAndEmailsToProfiles(housekeepingProfiles));
      }
      
      // Add technical profiles
      const technicalProfiles = profiles
        .filter(p => p.role && technicalRoles.includes(p.role))
        .sort(this.sortByName);
      if (technicalProfiles.length > 0) {
        sortedProfiles.push(this.createDividerProfile('ODJEL TEHNIKA'));
        sortedProfiles.push(...this.addPasswordsAndEmailsToProfiles(technicalProfiles));
      }
      
      // Add any other profiles that don't fit the categories
      const otherProfiles = profiles
        .filter(p => !p.role || 
                    (!managementRoles.includes(p.role) && 
                     !receptionRoles.includes(p.role) && 
                     !housekeepingRoles.includes(p.role) && 
                     !technicalRoles.includes(p.role)))
        .sort(this.sortByName);
      if (otherProfiles.length > 0) {
        sortedProfiles.push(this.createDividerProfile('OSTALO'));
        sortedProfiles.push(...this.addPasswordsAndEmailsToProfiles(otherProfiles));
      }
      
      this.profiles = sortedProfiles;
    });
  }

  addPasswordsAndEmailsToProfiles(profiles: Profile[]): ExtendedProfile[] {
    return profiles.map(profile => {
      const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
      const extendedProfile: ExtendedProfile = {...profile};
      
      // Find the password for this profile
      extendedProfile.password = this.userPasswordMap[fullName] || '';
      
      // Generate email using the same format as in auth.service
      extendedProfile.email = this.normalizeEmail(fullName);
      
      return extendedProfile;
    });
  }

  normalizeEmail(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '').concat('@porton.com');
  }

  getDisplayEmail(email: string | undefined): string {
    if (!email) return '';
    return email.replace('@porton.com', '');
  }

  sortByName(a: Profile, b: Profile): number {
    const nameA = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
    const nameB = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
    return nameA.localeCompare(nameB);
  }

  createDividerProfile(title: string): ExtendedProfile {
    return {
      id: `divider-${title}`,
      first_name: title,
      last_name: '',
      role: '',
      isDivider: true
    };
  }

  editProfile(profile: ExtendedProfile) {
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
