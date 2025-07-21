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

@Component({
  selector: 'app-console-messages',
  imports: [
    ButtonModule,
    SelectModule,
    FormsModule,
    MultiSelectModule
  ],
  template: `
    <div class="console-messages-container">
      <div class="buttons">
        <div class="log-buttons">
          <p-button type="button" (onClick)="logError()" [rounded]="true" label="Log Error" severity="danger" />
          <p-button type="button" (onClick)="logWarning()" [rounded]="true" label="Log Warning" severity="warn" />
          <p-button type="button" (onClick)="errorLogger.clear()" [rounded]="true" label="Clear data" severity="secondary" />
        </div>
        <div class="test-notification">
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
          <p-button type="button" (onClick)="sendTestNotification()" [rounded]="true" label="Send test notification" severity="primary" />
        </div>
      </div>
      <h2>App Console Logs</h2>
      
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
      background-color: white;
      border-radius: 10px;
      box-sizing: border-box;
      padding: 20px;
      overflow-y: auto;
      position: relative;

      .buttons{
        display: flex;
        flex-direction: column;
        gap: 20px;

        .log-buttons{
          display: flex;
          flex-direction: row;
          gap: 10px;  
        }

        .test-notification{
          display: flex;
          flex-direction: row;
          align-items: end;
          width: 40%;
          gap: 10px;
        }
      }

      .console-entry {
        background: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 0.75rem;
        margin-bottom: 0.75rem;
        font-family: monospace;
        white-space: pre-wrap;
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
          title: this.translateService.instant('NOTIFICATIONS.TEST.TITLE'), 
          body: this.translateService.instant('NOTIFICATIONS.TEST.BODY'),
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
