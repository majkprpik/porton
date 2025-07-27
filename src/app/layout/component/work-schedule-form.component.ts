import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DataService, Profile, ProfileWorkDay, ProfileWorkSchedule } from '../../pages/service/data.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { MultiSelect } from 'primeng/multiselect';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-work-schedule-form',
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    DialogModule,
    DatePickerModule,
    SelectModule,
    ButtonModule,
    RadioButtonModule,
    MultiSelect,
  ],
  template: `
  <p-dialog 
    [(visible)]="visible" 
    [modal]="true" 
    [style]="{width: '700px'}" 
    [draggable]="false" 
    [resizable]="false"
    (onHide)="onCancel()"
  >
    <ng-template pTemplate="header">
      <h3>
        {{ profileWorkSchedule?.id ? ('WORK-SCHEDULE.MODAL.EDIT-SCHEDULE' | translate) : ('WORK-SCHEDULE.MODAL.CREATE-SCHEDULE' | translate) }}
      </h3>
    </ng-template>

    <div class="top">
      <div class="field">
        <label for="lastName">{{ 'WORK-SCHEDULE.MODAL.EMPLOYEE' | translate }}</label>
        @if(profileWorkSchedule?.id) {
          <div class="field">
            <span id="employee-name">{{ profile?.first_name }}</span>
          </div>
        } @else {
          <p-multiselect 
            [options]="availableProfiles" 
            [(ngModel)]="selectedProfilesForSchedule"
            optionLabel="first_name" 
            optionValue="id" 
            [placeholder]="'APP-LAYOUT.UNSCHEDULED-TASK-REPORT.SELECT-LOCATION' | translate" 
            [style]="{ width: '100%' }" 
            appendTo="body"
          >
            <ng-template let-item pTemplate="item">
              <span>{{ item.first_name }}</span>
            </ng-template>
          </p-multiselect>
        }
      </div>

      <div class="field">
        <label for="colors">{{ 'RESERVATIONS.MODAL.COLOR' | translate }}</label>
        <p-select 
          [options]="colors" 
          [(ngModel)]="selectedColor"
          [ngStyle]="{ 'width': '210px'}"
          [panelStyle]="{ 'max-height': '200px' }"
          [placeholder]="'RESERVATIONS.MODAL.SELECT-A-COLOR' | translate"
          appendTo="body"
        >
          <ng-template let-option pTemplate="item">
            <div class="color-item" [style.background]="option"></div>
          </ng-template>
          <ng-template let-selectedOption pTemplate="selectedItem">
            <div class="color-item" [style.background]="selectedOption"></div>
          </ng-template>
        </p-select>
      </div>
    </div>

    <div class="set-all-schedule">
      <div class="set-schedule">
        <label id="set-all-schedule-label">
          <p-radiobutton 
            name="scheduleMode" 
            [(ngModel)]="scheduleMode"
            value="all"
            (ngModelChange)="onScheduleModeChange($event)"
          ></p-radiobutton>
          Set whole schedule
        </label>

        <label id="set-schedule-label">
          <p-radiobutton 
            name="scheduleMode" 
            [(ngModel)]="scheduleMode"
            value="dayByDay"
            (ngModelChange)="onScheduleModeChange($event)"
          ></p-radiobutton>
          Set by day
        </label>
      </div>
      <div 
        class="days"
        [ngStyle]="{
          'display': scheduleMode == 'dayByDay' ? 'none' : '',
        }"
      >
        <b>{{ startDate | date: 'dd.MM.' }} - {{ endDate | date: 'dd.MM.' }}</b>
        <div class="start-time">
          <label for="startDate">{{ 'RESERVATIONS.MODAL.START-DATE' | translate }}</label>
          <p-datePicker  
            id="startDate" 
            [readonlyInput]="true" 
            [timeOnly]="true"
            [showIcon]="true"
            [placeholder]="'RESERVATIONS.MODAL.SELECT-START-DATE' | translate" 
            appendTo="body"
            [(ngModel)]="everyDayStart"
          >
          </p-datePicker>
        </div>

        <div class="end-time">
          <label for="endDate">{{ 'RESERVATIONS.MODAL.END-DATE' | translate }}</label>
          <p-datePicker  
            id="endDate" 
            [readonlyInput]="true" 
            [timeOnly]="true"
            [showIcon]="true"
            [placeholder]="'RESERVATIONS.MODAL.SELECT-END-DATE' | translate" 
            appendTo="body"
            [(ngModel)]="everyDayEnd"
          >
          </p-datePicker>
        </div>
      </div>
    </div>

    <div class="schedule">
      <div 
        class="days" 
        [ngStyle]="{
          'display': scheduleMode == 'all' ? 'none' : '',
        }"
      >
        @for(day of workDays; let i = $index; track i){
          <div class="day">
            <b>{{ day.day | date: 'EEE' }} - {{ day.day | date: 'dd.MM.' }}</b>
            <div class="start-time">
              <label for="endDate">{{ 'RESERVATIONS.MODAL.START-DATE' | translate }}</label>
              <p-datePicker  
                id="endDate" 
                [readonlyInput]="true" 
                [timeOnly]="true"
                [showIcon]="true"
                [placeholder]="'RESERVATIONS.MODAL.SELECT-START-DATE' | translate" 
                appendTo="body"
                [(ngModel)]="day.start_time"
              >
              </p-datePicker>
            </div>
  
            <div class="end-time">
              <label for="endDate">{{ 'RESERVATIONS.MODAL.END-DATE' | translate }}</label>
              <p-datePicker  
                id="endDate" 
                [readonlyInput]="true" 
                [timeOnly]="true"
                [showIcon]="true"
                [placeholder]="'RESERVATIONS.MODAL.SELECT-END-DATE' | translate"
                appendTo="body"
                [(ngModel)]="day.end_time"
              >
              </p-datePicker>
            </div>
          </div>
        }
      </div>
    </div>

    <ng-template pTemplate="footer">
      <div class="form-footer">
        <div class="left-buttons">
          @if(profileWorkSchedule?.id){
            <p-button
              [label]="'BUTTONS.DELETE' | translate"
              icon="pi pi-trash" 
              (click)="onDelete()" 
              styleClass="p-button-danger p-button-text">
            </p-button>
          }
        </div>
        <div class="right-buttons">
          <p-button [label]="'BUTTONS.CANCEL' | translate" icon="pi pi-times" (click)="onCancel()" styleClass="p-button-text"></p-button>
          <p-button 
            [label]="'BUTTONS.SAVE' | translate" 
            icon="pi pi-check" 
            (click)="onSave()" 
            styleClass="p-button-text"
            [disabled]="!profileWorkSchedule?.id && !this.selectedProfilesForSchedule.length"
          ></p-button>
        </div>
      </div>
    </ng-template>
  </p-dialog> 
  `,
  styles: `
  :host ::ng-deep {
    .p-dialog {
      .p-dialog-header {
        padding: 1rem 1.5rem;
        background-color: #f8f9fa;
        border-bottom: 1px solid #dee2e6;
        border-radius: 10px 10px 0 0;

        h3{
        margin: 0;
        }
      }

      .top{
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        width: 100%;
      }
      
      .p-dialog-content {
        padding: 1.5rem;
      }
      
      .p-dialog-footer {
        padding: 1rem;
      }

      .schedule{
        display: flex;
        flex-direction: column; 
        gap: 10px;

        #set-schedule-label{
          width: 100px;
          padding-bottom: 10px;
        }

        .days{
          display: flex;
          flex-direction: column;
          width: 100%;
          justify-content: space-between;
          box-sizing: border-box;
          padding: 5px;
          border-radius: 10px;

          .day{
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            padding-bottom: 10px;

            b{
              display: flex;
              flex-direction: row;
              align-items: center;
            }
  
            .start-time, .end-time{
              display: flex;
              flex-direction: column;
            }
          }
        }

        .no-click:hover {
          cursor: not-allowed;
        }
      }

      .set-all-schedule{
        display: flex;
        flex-direction: column;
        width: 100%;
        padding-bottom: 10px;

        .set-schedule{
          display: flex;
          flex-direction: row;
          gap: 20px;
          padding: 10px 0 10px 0;
        }

        #set-all-schedule-label{
          width: 150px;
          padding-bottom: 10px;
        }
        
        .days{
          display: flex;
          flex-direction: row;
          justify-content: flex-end;
          gap: 96px;
          width: 100%;
          box-sizing: border-box;
          padding: 5px;
          border-radius: 10px;

          b{
            width: 140px;
            display: flex;
            flex-direction: row;
            align-items: center;
          }

          .start-time, .end-time{
            display: flex;
            flex-direction: column;
          }
        }

        .no-click:hover {
          cursor: not-allowed !important;
        }
      }
    }
    
    // Simple two-column grid layout
    .form-grid {
      display: grid;
      grid-template-columns: 1fr; // One column by default (mobile)
      gap: 1rem;
      
      @media (min-width: 768px) {
        grid-template-columns: 1fr 1fr; // Two columns on wider screens
      }
    }
    
    .field {
      margin-bottom: 1.25rem;
      
      label {
        font-weight: 500;
        margin-bottom: 0.5rem;
        display: block;
      }

      #employee-name{
        font-weight: bold;
        font-size: 16px;
      }
    }
    
    // Full width inputs
    .p-calendar, 
    .p-inputnumber,
    input[type="text"],
    textarea {
        width: 100%;
    }
    
    textarea {
        resize: vertical;
        min-height: 80px;
    }
    
    .p-error {
        margin-top: 0.25rem;
        color: #dc3545;
        font-size: 0.875rem;
        padding: 0.5rem;
        background-color: rgba(220, 53, 69, 0.1);
        border-radius: 4px;
    }

    .mt-3 {
        margin-top: 1rem;
    }

    .form-footer {
      display: flex;
      justify-content: space-between;
      width: 100%;
      
      .left-buttons {
        display: flex;
        justify-content: flex-start;
      }
      
      .right-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
      }
      
      @media (max-width: 576px) {
        flex-direction: column;
        gap: 1rem;
        
        .left-buttons {
          justify-content: center;
          
          .p-button {
            width: 100%;
          }
        }
        
        .right-buttons {
          justify-content: space-between;
          
          .p-button {
            flex: 1;
          }
        }
      }
    }
  }
`
})
export class WorkScheduleFormComponent {
  @Input() visible = false;
  @Input() profileWorkSchedule?: Partial<ProfileWorkSchedule>;
  @Input() profileId!: string;
  @Input() profile?: Profile;
  @Input() startDate!: Date;
  @Input() endDate!: Date;
  @Input() fullWorkSchedule: ProfileWorkSchedule[] = [];
  @Input() colors: any[] = [];

  workDays: ProfileWorkDay[] = [];
  profileWorkDays: ProfileWorkDay[] = [];
  profiles: Profile[] = [];
  selectedProfilesForSchedule: string[] = [];
  availableProfiles: Profile[] = [];

  everyDayStart: Date = new Date();
  everyDayEnd: Date = new Date();

  scheduleMode: 'all' | 'dayByDay' = 'all';
  selectedColor: string = '';

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<{ profileWorkDays: ProfileWorkDay[]; profileWorkSchedule: Partial<ProfileWorkSchedule>[] }>();
  @Output() delete = new EventEmitter<{ scheduleId: number; profileId: string }>();

  constructor(
    private confirmationService: ConfirmationService,
    private translateService: TranslateService,
    private messageService: MessageService,
    private dataService: DataService,
  ) {

  }

  ngOnInit() {
    combineLatest([
      this.dataService.profiles$,
      this.dataService.profileWorkDays$,
    ]).subscribe(([profiles, pwd]) => {
      this.profiles = profiles;
      this.profileWorkDays = pwd;
      this.availableProfiles = this.getAvailableProfiles();
      this.profile = profiles.find(profile => profile.id == this.profileId);

      if(this.profile){
        this.selectedProfilesForSchedule.push(this.profile.id);
      }

      this.setProfileWorkDays();
      this.getAvailableProfiles();
      this.setInitColor();
    });

    this.preSelectScheduleMode();
    this.setDefaultTimes();
  }

  preSelectScheduleMode(){
    this.scheduleMode = this.profileWorkSchedule?.id ? 'dayByDay' : 'all';
  }

  setProfileWorkDays(){
    if(this.profileWorkSchedule?.id){
      this.workDays = this.profileWorkDays.filter(pwd => 
        pwd.profile_id == this.profileId &&
        pwd.profile_work_schedule_id == this.profileWorkSchedule?.id
      );

      this.workDays = this.workDays.map(wd => {
        return {
          ...wd,
          start_time: wd.start_time.slice(0, 5),
          end_time: wd.end_time.slice(0, 5),
        }
      })
    } else {
      this.workDays = this.getProfileWorkDays();
    }
  }

  getAvailableProfiles() {
    const start = this.setToMidnight(this.startDate);
    const end = this.setToMidnight(this.endDate);

    const conflictingDays = this.profileWorkDays.filter(day => {
      const dayDate = this.setToMidnight(new Date(day.day));
      return dayDate >= start && dayDate <= end;
    });

    return this.profiles.filter(profile => !conflictingDays.some(cd => cd.profile_id == profile.id));
  }

  setToMidnight(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  setInitColor(){
    if (this.colors.length > 0 && !this.selectedColor) {
      if(this.profileWorkSchedule?.id){
        const color = this.profileWorkSchedule.color!;
        this.selectedColor = color;
      } else {
        this.selectedColor = this.colors[0];
      }
    }
  }

  stringToTimeDate(timeStr: string): Date {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, seconds || 0, 0);
    return date;
  }

  onScheduleModeChange(newMode: 'all' | 'dayByDay'){
    this.scheduleMode = newMode;
  }

  setDefaultTimes() {
    const start = new Date();
    start.setHours(9, 0, 0, 0);
    this.everyDayStart = start;

    const end = new Date();
    end.setHours(17, 0, 0, 0);
    this.everyDayEnd = end;
  }

  getProfileWorkDays() {
    const workDays: ProfileWorkDay[] = [];

    const current = new Date(this.startDate);
    const end = new Date(this.endDate);

    current.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    while (current <= end) {
      const pwd: ProfileWorkDay = {
        profile_id: this.profileId,
        start_time: '09:00',
        end_time: '17:00',
        day: current.toLocaleDateString('en-CA').split('T')[0],
      }
      workDays.push(pwd);
      current.setDate(current.getDate() + 1);
    }

    return workDays;
  }

  onSave(): void {
    if(!this.profileWorkSchedule) return;
    if(!this.selectedProfilesForSchedule.length) return; 

    if(this.scheduleMode == 'all'){
      this.workDays.forEach(workDay => {
        workDay.start_time = this.formatDateToHHMM(this.everyDayStart);
        workDay.end_time = this.formatDateToHHMM(this.everyDayEnd);
      });
    } else if(this.scheduleMode == 'dayByDay'){
      this.workDays.forEach(workDay => {
        if(typeof workDay.start_time !== 'string'){
          workDay.start_time = this.formatDateToHHMM(workDay.start_time);
        }
        if(typeof workDay.end_time !== 'string'){
          workDay.end_time = this.formatDateToHHMM(workDay.end_time);
        }
      });
    } 

    let profileSchedules: Partial<ProfileWorkSchedule>[] = []; 

    if(!this.profileWorkSchedule.id){
      this.selectedProfilesForSchedule.forEach(profileId => {
        profileSchedules.push({
          profile_id: profileId,
          start_date: this.startDate.toLocaleDateString('en-CA').split('T')[0],
          end_date: this.endDate.toLocaleDateString('en-CA').split('T')[0],
          color: this.selectedColor,
        })
      });
    } else {
      this.profileWorkSchedule.color = this.selectedColor;
      profileSchedules.push(this.profileWorkSchedule);
    }

    this.save.emit({ profileWorkDays: this.workDays, profileWorkSchedule: profileSchedules });
    this.visibleChange.emit(false);
  }

  formatDateToHHMM(date: Date){
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  onCancel(): void {
    this.visibleChange.emit(false);
  }

  onDelete(): void {
    if (this.profileWorkSchedule?.id) {
      this.confirmationService.confirm({
        message: this.translateService.instant('WORK-SCHEDULE.MESSAGES.CONFIRM-DELETE'),
        header: this.translateService.instant('WORK-SCHEDULE.MESSAGES.HEADER'),
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
          this.delete.emit({
            scheduleId: this.profileWorkSchedule!.id!,
            profileId: this.profileId
          });

          this.visibleChange.emit(false);
          this.messageService.add({
            severity: 'info',
            summary: this.translateService.instant('WORK-SCHEDULE.MESSAGES.UPDATED'),
            detail: this.translateService.instant('WORK-SCHEDULE.MESSAGES.DELETED-SUCCESS')
          });
        },
        reject: () => {
          this.messageService.add({
            severity: 'warn',
            summary: this.translateService.instant('WORK-SCHEDULE.MESSAGES.CANCELLED'),
            detail: this.translateService.instant('WORK-SCHEDULE.MESSAGES.CANCELLED-DELETE')
          });
        }
      });
    }
  }
}
