import { Component, OnInit } from '@angular/core';
import { ProfileRole, Profile, ProfileRoles, UserToRegister } from '../../core/models/data.models';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { InputTextModule } from 'primeng/inputtext';
import { ProfileService } from '../../core/services/profile.service';
import { combineLatest, Subject, takeUntil } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SelectModule } from 'primeng/select';
import { LanguageService } from '../../core/services/language.service';
import { DataService } from '../../core/services/data.service';

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
    FormsModule,
    ToastModule,
    InputTextModule,
    TranslateModule,
    SelectModule,
  ],
  providers: [MessageService],
  template: `
    <div class="card">
      <div class="title">
        <h1>{{ 'PROFILE-MANAGEMENT.TITLE' | translate }}</h1>
        <button 
          class="add-button p-button-success"
          (click)="openCreateProfileWindow()"
        >
          <i class="pi pi-plus mr-2"></i> {{ 'PROFILE-MANAGEMENT.ADD-NEW-PROFILE' | translate }}
        </button>
      </div>
      <p-table [value]="profiles" [tableStyle]="{'min-width': '50rem'}">
        <ng-template pTemplate="header">
          <tr>
            <th>{{ 'PROFILE-MANAGEMENT.TABLE-COLUMNS.NAME' | translate }}</th>
            <th>{{ 'PROFILE-MANAGEMENT.TABLE-COLUMNS.POSITION' | translate }}</th>
            <th>{{ 'PROFILE-MANAGEMENT.TABLE-COLUMNS.EMAIL' | translate }}</th>
            <th>{{ 'PROFILE-MANAGEMENT.TABLE-COLUMNS.PASSWORD' | translate }}</th>
            <th>{{ 'PROFILE-MANAGEMENT.TABLE-COLUMNS.ACTIONS' | translate }}</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-profile>
          <tr [ngClass]="{'divider-row': profile.isDivider}">
            @if(profile.isDivider){
              <td colspan="5" class="divider-cell">{{ 'PROFILE-DEPARTMENTS.' + profile.first_name | translate }}</td>
            }
            @if(!profile.isDivider){
              <td>{{ profile.first_name }} {{ profile.last_name }}</td>
              <td>{{ 'PROFILE-ROLES.' + getProfileRoleNameById(profile.role_id) | translate }}</td>
              <td>{{ profile.email }}</td>
              <td>{{ profile.password }}</td>
              <td>
                <p-button 
                  icon="pi pi-pencil" 
                  styleClass="p-button-rounded p-button-success mr-2" 
                  (click)="editProfile(profile)">
                </p-button>
                <p-button 
                  [disabled]="profile.id == authService.getStoredUserId()"
                  icon="pi pi-trash" 
                  styleClass="p-button-rounded p-button-danger mr-2" 
                  (click)="profile.id !== authService.getStoredUserId() && showDeleteProfile(profile)">
                </p-button>
              </td>
            }
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog 
      [(visible)]="profileDialog" 
      [style]="{width: '450px'}" 
      [header]="'PROFILE-MANAGEMENT.EDIT.TITLE' | translate" 
      [modal]="true" 
      [contentStyle]="{overflow: 'visible'}"
    >
      @if(selectedProfile){
        <div class="field">
          <label for="firstName">{{ 'PROFILE-MANAGEMENT.ADD.FULL-NAME' | translate }}</label>
          <input id="firstName" type="text" pInputText [(ngModel)]="selectedProfile.first_name" />
       </div>
        <div class="p-field">
          <label for="role">Role</label>
          <p-select 
            [options]="profileRoles" 
            [(ngModel)]="selectedProfile.role_id" 
            placeholder="Select a Role" 
            [style]="{'width':'100%'}"
            optionLabel="translatedName"
            optionValue="id"
            appendTo="body"
            id="role"
          >
          </p-select>
        </div>
        @if(profileService.getProfileById(authService.getStoredUserId())?.is_test_user){
          <div class="field">
            <label for="isTestUser">{{ 'PROFILE-MANAGEMENT.ADD.IS-TEST-USER' | translate }}</label>
            <p-select 
              [options]="[true, false]" 
              [(ngModel)]="selectedProfile.is_test_user" 
              [style]="{'width':'100%'}"
              appendTo="body"
              id="isTestUser"
            >
            </p-select>
          </div>
        }
      }
      <div class="p-dialog-footer">
        <p-button [label]="'BUTTONS.CANCEL' | translate" icon="pi pi-times" (click)="hideDialog()" styleClass="p-button-text"></p-button>
        <p-button [label]="'BUTTONS.SAVE' | translate" icon="pi pi-check" (click)="saveProfile()" [disabled]="!selectedProfile"></p-button>
      </div>
    </p-dialog>

    <p-dialog [(visible)]="showDeleteProfileDialog" [style]="{width: '450px'}" [header]="'PROFILE-MANAGEMENT.DELETE.HEADER' | translate" [modal]="true" [contentStyle]="{overflow: 'visible'}">
      <label>
        {{ 'PROFILE-MANAGEMENT.DELETE.MESSAGE' | translate }} {{ selectedProfile.first_name }}?
      </label>
      <div class="p-dialog-footer">
        <p-button [label]="'BUTTONS.CANCEL' | translate" icon="pi pi-times" (click)="hideDialog()" styleClass="p-button-text"></p-button>
        <p-button [label]="'BUTTONS.DELETE' | translate" icon="pi pi-trash" (click)="deleteProfile(selectedProfile.id)" styleClass="p-button-danger" [disabled]="!selectedProfile"></p-button>
      </div>
    </p-dialog>

    <p-dialog [(visible)]="showNewProfileDialog" [style]="{width: '450px'}" [header]="'PROFILE-MANAGEMENT.ADD.ADD-NEW-PROFILE' | translate" [modal]="true" [contentStyle]="{overflow: 'visible'}">
       <div class="field">
          <label for="firstName">{{ 'PROFILE-MANAGEMENT.ADD.FULL-NAME' | translate }}</label>
          <input id="firstName" type="text" pInputText [(ngModel)]="newProfile.name" />
       </div>
       <div class="field">
          <label for="firstName">
            {{ 'PROFILE-MANAGEMENT.ADD.PASSWORD' | translate }} 
            <span [ngStyle]="{'font-weight': 'normal'}">
              ({{ 'PROFILE-MANAGEMENT.ADD.MIN-6-CHARS' | translate }})
            </span>
          </label>
          <input id="firstName" type="text" pInputText [(ngModel)]="newProfile.password" />
       </div>
      <div class="p-field">
        <label for="role">{{ 'PROFILE-MANAGEMENT.ADD.POSITION' | translate }}</label>
        <p-select 
          [options]="profileRoles" 
          [(ngModel)]="newProfile.role_id" 
          [placeholder]="'PROFILE-MANAGEMENT.ADD.SELECT-POSITION' | translate" 
          [style]="{'width':'100%'}"
          optionLabel="translatedName"
          optionValue="id"
          appendTo="body"
          id="role">
        </p-select>
      </div>       
      @if(profileService.getProfileById(authService.getStoredUserId())?.is_test_user){
        <div class="field">
          <label for="isTestUser">{{ 'PROFILE-MANAGEMENT.ADD.IS-TEST-USER' | translate }}</label>
          <p-select 
            [options]="[true, false]" 
            [(ngModel)]="newProfile.is_test_user" 
            [style]="{'width':'100%'}"
            appendTo="body"
            id="isTestUser">
          </p-select>
        </div>
      }
      <div class="p-dialog-footer">
        <p-button [label]="'BUTTONS.CANCEL' | translate" icon="pi pi-times" (click)="hideDialog()" styleClass="p-button-text"></p-button>
        <p-button [label]="'BUTTONS.SAVE' | translate" icon="pi pi-check" (click)="createProfile()" [disabled]="!isNewProfileValid()"></p-button>
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
  selectedProfile: ExtendedProfile = { id: '', role_id: -1, first_name: '', last_name: '' };
  userPasswordMap: { [name: string]: string } = {};
  newProfileRole: string = '';
  newProfile: UserToRegister = { name: '', password: '', role_id: null, is_test_user: false };
  profileRoles: ProfileRole[] = [];
  sortedProfiles: ExtendedProfile[] = [];

  managementRoles: string[] = [
    ProfileRoles.Uprava, 
    ProfileRoles.VoditeljKampa, 
    ProfileRoles.SavjetnikUprave
  ];
  
  receptionRoles: string[] = [
    ProfileRoles.VoditeljRecepcije,
    ProfileRoles.Recepcija, 
    ProfileRoles.KorisnickaSluzba, 
    ProfileRoles.NocnaRecepcija, 
    ProfileRoles.Prodaja
  ];
  
  housekeepingRoles: string[] = [
    ProfileRoles.VoditeljDomacinstva, 
    ProfileRoles.Sobarica, 
    ProfileRoles.Terasar
  ];

  technicalRoles: string[] = [
    ProfileRoles.KucniMajstor, 
    ProfileRoles.Odrzavanje
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private dataService: DataService,
    private messageService: MessageService,
    public authService: AuthService,
    public profileService: ProfileService,
    private translateService: TranslateService,
    private languageService: LanguageService,
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
    combineLatest([
      this.dataService.profileRoles$,
      this.dataService.profiles$
    ])
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: async ([profileRoles, profiles]) => {
        this.sortedProfiles = [];
        
        this.profileRoles = profileRoles.map(role => ({
          ...role,
          translatedName: this.languageService.getSelectedLanguageCode() === 'en'
            ? this.profileService.translationMap[role.name]
            : role.name
        }));
        
        // Add management profiles
        const managementProfiles = profiles
          .filter(profile => {
            const roleName = profileRoles.find(role => role.id === profile.role_id)?.name;
            return roleName !== undefined && this.managementRoles.includes(roleName);
          })
          .sort(this.sortByName);
        if (managementProfiles.length > 0) {
          this.sortedProfiles.push(this.createDividerProfile('UPRAVA'));
          this.sortedProfiles.push(...this.addPasswordsAndEmailsToProfiles(managementProfiles));
        }
        
        // Add reception profiles
        const receptionProfiles = profiles
          .filter(profile => {
            const roleName = profileRoles.find(role => role.id === profile.role_id)?.name;
            return roleName !== undefined && this.receptionRoles.includes(roleName);
          })
          .sort(this.sortByName);
        if (receptionProfiles.length > 0) {
          this.sortedProfiles.push(this.createDividerProfile('ODJEL RECEPCIJA'));
          this.sortedProfiles.push(...this.addPasswordsAndEmailsToProfiles(receptionProfiles));
        }
        
        // Add housekeeping profiles
        const housekeepingProfiles = profiles
          .filter(profile => {
            const roleName = profileRoles.find(role => role.id === profile.role_id)?.name;
            return roleName !== undefined && this.housekeepingRoles.includes(roleName);
          })
          .sort(this.sortByName);
        if (housekeepingProfiles.length > 0) {
          this.sortedProfiles.push(this.createDividerProfile('ODJEL DOMAĆINSTVA'));
          this.sortedProfiles.push(...this.addPasswordsAndEmailsToProfiles(housekeepingProfiles));
        }
        
        // Add technical profiles
        const technicalProfiles = profiles
          .filter(profile => {
            const roleName = profileRoles.find(role => role.id === profile.role_id)?.name;
            return roleName !== undefined && this.technicalRoles.includes(roleName);
          })
          .sort(this.sortByName);
        if (technicalProfiles.length > 0) {
          this.sortedProfiles.push(this.createDividerProfile('ODJEL TEHNIKA'));
          this.sortedProfiles.push(...this.addPasswordsAndEmailsToProfiles(technicalProfiles));
        }
        
        // Add any other profiles that don't fit the categories
        const otherProfiles = profiles
          .filter(profile => {
            if (!profile.role_id) return true;

            const roleName = profileRoles.find(role => role.id === profile.role_id)?.name;
            if (!roleName) return true;

            return !this.managementRoles.includes(roleName) &&
                  !this.receptionRoles.includes(roleName) &&
                  !this.housekeepingRoles.includes(roleName) &&
                  !this.technicalRoles.includes(roleName);
          })
          .sort(this.sortByName);
        if (otherProfiles.length > 0) {
          this.sortedProfiles.push(this.createDividerProfile('OSTALO'));
          this.sortedProfiles.push(...this.addPasswordsAndEmailsToProfiles(otherProfiles));
        }
        
        this.profiles = [...this.sortedProfiles];
      },
      error: (error) => {
        console.error(error);
      }
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
      role_id: -1,
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

    this.resetSelectedProfileValues();
    this.showDeleteProfileDialog = false;
  }

  hideDialog() {
    this.profileDialog = false;
    this.showDeleteProfileDialog = false;
    this.resetSelectedProfileValues();

    this.showNewProfileDialog = false;
    this.resetNewProfileValues();
  }

  saveProfile() {
    if (this.selectedProfile && this.selectedProfile.id) {
      let updatedProfile: Profile = {
        id: this.selectedProfile.id,
        role_id: this.selectedProfile.role_id,
        first_name: this.selectedProfile.first_name,
        last_name: this.selectedProfile.last_name,
        phone_number: this.selectedProfile.phone_number,
        created_at: this.selectedProfile.created_at,
        password: this.selectedProfile.password,
        is_test_user: this.selectedProfile.is_test_user,
      }

      this.profileService.updateProfile(updatedProfile)
        .then((updatedProfile) => {
          if (updatedProfile) {
            this.messageService.add({ 
              severity: 'success', 
              summary: this.translateService.instant('PROFILE-MANAGEMENT.MESSAGES.SUCCESS'), 
              detail: this.translateService.instant('PROFILE-MANAGEMENT.MESSAGES.EDIT-SUCCESS'), 
              life: 3000 
            });

            if (this.authService.getStoredUserId() === updatedProfile.id) {
              this.profileService.$profileForLocalStorage.next(updatedProfile);
            }

            this.profileDialog = false;
            this.resetSelectedProfileValues();
          } else {
            this.messageService.add({ 
              severity: 'error', 
              summary: this.translateService.instant('PROFILE-MANAGEMENT.MESSAGES.ERROR'), 
              detail: this.translateService.instant('PROFILE-MANAGEMENT.MESSAGES.EDIT-ERROR'),
              life: 3000 
            });
          }
        })
        .catch((error) => {
          this.messageService.add({ 
            severity: 'error', 
            summary: this.translateService.instant('PROFILE-MANAGEMENT.MESSAGES.ERROR'), 
            detail: this.translateService.instant('PROFILE-MANAGEMENT.MESSAGES.EDIT-ERROR'),
            life: 3000 
          });
          console.error('Error updating profile:', error);
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
              summary: this.translateService.instant('PROFILE-MANAGEMENT.MESSAGES.SUCCESS'), 
              detail: this.translateService.instant('PROFILE-MANAGEMENT.MESSAGES.CREATE-SUCCESS'), 
              life: 3000 
            });
            this.showNewProfileDialog = false;
            this.resetNewProfileValues();
          }
        })
        .catch(error => {
          this.messageService.add({ 
            severity: 'error', 
            summary: this.translateService.instant('PROFILE-MANAGEMENT.MESSAGES.ERROR'),  
            detail: error instanceof Error ? error.message : String(error), 
            life: 5000 
          });
          console.error('Error creating profile:', error);
        }
      );
    }
  }

  isNewProfileValid(){
    return this.newProfile.name?.trim() && 
          this.newProfile.password?.length >= 6 && 
          this.newProfile.role_id &&
          this.newProfile.is_test_user != null;
  }

  openCreateProfileWindow(){
    this.showNewProfileDialog = true;
    this.newProfile.password = this.authService.generateRandomPassword();
  }

  getProfileRoleNameById(roleId: number){
    return this.profileRoles.find(role => role.id == roleId)?.name;
  }

  resetNewProfileValues(){
    this.newProfile = { name: '', password: '', role_id: null, is_test_user: false };
  }

  resetSelectedProfileValues(){
    this.selectedProfile = { id: '', role_id: -1, first_name: '', last_name: '' };
  }
}
