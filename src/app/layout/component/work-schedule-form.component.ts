import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { DataService, Profile, ProfileWorkSchedule, ShiftType } from '../../pages/service/data.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';

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
    <div class="p-fluid">
      <!-- Two-column layout -->
      <div class="form-grid">
        <!-- Left column -->
        <div class="form-col">
          @if(profile){
            <div class="field">
              <label for="lastName">{{ 'WORK-SCHEDULE.MODAL.EMPLOYEE' | translate }}</label>
              <span id="employee-name">{{ profile.first_name }}</span>
            </div>
          }
          <div class="field">
              <label for="startDate">{{ 'WORK-SCHEDULE.MODAL.START-DATE' | translate }}</label>
              <p-datePicker  
                id="startDate" 
                [(ngModel)]="startDate" 
                [readonlyInput]="true" 
                dateFormat="dd.mm.yy"
                [minDate]="minStartDate" 
                [maxDate]="maxDate" 
                [showIcon]="true"
                [placeholder]="'WORK-SCHEDULE.MODAL.SELECT-START-DATE' | translate" 
                (onSelect)="onStartDateChange()"
                appendTo="body"
              >
              </p-datePicker>
          </div>
        </div>
        
        <!-- Right column -->
        <div class="form-col">
          <div class="field">
            <label for="colors">{{ 'WORK-SCHEDULE.MODAL.SHIFT' | translate }}</label>
            <p-select 
              [options]="shiftTypes" 
              [(ngModel)]="selectedShift"
              optionLabel="name"
              [ngStyle]="{ 'width': '210px'}"
              [panelStyle]="{ 'max-height': '200px' }"
              [placeholder]="'WORK-SCHEDULE.MODAL.SELECT-A-SHIFT' | translate"
              appendTo="body"
            >
              <ng-template let-option pTemplate="item">
                <div>{{ option.name | titlecase }}</div>
              </ng-template>
              <ng-template let-selectedOption pTemplate="selectedItem">
                <div>{{ selectedOption.name | titlecase }}</div>
              </ng-template>
            </p-select>
          </div>
          <div class="field">
            <label for="endDate">{{ 'WORK-SCHEDULE.MODAL.END-DATE' | translate }}</label>
            <p-datePicker  
              id="endDate" 
              [(ngModel)]="endDate" 
              [readonlyInput]="true" 
              dateFormat="dd.mm.yy"
              [minDate]="minEndDate" 
              [maxDate]="maxDate" 
              [showIcon]="true"
              [placeholder]="'WORK-SCHEDULE.MODAL.SELECT-END-DATE' | translate" 
              (onSelect)="checkForDateConflicts()"
              appendTo="body"
            >
            </p-datePicker>
          </div>
          </div>
        </div>
      </div>

      <!-- Full width notes field -->
      <!-- <div class="field mt-3">
          <label for="notes">{{ 'WORK-SCHEDULE.MODAL.NOTES' | translate }}</label>
          <textarea 
              id="notes" 
              rows="4" 
              class="p-inputtext"
              pTextarea  
              [(ngModel)]="notes" 
              [placeholder]="'WORK-SCHEDULE.MODAL.NOTES-ENTER-INFO' | translate">
          </textarea>
      </div> -->
      
      @if(dateConflictError){
        <div class="field">
          <div class="p-error">{{dateConflictError}}</div>
        </div>
      }
    <ng-template pTemplate="footer">
      <div class="form-footer">
        <div class="left-buttons">
          @if(isEditMode){
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
          <p-button [label]="'BUTTONS.SAVE' | translate" icon="pi pi-check" (click)="onSave()" [disabled]="!!dateConflictError" styleClass="p-button-text"></p-button>
        </div>
      </div>
    </ng-template>
  </p-dialog> 
  `,
  styles: `:host ::ng-deep {
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
        
        .p-dialog-content {
            padding: 1.5rem;
        }
        
        .p-dialog-footer {
            padding: 1rem;
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
    
    // Each form column
    .form-col {
        padding: 0 0.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
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
        
        // Responsive styling for small screens
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

    .babies-cribs-row, .pets-row {
        display: flex;
        width: 100%;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        
        .half-field {
            flex: 1;
            min-width: 0;
            margin-right: 1rem;
        }

        .half-field:last-child {
            margin-right: 0;
        }
        
        .p-inputnumber{
            width: 100% !important;
        }

        .p-inputnumber-input{
            width: 40px !important;
        }
    }
} `
})
export class WorkScheduleFormComponent {
  @Input() visible = false;
  @Input() profileWorkSchedule?: Partial<ProfileWorkSchedule>;
  @Input() profileId!: string;
  @Input() profile: Profile | undefined = undefined;
  @Input() startDate!: Date;
  @Input() endDate!: Date;
  @Input() fullWorkSchedule: ProfileWorkSchedule[] = [];

  notes: string = '';
  minEndDate!: Date;
  selectedShift: ShiftType | undefined = undefined;
  shiftTypes: ShiftType[] = [];

  // New computed property to determine if we're editing an existing reservation
  get isEditMode(): boolean {
    return !!(this.profileWorkSchedule && this.profileWorkSchedule.id && this.profileWorkSchedule.id < 1000000);
  }

  private _minStartDate: Date | null = null;

  get minStartDate(): Date {
    if (this.isEditMode) {
      if (!this._minStartDate) {
        this._minStartDate = new Date(1900, 0, 1);
      }
      return this._minStartDate;
    }

    if (!this._minStartDate || this._minStartDate.getFullYear() != new Date().getFullYear()) {
      this._minStartDate = new Date();
      this._minStartDate.setHours(0, 0, 0, 0);
    }

    return this._minStartDate;
  }

  // Max date is 2 years from now
  maxDate: Date = new Date(new Date().setFullYear(new Date().getFullYear() + 2));
  dateConflictError: string | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<ProfileWorkSchedule>();
  @Output() delete = new EventEmitter<{ scheduleId: number; profileId: string }>();

  constructor(
    private confirmationService: ConfirmationService,
    private translateService: TranslateService,
    private messageService: MessageService,
    private dataService: DataService,
  ) {

  }

  ngOnInit() {
    this.dataService.shiftTypes$.subscribe(shiftTypes => {
      this.shiftTypes = shiftTypes;

      if (this.profileWorkSchedule?.shift_type_id) {
        this.selectedShift = shiftTypes.find(st => st.id == this.profileWorkSchedule?.shift_type_id);
      } else {
        this.selectedShift = shiftTypes.find(st => st.name == 'morning');
      }
    });

    this.dataService.profiles$.subscribe(profiles => {
      this.profile = profiles.find(profile => profile.id == this.profileWorkSchedule?.profile_id);
    })

    this.updateMinEndDate();
    this.ensureDatesAreValid();
  }

  private ensureDatesAreValid() {
    if (typeof this.startDate === 'string') {
      this.startDate = new Date(this.startDate);
    }

    if (typeof this.endDate === 'string') {
      this.endDate = new Date(this.endDate);
    }

    if (!(this.startDate instanceof Date) || isNaN(this.startDate.getTime())) {
      this.startDate = new Date();
    }

    if (!(this.endDate instanceof Date) || isNaN(this.endDate.getTime())) {
      this.endDate = new Date(this.startDate);
    }

    this.startDate.setHours(0, 0, 0, 0);
    this.endDate.setHours(0, 0, 0, 0);
  }

  updateMinEndDate() {
    if (this.isEditMode) {
      this.minEndDate = new Date(this.startDate);
      return;
    }

    if (!this.startDate) {
      this.minEndDate = this.minStartDate;
      return;
    }

    const startDate = new Date(this.startDate);
    startDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate.getTime() >= today.getTime()) {
      startDate.setDate(startDate.getDate() + 1);
      this.minEndDate = startDate;
    } else {
      this.minEndDate = today;
    }
  }

  onStartDateChange(): void {
    if (!this.startDate || !(this.startDate instanceof Date) || isNaN(this.startDate.getTime())) {
      if (this.isEditMode && this.profileWorkSchedule?.start_date) {
        this.startDate = new Date(this.profileWorkSchedule.start_date);
      } else {
        this.startDate = new Date();
      }

      this.startDate.setHours(0, 0, 0, 0);
    } else {
      this.startDate.setHours(0, 0, 0, 0);
      this.profileWorkSchedule!.start_date = this.startDate.toLocaleDateString('en-CA').split('T')[0];
    }

    if (
      !this.endDate ||
      !(this.endDate instanceof Date) ||
      isNaN(this.endDate.getTime()) ||
      new Date(this.endDate).getTime() < new Date(this.startDate).getTime()
    ) {
      this.endDate = new Date(this.startDate);
      this.endDate.setHours(0, 0, 0, 0);
    }

    this.updateMinEndDate();
    this.checkForDateConflicts();
  }

  // Add this method to check if the selected dates conflict with existing reservations
  checkForDateConflicts(): void {
    if (!this.startDate || !this.endDate) {
      this.dateConflictError = null;
      return;
    }

    const startMs = new Date(this.startDate).setHours(0, 0, 0, 0);
    const endMs = new Date(this.endDate).setHours(0, 0, 0, 0);

    const conflictingProfileWorkSchedule = this.fullWorkSchedule.find(schedule => {
      if (this.profileWorkSchedule?.id == schedule.id) {
        return false;
      }

      if (schedule.profile_id !== this.profileId) {
        return false;
      }

      const reservationStartMs = new Date(schedule.start_date).setHours(0, 0, 0, 0);
      const reservationEndMs = new Date(schedule.end_date).setHours(0, 0, 0, 0);

      return (startMs >= reservationStartMs && startMs <= reservationEndMs) ||
        (endMs >= reservationStartMs && endMs <= reservationEndMs) ||
        (startMs <= reservationStartMs && endMs >= reservationEndMs);
    });

    if (conflictingProfileWorkSchedule) {
      this.dateConflictError = `This date range conflicts with a reservation for ${conflictingProfileWorkSchedule.profile_id || 'Unknown'}`;
    } else {
      this.profileWorkSchedule!.end_date = this.endDate.toLocaleDateString('en-CA').split('T')[0];
      this.dateConflictError = null;
    }
  }

  onSave(): void {
    this.checkForDateConflicts();
    if (this.dateConflictError) {
      return;
    }

    const adjustedEndDate = new Date(this.endDate);
    adjustedEndDate.setDate(adjustedEndDate.getDate() - 1);

    const profileWorkSchedule: ProfileWorkSchedule = {
      ...this.profileWorkSchedule,
      shift_type_id: this.selectedShift!.id,
    } as ProfileWorkSchedule;

    this.save.emit(profileWorkSchedule);
    this.visibleChange.emit(false);
  }

  onCancel(): void {
    this.notes = '';
    this.visibleChange.emit(false);
  }

  onDelete(): void {
    if (this.isEditMode && this.profileWorkSchedule?.id) {
      // Confirm deletion
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
            scheduleId: this.profileWorkSchedule?.id ?? -1,
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
      })
    }
  }
}
