import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { HouseAvailability } from '../../../core/models/data.models';

@Component({
    selector: 'app-reservation-form',
    template: `
        <p-dialog [(visible)]="visible" [modal]="true" [style]="{width: '700px'}" [draggable]="false" [resizable]="false">
            <ng-template pTemplate="header">
                <h3>
                    {{ reservation.house_availability_id ? 
                        reservation.house_id && reservation.house_id < 0 ? 
                        ('RESERVATIONS.MODAL.EDIT-TEMP-RESERVATION' | translate) : 
                        ('RESERVATIONS.MODAL.EDIT-RESERVATION' | translate) : 
                        reservation.house_id && reservation.house_id > 0 ? 
                            ('RESERVATIONS.MODAL.CREATE-RESERVATION' | translate) : 
                            ('RESERVATIONS.MODAL.CREATE-TEMP-RESERVATION' | translate)
                    }}
                </h3>
            </ng-template>
            <div class="p-fluid">
                <div class="form-grid">
                    <div class="form-col">
                        <div class="field">
                            <label for="lastName">{{ 'RESERVATIONS.MODAL.LAST-NAME' | translate }}*</label>
                            <input id="lastName" type="text" pInputText [(ngModel)]="reservation.last_name" />
                        </div>
                        <div class="field">
                            <label for="reservationNumber">{{ 'RESERVATIONS.MODAL.RESERVATION-NUMBER' | translate }}*</label>
                            <input id="reservationNumber" type="text" pInputText [(ngModel)]="reservation.reservation_number" />
                        </div>
                        <div class="field">
                            <div class="pets-row">
                                <div class="half-field">
                                    <label for="defaultPets">{{ 'RESERVATIONS.MODAL.PETS' | translate }}</label>
                                    <p-inputNumber class="small-input" id="defaultPets" [(ngModel)]="reservation.dogs_d" [min]="0" [max]="10"></p-inputNumber>
                                </div>
                                <div class="half-field">
                                    <label for="smallPets">{{ 'RESERVATIONS.MODAL.CHECK-IN' | translate }}</label>
                                    <p-datepicker [(ngModel)]="reservation.arrival_time" [iconDisplay]="'input'" [showIcon]="true" [timeOnly]="true" inputId="arrivalTime">
                                        <ng-template #inputicon let-clickCallBack="clickCallBack">
                                            <i class="pi pi-clock" (click)="clickCallBack($event)"></i>
                                        </ng-template>
                                    </p-datepicker>

                                </div>
                                <div class="half-field">
                                    <label for="bigPets">{{ 'RESERVATIONS.MODAL.CHECK-OUT' | translate }}</label>
                                    <p-datepicker [(ngModel)]="reservation.departure_time" [iconDisplay]="'input'" [showIcon]="true" [timeOnly]="true" inputId="departureTime">
                                        <ng-template #inputicon let-clickCallBack="clickCallBack">
                                            <i class="pi pi-clock" (click)="clickCallBack($event)"></i>
                                        </ng-template>
                                    </p-datepicker>
                                </div>
                            </div>
                        </div>
                        <div class="field">
                            <label for="startDate">{{ 'RESERVATIONS.MODAL.START-DATE' | translate }}</label>
                            <p-datePicker  
                                id="startDate" 
                                [(ngModel)]="startDate" 
                                [readonlyInput]="true" 
                                dateFormat="dd.mm.yy"
                                [minDate]="minStartDate" 
                                [maxDate]="maxDate" 
                                [showIcon]="true"
                                [placeholder]="'RESERVATIONS.MODAL.SELECT-START-DATE' | translate" 
                                (onSelect)="onStartDateChange()"
                                appendTo="body"
                            >
                            </p-datePicker>
                        </div>
                    </div>
                    
                    <div class="form-col">
                        <div class="field">
                            <label for="adults">{{ 'RESERVATIONS.MODAL.ADULTS' | translate }}</label>
                            <p-inputNumber id="adults" [(ngModel)]="reservation.adults" [min]="0" [max]="10"></p-inputNumber>
                        </div>
                        <div class="field">
                            <div class="babies-cribs-row">
                                <div class="half-field">
                                    <label for="babies">{{ 'RESERVATIONS.MODAL.BABIES' | translate }}</label>
                                    <p-inputNumber class="small-input" id="babies" [(ngModel)]="reservation.babies" [min]="0" [max]="10"></p-inputNumber>
                                </div>
                                <div class="half-field">
                                    <label for="cribs">{{ 'RESERVATIONS.MODAL.BABY-CRIBS' | translate }}</label>
                                    <p-inputNumber class="small-input" id="cribs" [(ngModel)]="reservation.cribs" [min]="0" [max]="10"></p-inputNumber>
                                </div>
                            </div>
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
                        <div class="field">
                            <label for="endDate">{{ 'RESERVATIONS.MODAL.END-DATE' | translate }}</label>
                            <p-datePicker  
                                id="endDate" 
                                [(ngModel)]="endDate" 
                                [readonlyInput]="true" 
                                dateFormat="dd.mm.yy"
                                [minDate]="minEndDate" 
                                [maxDate]="maxDate" 
                                [showIcon]="true"
                                [placeholder]="'RESERVATIONS.MODAL.SELECT-END-DATE' | translate" 
                                (onSelect)="checkForDateConflicts()"
                                appendTo="body"
                            >
                            </p-datePicker>
                        </div>
                    </div>
                </div>

                <div class="field mt-3">
                    <label for="notes">{{ 'RESERVATIONS.MODAL.NOTES' | translate }}</label>
                    <textarea 
                        id="notes" 
                        rows="4" 
                        class="p-inputtext"
                        pTextarea  
                        [(ngModel)]="notes" 
                        [placeholder]="'RESERVATIONS.MODAL.NOTES-ENTER-INFO' | translate">
                    </textarea>
                </div>
                
                @if(dateConflictError){
                    <div class="field">
                        <div class="p-error">{{dateConflictError}}</div>
                    </div>
                }

                <div class="info-field">
                    <div class="p-info">{{ 'RESERVATIONS.MODAL.REQUIRED-FIELDS' | translate }}</div>
                </div>
            </div>
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
                        <p-button 
                            [label]="'BUTTONS.CANCEL' | translate" 
                            icon="pi pi-times" 
                            (click)="onCancel()" 
                            styleClass="p-button-text"
                        ></p-button>
                        <p-button 
                            [label]="'BUTTONS.SAVE' | translate" 
                            icon="pi pi-check" 
                            (click)="onSave()" 
                            [disabled]="!isFormValid()" 
                            styleClass="p-button-text"
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
                    background-color: var(--surface-ground);
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
            
            .form-grid {
                display: grid;
                grid-template-columns: 1fr; 
                gap: 1rem;
                
                @media (min-width: 768px) {
                    grid-template-columns: 1fr 1fr;
                }
            }
            
            .form-col {
                padding: 0 0.5rem;
            }
            
            .field {
                margin-bottom: 1.25rem;
                
                label {
                    font-weight: 500;
                    margin-bottom: 0.5rem;
                    display: block;
                }
            }

            .info-field{
                margin-top: 30px;
            }
            
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

            .p-info{
                color: var(--text-color-secondary);
                font-size: 0.875rem;
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
        } 
    `,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        InputNumberModule,
        TranslateModule,
        SelectModule,
        DatePickerModule,
    ]
})
export class ReservationFormComponent implements OnInit, OnChanges {
    @Input() visible = false;
    @Input() reservation: Partial<HouseAvailability> = {};
    @Input() houseId!: number;
    @Input() startDate!: Date;
    @Input() endDate!: Date;
    @Input() existingReservations: HouseAvailability[] = [];  
    @Input() colors: any[] = [];
    
    notes: string = '';
    minEndDate!: Date;
    selectedColor: any;
    private _minStartDate: Date | null = null;

    get isEditMode(): boolean {
        return !!(this.reservation && this.reservation.house_availability_id && this.reservation.house_availability_id < 1000000);
    }
    
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
    
    maxDate: Date = new Date(new Date().setFullYear(new Date().getFullYear() + 2));
    dateConflictError: string | null = null;
    
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() save = new EventEmitter<HouseAvailability>();
    @Output() cancel = new EventEmitter<void>();
    @Output() delete = new EventEmitter<{ availabilityId: number; houseId: number }>();

    constructor(
        private confirmationService: ConfirmationService,
        private translateService: TranslateService,
        private messageService: MessageService,
    ) {}

    ngOnInit() {
        if(this.reservation){
            this.reservation.arrival_time = this.reservation.arrival_time ? this.timeStringToDate(this.reservation.arrival_time) : this.timeStringToDate("16:00:00");
            this.reservation.departure_time = this.reservation.departure_time ? this.timeStringToDate(this.reservation.departure_time) : this.timeStringToDate('10:00:00');
        }

        if(this.reservation && this.reservation.color_theme != undefined){
            this.selectedColor = this.colors[this.reservation.color_theme];
        }
        
        if (this.reservation && this.reservation.note) {
            this.notes = this.reservation.note;
        } else {
            this.notes = '';
        }
        
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

    ngOnChanges(changes: SimpleChanges) {
        if (changes['startDate'] || changes['isEditMode']) {
            this.updateMinEndDate();
        }
        
        if (changes['reservation']) {
            const currentReservation = changes['reservation'].currentValue;
            if (currentReservation) {
                if (currentReservation.house_availability_start_date) {
                    this.startDate = new Date(currentReservation.house_availability_start_date);
                }
                
                if (currentReservation.house_availability_end_date) {
                    this.endDate = new Date(currentReservation.house_availability_end_date);
                    this.endDate.setDate(this.endDate.getDate() + 1);
                }
            }
        }
        
        if (changes['visible']) {
            if (!changes['visible'].currentValue) {
                this.notes = '';
            } else if (changes['visible'].currentValue) {
                if (this.reservation && this.reservation.note) {
                    this.notes = this.reservation.note;
                } else {
                    this.notes = '';
                }
                
                this.ensureDatesAreValid();
            }
        }
        
        if (changes['startDate'] || changes['endDate']) {
            this.ensureDatesAreValid();
        }
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

        this.endDate;
    }

    onStartDateChange(): void {
        if (!this.startDate || !(this.startDate instanceof Date) || isNaN(this.startDate.getTime())) {
            if (this.isEditMode && this.reservation.house_availability_start_date) {
                this.startDate = new Date(this.reservation.house_availability_start_date);
            } else {
                this.startDate = new Date();
            }
            
            this.startDate.setHours(0, 0, 0, 0);
        } else {
            this.startDate.setHours(0, 0, 0, 0);
        }
        
        if (!this.endDate || !(this.endDate instanceof Date) || 
            isNaN(this.endDate.getTime()) || 
            new Date(this.endDate).getTime() < new Date(this.startDate).getTime()) {
            this.endDate = new Date(this.startDate);
            this.endDate.setHours(0, 0, 0, 0);
        }
        
        this.updateMinEndDate();
        this.checkForDateConflicts();
    }

    timeStringToDate(timeStr: any) {
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        const now = new Date();
        now.setHours(hours, minutes, seconds || 0, 0);
        return now;
    }

    dateToTimeString(date: Date): string {
        return date.toTimeString().split(' ')[0];
    }
    
    checkForDateConflicts(): void {
        if (!this.startDate || !this.endDate) {
            this.dateConflictError = null;
            return;
        }
        
        const startMs = new Date(this.startDate).setHours(0, 0, 0, 0);
        const endMs = new Date(this.endDate).setHours(0, 0, 0, 0);
        
        const conflictingReservation = this.existingReservations.find(reservation => {
            if (this.reservation.house_availability_id === reservation.house_availability_id) {
                return false;
            }
            
            if (reservation.house_id !== this.houseId) {
                return false;
            }
            
            const reservationStartMs = new Date(reservation.house_availability_start_date).setHours(0, 0, 0, 0);
            const reservationEndMs = new Date(reservation.house_availability_end_date).setHours(0, 0, 0, 0);
            
            return (startMs >= reservationStartMs && startMs <= reservationEndMs) || 
                   (endMs >= reservationStartMs && endMs <= reservationEndMs) ||
                   (startMs <= reservationStartMs && endMs >= reservationEndMs);
        });
        
        if (conflictingReservation) {
            this.dateConflictError = `This date range conflicts with a reservation for ${conflictingReservation.last_name || 'Unknown'}`;
        } else {
            this.dateConflictError = null;
        }
    }

    onSave(): void {
        this.checkForDateConflicts();
        if (this.dateConflictError) {
            return;
        }
        
        const formatDate = (date: Date): string => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const adjustedEndDate = new Date(this.endDate);
        adjustedEndDate.setDate(adjustedEndDate.getDate() - 1);

        const reservation: HouseAvailability = {
            ...this.reservation,
            house_id: this.houseId,
            house_availability_start_date: formatDate(this.startDate),
            house_availability_end_date: formatDate(adjustedEndDate),
            note: this.notes,
            color_theme: this.colors.findIndex(color => color == this.selectedColor),
            color_tint: this.reservation.color_tint || 0.5,
            arrival_time: this.reservation.arrival_time ? this.dateToTimeString(this.reservation.arrival_time) : '16:00:00',
            departure_time: this.reservation.departure_time ? this.dateToTimeString(this.reservation.departure_time): '10:00:00',
        } as HouseAvailability;
        this.save.emit(reservation);
        this.visibleChange.emit(false);
    }

    onCancel(): void {
        this.notes = '';
        this.cancel.emit();
        this.visibleChange.emit(false);
    }
    
    onDelete(): void {
        if (this.isEditMode && this.reservation.house_availability_id) {
            this.confirmationService.confirm({
                message: this.translateService.instant('RESERVATIONS.MESSAGES.CONFIRM-DELETE'),
                header: this.translateService.instant('RESERVATIONS.MESSAGES.HEADER'),
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
                        availabilityId: this.reservation.house_availability_id!, 
                        houseId: this.houseId 
                    });
                    
                    this.visibleChange.emit(false);
                    this.messageService.add({ 
                        severity: 'info', 
                        summary: this.translateService.instant('RESERVATIONS.MESSAGES.UPDATED'), 
                        detail: this.translateService.instant('RESERVATIONS.MESSAGES.DELETED-SUCCESS') 
                    });
                },
                reject: () => {
                    this.messageService.add({ 
                        severity: 'warn', 
                        summary: this.translateService.instant('RESERVATIONS.MESSAGES.CANCELLED'), 
                        detail: this.translateService.instant('RESERVATIONS.MESSAGES.CANCELLED-DELETE') 
                    });
                }
            })
        }
    }
 
    isFormValid(){
        return !this.dateConflictError && this.reservation.last_name?.trim() && this.reservation.reservation_number?.trim();
    }
}