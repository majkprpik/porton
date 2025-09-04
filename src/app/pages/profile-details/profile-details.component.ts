import { Component } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ProfileService } from '../../core/services/profile.service';
import { Profile } from '../../core/models/data.models';
import { LayoutService } from '../../layout/services/layout.service';
import { AuthService } from '../../core/services/auth.service';
import { DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-profile-details',
  imports: [
    TranslateModule,
    DatePipe,
    ButtonModule,
  ],
  template: `
    <div class="profile-details-container">
      <div class="header">
        <h1>
          {{ 'PROFILE-DETAILS.TITLE' | translate }}
        </h1>
      </div>
      <div class="text">
        <div class="new-profile-row"><b>{{ 'PROFILE-DETAILS.NAME' | translate }}:</b> {{ loggedUser?.first_name }}</div>
        <div class="new-profile-row"><b>{{ 'PROFILE-DETAILS.EMAIL' | translate }}:</b> {{ authService.getStoredUsername() || '' }}</div>
        <div class="new-profile-row"><b>{{ 'PROFILE-DETAILS.PHONE' | translate }}:</b> {{ loggedUser?.phone_number }}</div>
        <div class="new-profile-row"><b>{{ 'PROFILE-DETAILS.ROLE' | translate }}:</b> {{ profileService.getProfileRoleNameById(loggedUser?.role_id ?? 0) }}</div>
        <div class="new-profile-row"><b>{{ 'PROFILE-DETAILS.DATE-CREATED' | translate }}:</b> {{ loggedUser?.created_at | date: 'dd/MM/yyyy' }}</div>
        @if(profileService.getProfileById(loggedUser?.id)?.is_test_user){
          <div class="new-profile-row"><b>{{ 'APP-LAYOUT.LOGGED-USER-DETAILS.ACCESS-TOKEN' | translate }}:</b> </div>
          <div class="new-profile-row"><b>{{ 'APP-LAYOUT.LOGGED-USER-DETAILS.FCM-TOKEN' | translate }}:</b> </div> 
        }

        <div class="flex gap-5">
          <button 
            pButton 
            [severity]="'danger'"
            [label]="'BUTTONS.DELETE-PROFILE' | translate" 
            (click)="deleteUser($event)">
          </button>
          <button 
            pButton 
            [severity]="'danger'"
            [label]="'BUTTONS.LOG-OUT' | translate" 
            (click)="authService.logout()">
          </button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .profile-details-container{
      height: 90vh;
      background-color: var(--surface-card);
      border-radius: 10px;
      box-sizing: border-box;
      padding: 20px;
      overflow-y: auto;

      .header{
        width: 100%;
      }
    }

    .text{
      height: 87%;
      overflow-y: auto;
    }
  `
})
export class ProfileDetailsComponent {
  loggedUser?: Profile;

  constructor(
    public profileService: ProfileService,
    public authService: AuthService,
    private confirmationService: ConfirmationService,
    private translateService: TranslateService,
    private messageService: MessageService,
  ) {
    
  }

  ngOnInit(){
    this.loggedUser = this.profileService.getProfileById(this.authService.getStoredUserId());
  }

  logout(){
    this.authService.logout();
  }

  deleteUser(event: any){
    if(!this.loggedUser?.id) return;

    this.confirmationService.confirm({
        target: event.target,
        header: this.translateService.instant('PROFILE-DETAILS.MESSAGES.HEADER'),
        message: this.translateService.instant('PROFILE-DETAILS.MESSAGES.CONFIRM-DELETE'),
        icon: 'pi pi-exclamation-triangle',
        rejectLabel: 'Cancel',
        rejectButtonProps: {
          label: this.translateService.instant('BUTTONS.CANCEL'),
          severity: 'secondary',
          outlined: true
        },
        acceptButtonProps: {
          label: this.translateService.instant('BUTTONS.CONFIRM'),
          severity: 'danger'
        },
        accept: async () => {
          this.profileService.deleteProfile(this.loggedUser!.id)
          this.messageService.add({ severity: 'info', summary: this.translateService.instant('PROFILE-DETAILS.MESSAGES.SUCCESS'), detail: this.translateService.instant('PROFILE-DETAILS.MESSAGES.DELETED-SUCCESS') });
        },
        reject: () => {
          this.messageService.add({ severity: 'warn', summary: this.translateService.instant('PROFILE-DETAILS.MESSAGES.CANCELLED'), detail: this.translateService.instant('PROFILE-DETAILS.MESSAGES.CANCELLED-DELETE') });
        }
    });
  }
}
