import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { ProfilesComponent } from '../profiles/profiles.component';
import { SeasonsComponent } from '../seasons/seasons.component';
import { HousesComponent } from '../houses/houses.component';
import { NotificationSubscriptionsComponent } from '../notification-subscriptions/notification-subscriptions.component';
import { UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-content-management',
  imports: [
    TranslateModule,
    ButtonModule,
    ProfilesComponent,
    SeasonsComponent,
    HousesComponent,
    NotificationSubscriptionsComponent,
    UpperCasePipe,
  ],
  template: `
    <div class="content-management-container">
      <div class="header">
        <h1>{{ 'CONTENT-MANAGEMENT.TITLE' | translate }}</h1>
        <div class="tab-bar">
          @for(c of content; track $index){
            <button
              class="tab-item"
              [class.active]="selectedContent === c.key"
              (click)="setSelectedContent(c.key)">
              <i [class]="'pi ' + c.icon"></i>
              {{ ('CONTENT-MANAGEMENT.TABS.' + c.key | uppercase) | translate }}
            </button>
          }
        </div>
      </div>
      <div class="content-management">
          @if(selectedContent === 'Profiles'){
            <app-profiles></app-profiles>
          } @else if(selectedContent === 'Seasons'){
            <app-seasons></app-seasons>
          } @else if(selectedContent === 'Houses'){
            <app-houses></app-houses>
          } @else if(selectedContent === 'Notifications'){
            <app-notification-subscriptions></app-notification-subscriptions>
          }
      </div>
    </div>
  `,
  styles: `
    .content-management-container{
      height: 90vh;
      background: var(--glass-bg);
      backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
      -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
      border: 1px solid var(--glass-border);
      box-shadow: var(--glass-shadow);
      border-radius: 10px;
      box-sizing: border-box;
      padding: 20px;
      overflow-y: auto;

      .header {
        width: 100%;
        padding-bottom: 0;

        h1 {
          margin: 0 0 0.25rem 0;
        }

        .tab-bar {
          display: flex;
          flex-direction: row;
          border-bottom: 2px solid var(--surface-border);
          gap: 0;
          margin-bottom: 1.5rem;
        }

        .tab-item {
          position: relative;
          background: none;
          border: none;
          cursor: pointer;
          padding: 1rem 1.75rem;
          font-size: 1.05rem;
          font-weight: 500;
          color: var(--text-color-secondary);
          transition: color 0.2s;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 0.5rem;

          i { font-size: 1rem; }

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

          &:hover {
            color: var(--text-color);
          }

          &.active {
            color: var(--primary-color);
            font-weight: 600;

            &::after {
              transform: scaleX(1);
            }
          }
        }
      }

      .content-management {
        overflow-y: auto;
      }
    }
  `
})
export class ContentManagementComponent {
  content = [
    { key: 'Profiles',      icon: 'pi-users' },
    { key: 'Seasons',       icon: 'pi-calendar' },
    { key: 'Houses',        icon: 'pi-home' },
    { key: 'Notifications', icon: 'pi-bell' },
  ];

  selectedContent: string = '';

  ngOnInit(){
    this.selectedContent = this.content[0].key;
  }

  setSelectedContent(content: string){
    this.selectedContent = content;
  }
}
