import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { HouseAvailability } from '../service/data.models';
import { DatePickerModule } from 'primeng/datepicker';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';

@Component({
    selector: 'app-reservation-form',
    templateUrl: './reservation-form.component.html',
    styleUrls: ['./reservation-form.component.scss'],
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
    
    // New computed property to determine if we're editing an existing reservation
    get isEditMode(): boolean {
        return !!(this.reservation && this.reservation.house_availability_id && this.reservation.house_availability_id < 1000000);
    }
    
    // We need to ensure the date property is always a Date object
    // This will make the calendar component happy in all situations
    private _minStartDate: Date | null = null;
    
    // Min date will be undefined when editing existing reservations
    get minStartDate(): Date {
        // In edit mode, don't restrict past dates
        if (this.isEditMode) {
            // Return a very old date if in edit mode (effectively no minimum)
            if (!this._minStartDate) {
                this._minStartDate = new Date(1900, 0, 1);
            }
            return this._minStartDate;
        }
        
        // For new reservations, use today as minimum
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
    @Output() save = new EventEmitter<HouseAvailability>();
    @Output() cancel = new EventEmitter<void>();
    @Output() delete = new EventEmitter<{ availabilityId: number; houseId: number }>();

    constructor(
        private confirmationService: ConfirmationService,
        private translateService: TranslateService,
        private messageService: MessageService,
    ) {

    }

    ngOnInit() {
        if(this.reservation){
            this.reservation.arrival_time = this.reservation.arrival_time ? this.timeStringToDate(this.reservation.arrival_time) : this.timeStringToDate("16:00:00");
            this.reservation.departure_time = this.reservation.departure_time ? this.timeStringToDate(this.reservation.departure_time) : this.timeStringToDate('10:00:00');
        }

        if(this.reservation && this.reservation.color_theme != undefined){
            this.selectedColor = this.colors[this.reservation.color_theme];
        }
        
        // Initialize notes from reservation description if it exists
        if (this.reservation && this.reservation.note) {
            this.notes = this.reservation.note;
        } else {
            // Make sure notes is empty for new reservations
            this.notes = '';
        }
        
        // Ensure dates are properly initialized
        this.updateMinEndDate();
        this.ensureDatesAreValid();
    }
    
    // Ensure dates are properly set and valid
    private ensureDatesAreValid() {
        // Handle the case where startDate is a string (from reservation object)
        if (typeof this.startDate === 'string') {
            this.startDate = new Date(this.startDate);
        }
        
        // Handle the case where endDate is a string (from reservation object)
        if (typeof this.endDate === 'string') {
            this.endDate = new Date(this.endDate);
        }
        
        // If startDate is still not a valid Date, create a new one
        if (!(this.startDate instanceof Date) || isNaN(this.startDate.getTime())) {
            this.startDate = new Date(); // Default to today if invalid
        }
        
        // If endDate is still not a valid Date, default to startDate
        if (!(this.endDate instanceof Date) || isNaN(this.endDate.getTime())) {
            this.endDate = new Date(this.startDate); // Default to start date if invalid
        }
        
        // Reset hours to avoid timezone issues
        this.startDate.setHours(0, 0, 0, 0);
        this.endDate.setHours(0, 0, 0, 0);
    }

    // Reset form when visibility changes (prevents data persistence between openings)
    ngOnChanges(changes: SimpleChanges) {
        // Log all changes for debugging
        if (changes['startDate'] || changes['isEditMode']) {
            this.updateMinEndDate();
        }
        
        // Check if the reservation object changed (which contains date strings)
        if (changes['reservation']) {
            // If the reservation has start/end dates as strings, update our Date objects
            const currentReservation = changes['reservation'].currentValue;
            if (currentReservation) {
                if (currentReservation.house_availability_start_date) {
                    this.startDate = new Date(currentReservation.house_availability_start_date);
                }
                
                if (currentReservation.house_availability_end_date) {
                    // Add one day to end date for display purposes
                    this.endDate = new Date(currentReservation.house_availability_end_date);
                    this.endDate.setDate(this.endDate.getDate() + 1);
                }
            }
        }
        
        if (changes['visible']) {
            if (!changes['visible'].currentValue) {
                // Form is being closed, reset notes
                this.notes = '';
            } else if (changes['visible'].currentValue) {
                // Check for description
                if (this.reservation && this.reservation.note) {
                    this.notes = this.reservation.note;
                } else {
                    this.notes = '';
                }
                
                // Ensure dates are properly initialized when form becomes visible
                this.ensureDatesAreValid();
            }
        }
        
        // Check if dates have changed
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
        // Ensure the start date is valid
        if (!this.startDate || !(this.startDate instanceof Date) || isNaN(this.startDate.getTime())) {
            // If in edit mode and we have an original date, use that
            if (this.isEditMode && this.reservation.house_availability_start_date) {
                this.startDate = new Date(this.reservation.house_availability_start_date);
            } else {
                // Otherwise use today
                this.startDate = new Date();
            }
            
            this.startDate.setHours(0, 0, 0, 0);
        } else {
            // Reset hours to midnight to avoid timezone issues
            this.startDate.setHours(0, 0, 0, 0);
        }
        
        // If end date is before start date, update it to start date
        if (!this.endDate || !(this.endDate instanceof Date) || 
            isNaN(this.endDate.getTime()) || 
            new Date(this.endDate).getTime() < new Date(this.startDate).getTime()) {
            // Set end date to same day as start date initially
            this.endDate = new Date(this.startDate);
            this.endDate.setHours(0, 0, 0, 0);
        }
        
        // Check for conflicts after date changes
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
        return date.toTimeString().split(' ')[0]; // "HH:mm:ss"
    }
    
    // Add this method to check if the selected dates conflict with existing reservations
    checkForDateConflicts(): void {
        if (!this.startDate || !this.endDate) {
            this.dateConflictError = null;
            return;
        }
        
        const startMs = new Date(this.startDate).setHours(0, 0, 0, 0);
        const endMs = new Date(this.endDate).setHours(0, 0, 0, 0);
        
        // Look for any existing reservation that overlaps with our date range
        const conflictingReservation = this.existingReservations.find(reservation => {
            // Skip comparing with the current reservation being edited
            if (this.reservation.house_availability_id === reservation.house_availability_id) {
                return false;
            }
            
            // Only check reservations for the current house
            if (reservation.house_id !== this.houseId) {
                return false;
            }
            
            const reservationStartMs = new Date(reservation.house_availability_start_date).setHours(0, 0, 0, 0);
            const reservationEndMs = new Date(reservation.house_availability_end_date).setHours(0, 0, 0, 0);
            
            // Check for overlap
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
        // Check for conflicts before saving
        this.checkForDateConflicts();
        if (this.dateConflictError) {
            return; // Don't save if there's a conflict
        }
        
        // Format date as YYYY-MM-DD to avoid timezone issues
        const formatDate = (date: Date): string => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // Create a copy of the end date and subtract one day before saving
        const adjustedEndDate = new Date(this.endDate);
        adjustedEndDate.setDate(adjustedEndDate.getDate() - 1);

        const reservation: HouseAvailability = {
            ...this.reservation,
            house_id: this.houseId,
            house_availability_start_date: formatDate(this.startDate),
            house_availability_end_date: formatDate(adjustedEndDate), // Use adjusted end date here
            note: this.notes, // Add notes to the reservation
            color_theme: this.colors.findIndex(color => color == this.selectedColor),
            color_tint: this.reservation.color_tint || 0.5,
            arrival_time: this.reservation.arrival_time ? this.dateToTimeString(this.reservation.arrival_time) : '16:00:00',
            departure_time: this.reservation.departure_time ? this.dateToTimeString(this.reservation.departure_time): '10:00:00',
        } as HouseAvailability;
        this.save.emit(reservation);
        this.visibleChange.emit(false);
    }

    onCancel(): void {
        // Reset notes field immediately when canceling
        this.notes = '';
        this.cancel.emit();
        this.visibleChange.emit(false);
    }
    
    onDelete(): void {
        if (this.isEditMode && this.reservation.house_availability_id) {
            // Confirm deletion
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
}