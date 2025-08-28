import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { ProfilesComponent } from '../profiles/profiles.component';
import { SeasonsComponent } from '../seasons/seasons.component';
import { HousesComponent } from '../houses/houses.component';
import { UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-content-management',
  imports: [
    TranslateModule,
    ButtonModule,
    ProfilesComponent,
    SeasonsComponent,
    HousesComponent,
    UpperCasePipe,
  ],
  template: `
    <div class="content-management-container">
      <div class="header">
        <h1>{{ 'CONTENT-MANAGEMENT.TITLE' | translate }}</h1>
        <div class="conent-buttons">
          @for(c of content; track $index){
            <p-button 
              [label]="('CONTENT-MANAGEMENT.TABS.' + c | uppercase) | translate" 
              [severity]="selectedContent == c ? 'primary' : 'secondary'"
              (click)="setSelectedContent(c)">
            </p-button>  
          }
        </div>
      </div>
      <div class="content-management">
          @if(selectedContent == 'Profiles'){
            <app-profiles></app-profiles>
          } @else if(selectedContent == 'Seasons'){
            <app-seasons></app-seasons>
          } @else if(selectedContent == 'Houses'){
            <app-houses></app-houses>
          }
      </div>
    </div>
  `,
  styles: `
    .content-management-container{
      height: 90vh;
      background-color: var(--surface-card);
      border-radius: 10px;
      box-sizing: border-box;
      padding: 20px;
      overflow-y: auto;

      .header{
        width: 100%;
        height: 13%;

        .conent-buttons{
          display: flex;
          flex-direction: row;
          gap: 8px;
        }
      }

      .content-management{
        height: 87%;
        overflow-y: auto;
      }
    }
  `
})
export class ContentManagementComponent {
  content = [
    'Profiles',
    'Seasons',
    'Houses'
  ];

  selectedContent: string = '';

  constructor() {
    
  }

  ngOnInit(){
    this.selectedContent = this.content[0];
  }

  setSelectedContent(content: string){
    this.selectedContent = content;
  }
}
