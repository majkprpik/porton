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
import { AuthService, UserToRegister } from '../service/auth.service';
import { InputTextModule } from 'primeng/inputtext';
import { ProfileService } from '../service/profile.service';

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
    ToastModule,
    InputTextModule
  ],
  providers: [MessageService],
  template: `
    <div class="card">
      <div class="title">
        <h1>Upravljanje profilima</h1>
        <button 
          class="add-button p-button-success"
          (click)="openCreateProfileWindow()"
        >
          <i class="pi pi-plus mr-2"></i> Dodaj novi profil
        </button>
      </div>
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
              <td>{{ profile.email }}</td>
              <td>{{ profile.password }}</td>
              <td>
                <p-button 
                  icon="pi pi-pencil" 
                  styleClass="p-button-rounded p-button-success mr-2" 
                  (click)="editProfile(profile)">
                </p-button>
                <p-button 
                  icon="pi pi-trash" 
                  styleClass="p-button-rounded p-button-danger mr-2" 
                  (click)="showDeleteProfile(profile)">
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

    <p-dialog [(visible)]="showDeleteProfileDialog" [style]="{width: '450px'}" header="Delete Profile" [modal]="true" [contentStyle]="{overflow: 'visible'}">
      <label>
        Are you sure you want to delete {{selectedProfile?.first_name}}'s profile?
      </label>
      <div class="p-dialog-footer">
        <p-button label="Cancel" icon="pi pi-times" (click)="hideDialog()" styleClass="p-button-text"></p-button>
        <p-button label="Delete" icon="pi pi-trash" (click)="deleteProfile(selectedProfile?.id)" styleClass="p-button-danger" [disabled]="!selectedProfile"></p-button>
      </div>
    </p-dialog>

     <p-dialog [(visible)]="showNewProfileDialog" [style]="{width: '450px'}" header="Create New Profile" [modal]="true" [contentStyle]="{overflow: 'visible'}">
       <div class="field">
          <label for="firstName">Full Name</label>
          <input id="firstName" type="text" pInputText [(ngModel)]="newProfile.name" />
       </div>
       <div class="field">
          <label for="firstName">Password</label>
          <input id="firstName" type="text" pInputText [(ngModel)]="newProfile.password" />
       </div>
      <div class="p-field">
        <label for="role">Role</label>
        <p-dropdown 
          [options]="availableRoles" 
          [(ngModel)]="newProfile.role" 
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
        <p-button label="Save" icon="pi pi-check" (click)="createProfile()" [disabled]="!isNewProfileValid()"></p-button>
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

      .title{
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        width: 100%;

        .add-button {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          border: none;
          background-color: #4CAF50;
          color: white;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background-color 0.2s;
          height: 40px;
        }

        .add-button:hover {
          background-color: #45a049;
        }
      }
    }
    
    h1 {
      margin-top: 0;
      margin-bottom: 1.5rem;
      color: var(--text-color);
    }
    
    .p-field {
      margin-bottom: 1.5rem;
    }

    .field{
      margin-bottom: 10px;

      input{
        width: 100%;
      }
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
  showNewProfileDialog: boolean = false;
  showDeleteProfileDialog: boolean = false;
  selectedProfile: ExtendedProfile | null = null;
  userPasswordMap: { [name: string]: string } = {};
  newProfileRole: string = '';
  newProfile: UserToRegister = { name: '', password: '', role: '' };
  
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
    private authService: AuthService,
    private profileService: ProfileService
  ) {
    // Create a map of user names to passwords from the auth service
    // this.initializePasswordMap();
  }

  // initializePasswordMap() {
  //   const users = [
  //     { name: 'Matej Adrić', password: 'NzW3dj' },
  //     { name: 'Marko Sovulj', password: 'uNgVn1' },
  //     { name: 'Mirela Dronjić', password: '2Az84E' }, 
  //     { name: 'Elena Rudan', password: 't3Wd6N' },
  //     { name: 'Simona Gjeorgievska', password: 'u2Xe7P' },
  //     { name: 'Mia Lukić', password: 'v1Yf8Q' },
  //     { name: 'Mila Malivuk', password: 'aYqv9A' },
  //     { name: 'Ana Perak', password: 'p9Xm2K' },
  //     { name: 'Mina Cvejić', password: 'k8DN4U' },
  //     { name: 'Mauro Boljunčić', password: 'f2Ip8A' },
  //     { name: 'Damir Zaharija', password: 'r7Yb5L' },
  //     { name: 'Ivica Nagel', password: 's4Vc8M' },
  //     { name: 'Liudmyla Babii', password: 'w5Zg9R' },
  //     { name: 'Iryna Kara', password: 'x4Ah0S' },
  //     { name: 'Tetiana Leonenko', password: 'y3Bi1T' },
  //     { name: 'Iuliia Myronova', password: 'z2Cj2U' },
  //     { name: 'Jasenka Savković Cvet', password: 'a1Dk3V' },
  //     { name: 'Nataliia Vladimyrova', password: 'b6El4W' },
  //     { name: 'Slavica Petković', password: 'c5Fm5X' },
  //     { name: 'Jelena Kaluđer', password: 'd4Gn6Y' },
  //     { name: 'Sandi Maružin', password: 'e3Ho7Z' },
  //     { name: 'Đani Guštin', password: 'g1Jq9B' },
  //     { name: 'Dražen Pendeš', password: 'h5Kr0C' },
  //     { name: 'Ivo Pranjić', password: 'i4Ls1D' },
  //     { name: 'Daniel Begzić', password: 'j3Mt2E' },
  //   ];

  //   users.forEach(user => {
  //     this.userPasswordMap[user.name] = user.password;
  //   });
  // }

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
      // extendedProfile.password = this.userPasswordMap[fullName] || '';
      
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

  showDeleteProfile(profile: ExtendedProfile){
    this.selectedProfile = {...profile};
    this.showDeleteProfileDialog = true;
  }

  deleteProfile(profileId: string | undefined){
    if(profileId){
      this.profileService.deleteProfile(profileId);
    }

    this.selectedProfile = null;
    this.showDeleteProfileDialog = false;
  }

  hideDialog() {
    this.profileDialog = false;
    this.showDeleteProfileDialog = false;
    this.selectedProfile = null;

    this.showNewProfileDialog = false;
    this.newProfile = { name: '', password: '', role: '' };
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

  createProfile(){
    if (this.isNewProfileValid()) {
      this.authService.createUser(this.newProfile)
        .then(res => {
          if(res) {
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Success', 
              detail: 'Profile created successfully', 
              life: 3000 
            });
            this.showNewProfileDialog = false;
            this.newProfile = { name: '', password: '', role: '' };
          }
        })
        .catch(error => {
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: 'Failed to create profile', 
            life: 3000 
          });
          console.error('Error creating profile:', error);
        }
      );
    }
  }

  isNewProfileValid(){
    return this.newProfile.name?.trim() && this.newProfile.password?.trim() && this.newProfile.role && this.newProfile.role?.trim();
  }

  getRoleLabel(roleValue: string): string {
    const role = this.availableRoles.find(r => r.value === roleValue);
    return role ? role.label : roleValue;
  }

  openCreateProfileWindow(){
    this.showNewProfileDialog = true;
    this.newProfile.password = this.authService.generateRandomPassword();
  }
}
