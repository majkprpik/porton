import { Component } from '@angular/core';
import { DataService } from '../../core/services/data.service';
import { Season } from '../../core/models/data.models';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SeasonService } from '../../core/services/season.service';
import { nonNull } from '../../shared/rxjs-operators/non-null';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { DatePipe } from '@angular/common';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-seasons',
  imports: [
    ButtonModule,
    TableModule,
    TranslateModule,
    ToastModule,
    DialogModule,
    SelectModule,
    DatePicker,
    FormsModule,
    InputTextModule,
    DatePipe,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="seasons-container">
      <div class="title">
        <p-button 
          severity="primary"
          (click)="openCreateSeasonWindow()"
        >
          <i class="pi pi-plus mr-2"></i> {{ 'CONTENT-MANAGEMENT.SEASONS.ADD-NEW-SEASON' | translate }}
        </p-button>
      </div>
      <p-table [value]="seasons" [tableStyle]="{'min-width': '50rem'}">
        <ng-template pTemplate="header">
          <tr>
            <th>{{ 'CONTENT-MANAGEMENT.SEASONS.TABLE-COLUMNS.YEAR' | translate }}</th>
            <th>{{ 'CONTENT-MANAGEMENT.SEASONS.TABLE-COLUMNS.START-DATE' | translate }}</th>
            <th>{{ 'CONTENT-MANAGEMENT.SEASONS.TABLE-COLUMNS.END-DATE' | translate }}</th>
            <th>{{ 'CONTENT-MANAGEMENT.SEASONS.TABLE-COLUMNS.ACTIONS' | translate }}</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-season>
          <tr>
            <td>{{ season.year }}</td>
            <td>{{ season.season_start_date | date: 'dd MMM yyyy' }}</td>
            <td>{{ season.season_end_date | date: 'dd MMM yyyy'}}</td>
            <td>
              <p-button 
                icon="pi pi-pencil" 
                styleClass="p-button-rounded p-button-success mr-2" 
                (click)="openEditSeasonWindow(season)">
              </p-button>
              <p-button 
                icon="pi pi-trash" 
                styleClass="p-button-rounded p-button-danger mr-2" 
                (click)="openDeleteSeasonWindow(season)">
              </p-button>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog 
      [(visible)]="isEditSeasonModuleVisible" 
      [style]="{width: '250px'}" 
      [header]="'CONTENT-MANAGEMENT.SEASONS.EDIT.TITLE' | translate" 
      [modal]="true" 
      [contentStyle]="{overflow: 'visible'}"
    >
      @if(selectedSeason){
        <div class="field">
          <label for="seasonStartDate">{{ 'CONTENT-MANAGEMENT.SEASONS.EDIT.SEASON-START-DATE' | translate }}</label>
          <p-datePicker  
            id="seasonStartDate" 
            [(ngModel)]="editSeasonStartDate" 
            [readonlyInput]="true" 
            dateFormat="dd.mm.yy"
            [showIcon]="true"
            [placeholder]="'CONTENT-MANAGEMENT.SEASONS.EDIT.SELECT-START-DATE' | translate" 
            appendTo="body"
            (onSelect)="handleEditSeasonStartDateSelect()"
          >
          </p-datePicker>
        </div>
        <div class="field">
          <label for="endStartDate">{{ 'CONTENT-MANAGEMENT.SEASONS.EDIT.SEASON-END-DATE' | translate }}</label>
          <p-datePicker  
            id="endStartDate" 
            [(ngModel)]="editSeasonEndDate" 
            [readonlyInput]="true" 
            dateFormat="dd.mm.yy"
            [showIcon]="true"
            [minDate]="editSeasonStartDate"
            [placeholder]="'CONTENT-MANAGEMENT.SEASONS.EDIT.SELECT-END-DATE' | translate" 
            appendTo="body"
          >
          </p-datePicker>
        </div>
      }
      <div class="p-dialog-footer">
        <p-button 
          [label]="'BUTTONS.CANCEL' | translate" 
          icon="pi pi-times" 
          (click)="hideDialog()" 
          styleClass="p-button-text"
        ></p-button>
        <p-button 
          [label]="'BUTTONS.SAVE' | translate" 
          icon="pi pi-check" 
          (click)="saveSeason()" 
          [disabled]="!isEditSeasonFormValid()"
        ></p-button>
      </div>
    </p-dialog>

    <p-dialog [(visible)]="isDeleteSeasonModuleVisible" [style]="{width: '450px'}" [header]="'CONTENT-MANAGEMENT.SEASONS.DELETE.TITLE' | translate" [modal]="true" [contentStyle]="{overflow: 'visible'}">
      <label>{{ 'CONTENT-MANAGEMENT.SEASONS.DELETE.TEXT' | translate }} <b>{{ selectedSeason?.year }}</b>?</label>
      <div class="p-dialog-footer">
        <p-button 
          [label]="'BUTTONS.CANCEL' | translate" 
          icon="pi pi-times" 
          (click)="hideDialog()" 
          styleClass="p-button-text"
        ></p-button>
        <p-button 
          [label]="'BUTTONS.DELETE' | translate" 
          icon="pi pi-trash" 
          (click)="deleteSeason(selectedSeason!.id)" 
          styleClass="p-button-danger"
        ></p-button>
      </div>
    </p-dialog>

    <p-dialog [(visible)]="isCreateSeasonModuleVisible" [style]="{width: '250px'}" [header]="'CONTENT-MANAGEMENT.SEASONS.ADD.TITLE' | translate" [modal]="true" [contentStyle]="{overflow: 'visible'}">
      <div class="field">
        <label for="seasonStartDate">{{ 'CONTENT-MANAGEMENT.SEASONS.ADD.SEASON-START-DATE' | translate }}</label>
        <p-datePicker  
          id="seasonStartDate" 
          [(ngModel)]="createSeasonStartDate" 
          [readonlyInput]="true" 
          dateFormat="dd.mm.yy"
          [showIcon]="true"
          [placeholder]="'CONTENT-MANAGEMENT.SEASONS.ADD.SELECT-START-DATE' | translate" 
          appendTo="body"
          (onSelect)="handleCreateSeasonStartDateSelect()"
        >
        </p-datePicker>
      </div>
      <div class="field">
        <label for="endStartDate">{{ 'CONTENT-MANAGEMENT.SEASONS.ADD.SEASON-END-DATE' | translate }}</label>
        <p-datePicker  
          id="endStartDate" 
          [(ngModel)]="createSeasonEndDate" 
          [readonlyInput]="true" 
          dateFormat="dd.mm.yy"
          [minDate]="createSeasonStartDate"
          [showIcon]="true"
          [placeholder]="'CONTENT-MANAGEMENT.SEASONS.ADD.SELECT-END-DATE' | translate" 
          appendTo="body"
        >
        </p-datePicker>
      </div>
      <div class="p-dialog-footer">
        <p-button 
          [label]="'BUTTONS.CANCEL' | translate" 
          icon="pi pi-times" 
          (click)="hideDialog()" 
          styleClass="p-button-text"
        ></p-button>
        <p-button 
          [label]="'BUTTONS.SAVE' | translate" 
          icon="pi pi-check" 
          (click)="createSeason()" 
          [disabled]="!isCreateSeasonFormValid()"
        ></p-button>
      </div>
    </p-dialog>
    <p-toast></p-toast>
  `,
  styles: `
    .seasons-container{
      padding: 2rem;
      background-color: var(--surface-card);
      border-radius: 8px;
      box-shadow: var(--card-shadow);

      .title{
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        width: 100%;
        padding-bottom: 10px;
      }
    }

    .field{
      display: flex;
      flex-direction: column;

      width: 200px;
      padding-bottom: 20px;
    }

    .p-dialog-footer{
      padding-top: 20px;
    }
  `
})
export class SeasonsComponent {
  seasons: Season[] = [];
  selectedSeason?: Season;

  createSeasonYear = new Date().getFullYear();
  createSeasonStartDate = new Date(new Date().getFullYear(), 2, 31);
  createSeasonEndDate = new Date(new Date().getFullYear(), 10, 15);

  editSeasonYear = new Date().getFullYear();
  editSeasonStartDate = new Date();
  editSeasonEndDate = new Date();

  isCreateSeasonModuleVisible = false;
  isEditSeasonModuleVisible = false;
  isDeleteSeasonModuleVisible = false;
  
  constructor(
    private dataService: DataService,
    private seasonService: SeasonService,
    private messageService: MessageService,
    private translateService: TranslateService,
  ) {
    this.dataService.seasons$
      .pipe(nonNull())
      .subscribe(seasons => {
        this.seasons = seasons.sort((a, b) => a.year - b.year);
      });
  }

  openCreateSeasonWindow(){
    this.createSeasonYear = new Date().getFullYear();
    this.createSeasonStartDate = new Date(new Date().getFullYear(), 2, 31);
    this.createSeasonEndDate = new Date(new Date().getFullYear(), 10, 15);

    this.isCreateSeasonModuleVisible = true;
  }

  openEditSeasonWindow(season: Season){
    this.selectedSeason = season;

    this.editSeasonYear = season.year;
    this.editSeasonStartDate = new Date(season.season_start_date);
    this.editSeasonEndDate = new Date(season.season_end_date);

    this.isEditSeasonModuleVisible = true;
  }

  openDeleteSeasonWindow(season: Season){
    this.selectedSeason = season;

    this.isDeleteSeasonModuleVisible = true;
  }

  hideDialog(){
    this.selectedSeason = undefined;
  }

  createSeason(){
    let newSeason: Partial<Season> = {
      year: this.createSeasonStartDate.getFullYear(),
      season_start_date: this.formatDateLocal(this.createSeasonStartDate),
      season_end_date: this.formatDateLocal(this.createSeasonEndDate),
    }

    this.seasonService.createSeason(newSeason).then(res => {
      if(res) {
        this.messageService.add({ 
          severity: 'success', 
          summary: this.translateService.instant('CONTENT-MANAGEMENT.SEASONS.MESSAGES.SUCCESS'), 
          detail: this.translateService.instant('CONTENT-MANAGEMENT.SEASONS.MESSAGES.CREATE-SUCCESS'), 
          life: 3000 
        });
      } else {
        this.messageService.add({ 
          severity: 'error', 
          summary: this.translateService.instant('CONTENT-MANAGEMENT.SEASONS.MESSAGES.ERROR'), 
          detail: this.translateService.instant('CONTENT-MANAGEMENT.SEASONS.MESSAGES.CREATE-ERROR'),
          life: 3000 
        });
      }

      this.isCreateSeasonModuleVisible = false;
    });
  }

  saveSeason(){
    if(!this.selectedSeason) return;

    let updatedSeason: Partial<Season> = {
      id: this.selectedSeason.id,
      year: this.editSeasonStartDate.getFullYear(),
      season_start_date: this.formatDateLocal(this.editSeasonStartDate),
      season_end_date: this.formatDateLocal(this.editSeasonEndDate),
    }

    this.seasonService.updateSeason(updatedSeason).then(res => {
      if(res) {
        this.messageService.add({ 
          severity: 'success', 
          summary: this.translateService.instant('CONTENT-MANAGEMENT.SEASONS.MESSAGES.SUCCESS'), 
          detail: this.translateService.instant('CONTENT-MANAGEMENT.SEASONS.MESSAGES.EDIT-SUCCESS'), 
          life: 3000 
        });
      } else {
        this.messageService.add({ 
          severity: 'error', 
          summary: this.translateService.instant('CONTENT-MANAGEMENT.SEASONS.MESSAGES.ERROR'), 
          detail: this.translateService.instant('CONTENT-MANAGEMENT.SEASONS.MESSAGES.EDIT-ERROR'),
          life: 3000 
        });
      }

      this.isEditSeasonModuleVisible = false;
    });
  }

  deleteSeason(seasonId: number){
    this.seasonService.deleteSeason(seasonId).then(res => {
      if(res) {
        this.messageService.add({ 
          severity: 'success', 
          summary: this.translateService.instant('CONTENT-MANAGEMENT.SEASONS.MESSAGES.SUCCESS'), 
          detail: this.translateService.instant('CONTENT-MANAGEMENT.SEASONS.MESSAGES.DELETE-SUCCESS'), 
          life: 3000 
        });
      } else {
        this.messageService.add({ 
          severity: 'error', 
          summary: this.translateService.instant('CONTENT-MANAGEMENT.SEASONS.MESSAGES.ERROR'), 
          detail: this.translateService.instant('CONTENT-MANAGEMENT.SEASONS.MESSAGES.DELETE-ERROR'),
          life: 3000 
        });
      }

      this.isDeleteSeasonModuleVisible = false;
    });
  }

  isCreateSeasonFormValid(){
    return this.createSeasonStartDate && 
          this.createSeasonEndDate && 
          this.createSeasonEndDate > this.createSeasonStartDate;
  }

  isEditSeasonFormValid(){
    return this.editSeasonStartDate && 
          this.editSeasonEndDate &&
          this.editSeasonEndDate > this.editSeasonStartDate;
  }

  formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  handleCreateSeasonStartDateSelect(){
    if(this.createSeasonStartDate > this.createSeasonEndDate){
      this.createSeasonEndDate = new Date(this.createSeasonStartDate);
    }
  }

  handleEditSeasonStartDateSelect(){
    if(this.editSeasonStartDate > this.editSeasonEndDate){
      this.editSeasonEndDate = new Date(this.editSeasonStartDate);
    }
  }
}
