import { PushNotificationsService } from './../../pages/service/push-notifications.service';
import { Component } from '@angular/core';
import { ErrorLoggingService } from '../../pages/service/error-logging.service';
import { ButtonModule } from 'primeng/button';
import { DataService, Profile, Task } from '../../pages/service/data.service';
import { AuthService } from '../../pages/service/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputText } from 'primeng/inputtext';

@Component({
  selector: 'app-console-messages',
  imports: [
    ButtonModule,
    SelectModule,
    FormsModule,
    MultiSelectModule,
    InputText
  ],
  template: `
    <div class="console-messages-container">
      <h2>Send test notification</h2>
      <div class="test-notification">
        <div class="field">
          <label for="notificationTitle" class="font-bold block mb-2">Profiles</label>
          <p-multiselect 
              id="profiles-select"
              [options]="profiles" 
              [(ngModel)]="selectedProfiles"
              optionLabel="first_name" 
              [placeholder]="'Select profiles...'" 
              [style]="{ width: '200px' }" 
            >
              <ng-template let-item pTemplate="item">
                <span>{{ item.first_name }}</span>
              </ng-template>
          </p-multiselect>
        </div>
        <div class="field mt-4">
          <label for="notificationTitle" class="font-bold block mb-2">Title</label>
          <input 
            type="text"
            pInputText 
            [style]="{ width: '200px' }" 
            [placeholder]="'Title'" 
            [(ngModel)]="notificationTitle"
          >
        </div>
        <div class="field mt-4">
          <label for="notificationBody" class="font-bold block mb-2">Body</label>
          <input 
            type="text"
            pInputText 
            [style]="{ width: '200px' }" 
            [placeholder]="'Body'" 
            [(ngModel)]="notificationBody"
          >
        </div>
        <p-button type="button" (onClick)="sendTestNotification()" [rounded]="true" label="Send" severity="primary" />
      </div>
      <h2>App Console Logs</h2>
    
      <div class="log-buttons">
        <p-button type="button" (onClick)="logError()" [rounded]="true" label="Log Error" severity="danger" />
        <p-button type="button" (onClick)="logWarning()" [rounded]="true" label="Log Warning" severity="warn" />
        <p-button type="button" (onClick)="errorLogger.clear()" [rounded]="true" label="Clear data" severity="secondary" />
      </div>

      @if(errors.length){
        <h3 style="color: red">Errors</h3>
        <ul>
          @for(err of errors; track $index){
            <li class="console-entry error">{{ err }}</li>
          }
        </ul>
      }

      @if(warnings.length){
        <h3 style="color: orange">Warnings</h3>
        <ul>
          @for(warning of warnings; track $index){
            <li class="console-entry warning">{{ warning }}</li>
          }
        </ul>
      }

      @if(logs.length){
        <h3>Logs</h3>
        <ul>
          @for(log of logs; track $index){
            <li class="console-entry log">{{ log }}</li>
          }
        </ul>
      }
    </div>
  `,
  styles: `
   .console-messages-container {
      height: 82vh;
      width: 100%;
      background-color: var(--surface-card);
      border-radius: 10px;
      box-sizing: border-box;
      padding: 20px;
      overflow-y: auto;
      position: relative;

      .log-buttons{
        display: flex;
        flex-direction: row;
        gap: 10px;  
      }

      .test-notification{
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 200px;
        gap: 10px;
      }

      .console-entry {
        background: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 0.75rem;
        margin-bottom: 0.75rem;
        font-family: monospace;
        white-space: pre-wrap;
        word-break: break-word;  
        overflow-wrap: break-word;
      }

      .error{
        color: white;
        background-color: rgba(255, 0, 0, 0.7);
      }

      .warning{
        color: white;
        background-color: rgba(252, 175, 33, 0.86);
      }

      .log{
        background-color: var(--surface-card);
      }
    }
  `
})
export class ConsoleMessagesComponent {
  errors: string[] = [];
  warnings: string[] = [];
  logs: string[] = [];
  loggedUser?: Profile;
  profiles: Profile[] = [];
  selectedProfiles: Profile[] = [];
  notificationTitle: string = '';
  notificationBody: string = '';

  constructor(
    public errorLogger: ErrorLoggingService,
    public pushNotificationsService: PushNotificationsService,
    private dataService: DataService,
    private authService: AuthService,
    private translateService: TranslateService,
  ) {
    this.dataService.profiles$.subscribe(profiles => {
      this.profiles = profiles;
      this.loggedUser = profiles.find(profile => profile.id == this.authService.getStoredUserId());
    });
  }

  ngOnInit() {
    this.errorLogger.errors$.subscribe(errs => {
      this.errors = errs;
    });

    this.errorLogger.warnings$.subscribe(warns => {
      this.warnings = warns;
    });

    this.errorLogger.logs$.subscribe(logs => {
      this.logs = logs;
    });
  }

  sendTestNotification(){
    this.selectedProfiles.forEach(user => {
      this.pushNotificationsService.sendNotification(
        user.id, 
        { 
          title: this.notificationTitle, 
          body: this.notificationBody,
        });
    })
  }

  logError(){
    console.error('Error');
  }

  logWarning(){
    console.warn('Warning');
  }
}
