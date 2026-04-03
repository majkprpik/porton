import { Component, OnInit, ViewChild } from '@angular/core';
import { ProfileRole, Profile, ProfileRoles, UserToRegister, Departments } from '../../core/models/data.models';
import { CommonModule } from '@angular/common';
import { Table, TableModule } from 'primeng/table';
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
import { SelectButtonModule } from 'primeng/selectbutton';
import { LanguageService } from '../../core/services/language.service';
import { DataService } from '../../core/services/data.service';
import { nonNull } from '../../shared/rxjs-operators/non-null';

interface ExtendedProfile {
  id: string;
  role_id: number | null;
  first_name: string | null;
  last_name: string | null;
  isDivider?: boolean;
  department?: string;
  password?: string;
  email?: string;
  is_test_user?: boolean;
  phone_number?: string | null;
  created_at?: string | null;
  is_deleted?: boolean;
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
      <div class="toolbar">
        <div class="tab-bar">
          @for(opt of deptOptions; track opt.value){
            <button
              class="tab-item"
              [class.active]="selectedDept === opt.value"
              (click)="selectedDept = opt.value">
              {{ opt.key | translate }}
            </button>
          }
        </div>
        <p-button severity="primary" (click)="openCreateProfileWindow()">
          <i class="pi pi-plus mr-2"></i> {{ 'CONTENT-MANAGEMENT.PROFILES.ADD-NEW-PROFILE' | translate }}
        </p-button>
      </div>
      <p-table #dt [value]="filteredProfiles" [tableStyle]="{'min-width': '60rem'}" [stripedRows]="true" (onSort)="onSort($event)">
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="first_name">{{ 'CONTENT-MANAGEMENT.PROFILES.TABLE-COLUMNS.NAME' | translate }} <p-sortIcon field="first_name" /></th>
            <th>{{ 'CONTENT-MANAGEMENT.PROFILES.TABLE-COLUMNS.DEPARTMENT' | translate }}</th>
            <th>{{ 'CONTENT-MANAGEMENT.PROFILES.TABLE-COLUMNS.POSITION' | translate }}</th>
            <th>{{ 'CONTENT-MANAGEMENT.PROFILES.TABLE-COLUMNS.EMAIL' | translate }}</th>
            <th>{{ 'CONTENT-MANAGEMENT.PROFILES.TABLE-COLUMNS.PASSWORD' | translate }}</th>
            <th style="width: 6rem; text-align: center">{{ 'CONTENT-MANAGEMENT.PROFILES.TABLE-COLUMNS.ACTIONS' | translate }}</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-profile>
          <tr>
            <td class="name-cell">{{ profile.first_name }} {{ profile.last_name }}</td>
            <td><span class="dept-badge dept-{{ profile.department?.toLowerCase() }}">{{ 'PROFILE-DEPARTMENTS.' + (profile.department?.toUpperCase()) | translate }}</span></td>
            <td><span class="role-badge">{{ 'PROFILE-ROLES.' + getProfileRoleNameById(profile.role_id) | translate }}</span></td>
            <td class="email-cell">{{ getDisplayEmail(profile.email) }}</td>
            <td class="password-cell">
              <span class="password-text">{{ revealedPasswords.has(profile.id) ? (profile.password || '—') : '••••••' }}</span>
              <p-button
                [icon]="revealedPasswords.has(profile.id) ? 'pi pi-eye-slash' : 'pi pi-eye'"
                [text]="true"
                severity="secondary"
                size="small"
                (click)="togglePassword(profile.id)">
              </p-button>
            </td>
            <td class="action-cell">
              <p-button
                icon="pi pi-pencil"
                [text]="true"
                severity="secondary"
                size="small"
                (click)="editProfile(profile)">
              </p-button>
              <p-button
                [disabled]="profile.id == authService.getStoredUserId()"
                icon="pi pi-trash"
                [text]="true"
                severity="danger"
                size="small"
                (click)="profile.id !== authService.getStoredUserId() && showDeleteProfile(profile)">
              </p-button>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog 
      [(visible)]="profileDialog" 
      [style]="{width: '450px'}" 
      [header]="'CONTENT-MANAGEMENT.PROFILES.EDIT.TITLE' | translate" 
      [modal]="true" 
      [contentStyle]="{overflow: 'visible'}"
    >
      @if(selectedProfile){
        <div class="field">
          <label for="firstName">{{ 'CONTENT-MANAGEMENT.PROFILES.EDIT.FULL-NAME' | translate }}</label>
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
            <label for="isTestUser">{{ 'CONTENT-MANAGEMENT.PROFILES.EDIT.IS-TEST-USER' | translate }}</label>
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
      <ng-template pTemplate="footer">
        <p-button [label]="'BUTTONS.CANCEL' | translate" icon="pi pi-times" (click)="hideDialog()" styleClass="p-button-text"></p-button>
        <p-button [label]="'BUTTONS.SAVE' | translate" icon="pi pi-check" (click)="saveProfile()" [disabled]="!selectedProfile"></p-button>
      </ng-template>
    </p-dialog>

    <p-dialog [(visible)]="showDeleteProfileDialog" [style]="{width: '450px'}" [header]="'CONTENT-MANAGEMENT.PROFILES.DELETE.HEADER' | translate" [modal]="true" [contentStyle]="{overflow: 'visible'}">
      <label>
        {{ 'CONTENT-MANAGEMENT.PROFILES.DELETE.MESSAGE' | translate }} <b>{{ selectedProfile.first_name }}</b>?
      </label>
      <ng-template pTemplate="footer">
        <p-button [label]="'BUTTONS.CANCEL' | translate" icon="pi pi-times" (click)="hideDialog()" styleClass="p-button-text"></p-button>
        <p-button [label]="'BUTTONS.DELETE' | translate" icon="pi pi-trash" (click)="deleteProfile(selectedProfile.id)" styleClass="p-button-danger" [disabled]="!selectedProfile"></p-button>
      </ng-template>
    </p-dialog>

    <p-dialog [(visible)]="showNewProfileDialog" [style]="{width: '450px'}" [header]="'CONTENT-MANAGEMENT.PROFILES.ADD.ADD-NEW-PROFILE' | translate" [modal]="true" [contentStyle]="{overflow: 'visible'}">
      <div class="field">
         <label for="firstName">{{ 'CONTENT-MANAGEMENT.PROFILES.ADD.FULL-NAME' | translate }}</label>
         <input id="firstName" type="text" pInputText [(ngModel)]="newProfile.name" />
      </div>
      <div class="field">
         <label for="firstName">
           {{ 'CONTENT-MANAGEMENT.PROFILES.ADD.PASSWORD' | translate }} 
           <span [ngStyle]="{'font-weight': 'normal'}">
             ({{ 'CONTENT-MANAGEMENT.PROFILES.ADD.MIN-6-CHARS' | translate }})
           </span>
         </label>
         <input id="firstName" type="text" pInputText [(ngModel)]="newProfile.password" />
      </div>
      <div class="p-field">
        <label for="role">{{ 'CONTENT-MANAGEMENT.PROFILES.ADD.POSITION' | translate }}</label>
        <p-select 
          [options]="profileRoles" 
          [(ngModel)]="newProfile.role_id" 
          [placeholder]="'CONTENT-MANAGEMENT.PROFILES.ADD.SELECT-POSITION' | translate" 
          [style]="{'width':'100%'}"
          optionLabel="translatedName"
          optionValue="id"
          appendTo="body"
          id="role">
        </p-select>
      </div>       
      @if(profileService.getProfileById(authService.getStoredUserId())?.is_test_user){
        <div class="field">
          <label for="isTestUser">{{ 'CONTENT-MANAGEMENT.PROFILES.ADD.IS-TEST-USER' | translate }}</label>
          <p-select 
            [options]="[true, false]" 
            [(ngModel)]="newProfile.is_test_user" 
            [style]="{'width':'100%'}"
            appendTo="body"
            id="isTestUser">
          </p-select>
        </div>
      }
      <ng-template pTemplate="footer">
        <p-button [label]="'BUTTONS.CANCEL' | translate" icon="pi pi-times" (click)="hideDialog()" styleClass="p-button-text"></p-button>
        <p-button [label]="'BUTTONS.SAVE' | translate" icon="pi pi-check" (click)="createProfile()" [disabled]="!isNewProfileValid()"></p-button>
      </ng-template>
    </p-dialog>
    <p-toast></p-toast>
  `,
  styles: [
    `
    .card {
      padding: 2rem;
      background: var(--glass-bg);
      backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
      -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
      border: 1px solid var(--glass-border);
      box-shadow: var(--glass-shadow);
      border-radius: 8px;
    }

    .toolbar {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.25rem;
      border-bottom: 2px solid var(--surface-border);
    }

    .tab-bar {
      display: flex;
      flex-direction: row;
      gap: 0;
    }

    .tab-item {
      position: relative;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.75rem 1.25rem;
      font-size: 1rem;
      font-weight: 500;
      color: var(--text-color-secondary);
      transition: color 0.2s;
      white-space: nowrap;

      &::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--primary-color);
        transform: scaleX(0);
        transition: transform 0.2s;
      }

      &:hover { color: var(--text-color); }

      &.active {
        color: var(--primary-color);
        font-weight: 600;

        &::after { transform: scaleX(1); }
      }
    }

    .p-field {
      margin-bottom: 1.5rem;
    }

    .field {
      margin-bottom: 10px;

      input {
        width: 100%;
      }
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
    }

    ::ng-deep .p-dialog {
      border-radius: 10px;
      overflow: hidden;

      .p-dialog-header {
        border-radius: 10px 10px 0 0;
      }

      .p-dialog-footer {
        border-radius: 0 0 10px 10px;
      }
    }

    .p-dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      padding: 1.5rem 0 0 0;
    }

    ::ng-deep .p-datatable .p-datatable-tbody > tr > td {
      padding: 0.85rem 1rem;
      font-size: 0.95rem;
    }

    ::ng-deep .p-datatable .p-datatable-thead > tr > th {
      padding: 0.85rem 1rem;
      font-size: 0.95rem;
    }

    .name-cell {
      font-weight: 500;
    }

    .email-cell {
      color: var(--text-color-secondary);
    }

    .password-cell {
      display: flex;
      align-items: center;
      gap: 0.25rem;

      .password-text {
        font-family: monospace;
        letter-spacing: 0.1em;
        color: var(--text-color-secondary);
      }
    }

    .role-badge {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
      font-size: 0.78rem;
      font-weight: 500;
      background: var(--surface-hover);
      color: var(--text-color);
    }

    .dept-badge {
      display: inline-block;
      padding: 0.2rem 0.65rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.02em;

      &.dept-management  { background: rgba(139, 92, 246, 0.15); color: #7c3aed; }
      &.dept-reception   { background: rgba(59, 130, 246, 0.15); color: #2563eb; }
      &.dept-housekeeping{ background: rgba(16, 185, 129, 0.15); color: #059669; }
      &.dept-technical   { background: rgba(245, 158, 11, 0.15); color: #d97706; }
      &.dept-other       { background: var(--surface-hover);     color: var(--text-color-secondary); }
    }

    .action-cell {
      text-align: center;
      white-space: nowrap;
    }
    `
  ]
})
export class ProfilesComponent implements OnInit {
  profiles: ExtendedProfile[] = [];
  flatProfiles: ExtendedProfile[] = [];
  selectedDept = 'ALL';
  @ViewChild('dt') dt!: Table;
  private prevSortField = '';
  private prevSortOrder = 0;

  onSort(event: { field: string; order: number }) {
    if (event.field === this.prevSortField && this.prevSortOrder === -1 && event.order === 1) {
      setTimeout(() => this.dt.reset());
      this.prevSortField = '';
      this.prevSortOrder = 0;
    } else {
      this.prevSortField = event.field;
      this.prevSortOrder = event.order;
    }
  }

  revealedPasswords = new Set<string>();

  togglePassword(id: string) {
    if (this.revealedPasswords.has(id)) {
      this.revealedPasswords.delete(id);
    } else {
      this.revealedPasswords.add(id);
    }
  }
  deptOptions: { key: string; value: string }[] = [
    { key: 'PROFILE-DEPARTMENTS.ALL',          value: 'ALL' },
    { key: 'PROFILE-DEPARTMENTS.MANAGEMENT',   value: Departments.Management },
    { key: 'PROFILE-DEPARTMENTS.RECEPTION',    value: Departments.Reception },
    { key: 'PROFILE-DEPARTMENTS.HOUSEKEEPING', value: Departments.Housekeeping },
    { key: 'PROFILE-DEPARTMENTS.TECHNICAL',    value: Departments.Technical },
    { key: 'PROFILE-DEPARTMENTS.OTHER',        value: Departments.Ostalo },
  ];

  get filteredProfiles(): ExtendedProfile[] {
    if (this.selectedDept === 'ALL') return this.flatProfiles;
    return this.flatProfiles.filter(p => p.department === this.selectedDept);
  }

  profileDialog: boolean = false;
  showNewProfileDialog: boolean = false;
  showDeleteProfileDialog: boolean = false;
  selectedProfile: ExtendedProfile = { id: '', role_id: -1, first_name: '', last_name: '', is_test_user: false, is_deleted: false };
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
  activeProfiles: Profile[] = [];

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
      this.dataService.profileRoles$.pipe(nonNull()),
      this.dataService.profiles$.pipe(nonNull()),
    ])
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: async ([profileRoles, profiles]) => {
        this.activeProfiles = profiles.filter(p => !p.is_deleted);

        this.profileRoles = profileRoles.map(role => ({
          ...role,
          translatedName: this.languageService.getSelectedLanguageCode() === 'en'
            ? this.profileService.translationMap[role.name]
            : role.name
        }));

        const withDept = (dept: string) => (profile: Profile): ExtendedProfile => ({
          ...this.addPasswordsAndEmailsToProfiles([profile])[0],
          department: dept,
        });

        const getRoleName = (profile: Profile) =>
          profileRoles.find(role => role.id === profile.role_id)?.name;

        const managementProfiles = this.activeProfiles
          .filter(p => { const r = getRoleName(p); return r !== undefined && this.managementRoles.includes(r); })
          .sort(this.sortByName)
          .map(withDept(Departments.Management));

        const receptionProfiles = this.activeProfiles
          .filter(p => { const r = getRoleName(p); return r !== undefined && this.receptionRoles.includes(r); })
          .sort(this.sortByName)
          .map(withDept(Departments.Reception));

        const housekeepingProfiles = this.activeProfiles
          .filter(p => { const r = getRoleName(p); return r !== undefined && this.housekeepingRoles.includes(r); })
          .sort(this.sortByName)
          .map(withDept(Departments.Housekeeping));

        const technicalProfiles = this.activeProfiles
          .filter(p => { const r = getRoleName(p); return r !== undefined && this.technicalRoles.includes(r); })
          .sort(this.sortByName)
          .map(withDept(Departments.Technical));

        const otherProfiles = this.activeProfiles
          .filter(p => {
            if (!p.role_id) return true;
            const r = getRoleName(p);
            if (!r) return true;
            return !this.managementRoles.includes(r) && !this.receptionRoles.includes(r) &&
                   !this.housekeepingRoles.includes(r) && !this.technicalRoles.includes(r);
          })
          .sort(this.sortByName)
          .map(withDept(Departments.Ostalo));

        this.flatProfiles = [
          ...managementProfiles,
          ...receptionProfiles,
          ...housekeepingProfiles,
          ...technicalProfiles,
          ...otherProfiles,
        ];
        this.profiles = [...this.flatProfiles];
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
      this.profileService.softDeleteProfile(profileId).then(res => {
        if(res) {
          this.messageService.add({ 
            severity: 'success', 
            summary: this.translateService.instant('CONTENT-MANAGEMENT.PROFILES.MESSAGES.SUCCESS'), 
            detail: this.translateService.instant('CONTENT-MANAGEMENT.PROFILES.MESSAGES.DELETE-SUCCESS'), 
            life: 3000 
          });
          this.showNewProfileDialog = false;
          this.resetNewProfileValues();
        } else {
          this.messageService.add({ 
            severity: 'error', 
            summary: this.translateService.instant('CONTENT-MANAGEMENT.PROFILES.MESSAGES.ERROR'),  
            detail: this.translateService.instant('CONTENT-MANAGEMENT.PROFILES.MESSAGES.DELETE-ERROR'), 
            life: 3000 
          });
        }
      });
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
        is_deleted: this.selectedProfile.is_deleted
      }

      this.profileService.updateProfile(updatedProfile)
        .then((updatedProfile) => {
          if (updatedProfile) {
            this.messageService.add({ 
              severity: 'success', 
              summary: this.translateService.instant('CONTENT-MANAGEMENT.PROFILES.MESSAGES.SUCCESS'), 
              detail: this.translateService.instant('CONTENT-MANAGEMENT.PROFILES.MESSAGES.EDIT-SUCCESS'), 
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
              summary: this.translateService.instant('CONTENT-MANAGEMENT.PROFILES.MESSAGES.ERROR'), 
              detail: this.translateService.instant('CONTENT-MANAGEMENT.PROFILES.MESSAGES.EDIT-ERROR'),
              life: 3000 
            });
          }
        })
        .catch((error) => {
          this.messageService.add({ 
            severity: 'error', 
            summary: this.translateService.instant('CONTENT-MANAGEMENT.PROFILES.MESSAGES.ERROR'), 
            detail: this.translateService.instant('CONTENT-MANAGEMENT.PROFILES.MESSAGES.EDIT-ERROR'),
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
              summary: this.translateService.instant('CONTENT-MANAGEMENT.PROFILES.MESSAGES.SUCCESS'), 
              detail: this.translateService.instant('CONTENT-MANAGEMENT.PROFILES.MESSAGES.CREATE-SUCCESS'), 
              life: 3000 
            });
            this.showNewProfileDialog = false;
            this.resetNewProfileValues();
          } else {
            this.messageService.add({ 
              severity: 'error', 
              summary: this.translateService.instant('CONTENT-MANAGEMENT.PROFILES.MESSAGES.ERROR'),  
              detail: this.translateService.instant('CONTENT-MANAGEMENT.PROFILES.MESSAGES.DELETE-ERROR'), 
              life: 3000 
            });
          }
        })
        .catch(error => {
          this.messageService.add({ 
            severity: 'error', 
            summary: this.translateService.instant('CONTENT-MANAGEMENT.PROFILES.MESSAGES.ERROR'),  
            detail: error instanceof Error ? error.message : String(error), 
            life: 3000 
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
