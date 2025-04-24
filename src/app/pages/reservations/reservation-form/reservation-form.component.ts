import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { InputTextarea } from 'primeng/inputtextarea';
import { HouseAvailability } from '../../service/data.service';

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
        CalendarModule,
        InputTextarea
    ]
})
export class ReservationFormComponent implements OnInit, OnChanges {
    @Input() visible = false;
    @Input() reservation: Partial<HouseAvailability> = {};
    @Input() houseId!: number;
    @Input() startDate!: Date;
    @Input() endDate!: Date;
    @Input() existingReservations: HouseAvailability[] = [];
    
    notes: string = '';
    
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
    @Output() delete = new EventEmitter<number>();

    ngOnInit() {
        console.log("Form initialized with dates:", this.startDate, this.endDate);
        
        // Initialize notes from reservation description if it exists
        if (this.reservation && this.reservation.description) {
            this.notes = this.reservation.description;
        } else {
            // Make sure notes is empty for new reservations
            this.notes = '';
        }
        
        // Ensure dates are properly initialized
        this.ensureDatesAreValid();
    }
    
    // Ensure dates are properly set and valid
    private ensureDatesAreValid() {
        console.log("Ensuring dates are valid. Current values:", 
            this.startDate, 
            typeof this.startDate, 
            this.endDate, 
            typeof this.endDate);
        
        // Handle the case where startDate is a string (from reservation object)
        if (typeof this.startDate === 'string') {
            console.log("Converting startDate from string to Date");
            this.startDate = new Date(this.startDate);
        }
        
        // Handle the case where endDate is a string (from reservation object)
        if (typeof this.endDate === 'string') {
            console.log("Converting endDate from string to Date");
            this.endDate = new Date(this.endDate);
        }
        
        // If startDate is still not a valid Date, create a new one
        if (!(this.startDate instanceof Date) || isNaN(this.startDate.getTime())) {
            console.log("Fixing invalid start date");
            this.startDate = new Date(); // Default to today if invalid
        }
        
        // If endDate is still not a valid Date, default to startDate
        if (!(this.endDate instanceof Date) || isNaN(this.endDate.getTime())) {
            console.log("Fixing invalid end date");
            this.endDate = new Date(this.startDate); // Default to start date if invalid
        }
        
        // Reset hours to avoid timezone issues
        this.startDate.setHours(0, 0, 0, 0);
        this.endDate.setHours(0, 0, 0, 0);
        
        console.log("Dates after validation:", this.startDate, this.endDate);
    }

    // Reset form when visibility changes (prevents data persistence between openings)
    ngOnChanges(changes: SimpleChanges) {
        // Log all changes for debugging
        console.log("Form changes:", Object.keys(changes).join(', '));
        
        // Check if the reservation object changed (which contains date strings)
        if (changes['reservation']) {
            console.log("Reservation changed:", 
                changes['reservation'].currentValue, 
                changes['reservation'].previousValue);
            
            // If the reservation has start/end dates as strings, update our Date objects
            const currentReservation = changes['reservation'].currentValue;
            if (currentReservation) {
                if (currentReservation.house_availability_start_date) {
                    this.startDate = new Date(currentReservation.house_availability_start_date);
                    console.log("Updated startDate from reservation:", this.startDate);
                }
                
                if (currentReservation.house_availability_end_date) {
                    this.endDate = new Date(currentReservation.house_availability_end_date);
                    console.log("Updated endDate from reservation:", this.endDate);
                }
            }
        }
        
        if (changes['visible']) {
            if (!changes['visible'].currentValue) {
                // Form is being closed, reset notes
                this.notes = '';
            } else if (changes['visible'].currentValue) {
                // Form is being opened
                console.log("Form visibility changed to visible, dates:", this.startDate, this.endDate);
                
                // Check for description
                if (this.reservation && this.reservation.description) {
                    this.notes = this.reservation.description;
                } else {
                    this.notes = '';
                }
                
                // Ensure dates are properly initialized when form becomes visible
                this.ensureDatesAreValid();
            }
        }
        
        // Check if dates have changed
        if (changes['startDate'] || changes['endDate']) {
            console.log("Dates changed:", 
                changes['startDate']?.currentValue, 
                changes['startDate']?.previousValue,
                changes['endDate']?.currentValue, 
                changes['endDate']?.previousValue);
                
            this.ensureDatesAreValid();
        }
    }

    // Return the minimum allowed end date
    getMinEndDate(): Date {
        // If we're in edit mode, the minimum end date should be the start date
        if (this.isEditMode) {
            return new Date(this.startDate);
        }
        
        // For new reservations, it's either the start date or today, whichever is later
        if (!this.startDate) {
            return this.minStartDate;
        }
        
        const startDate = new Date(this.startDate);
        startDate.setHours(0, 0, 0, 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return startDate.getTime() >= today.getTime() ? startDate : today;
    }

    onStartDateChange(): void {
        console.log("Start date changed to:", this.startDate);
        
        // Ensure the start date is valid
        if (!this.startDate || !(this.startDate instanceof Date) || isNaN(this.startDate.getTime())) {
            console.log("Invalid start date, setting to today or original date");
            
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
            
            console.log("End date missing or before start date, updating it");
            // Set end date to same day as start date initially
            this.endDate = new Date(this.startDate);
            this.endDate.setHours(0, 0, 0, 0);
        }
        
        // Check for conflicts after date changes
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

        const reservation: HouseAvailability = {
            ...this.reservation,
            house_id: this.houseId,
            house_availability_start_date: formatDate(this.startDate),
            house_availability_end_date: formatDate(this.endDate),
            description: this.notes // Add notes to the reservation
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
            if (confirm('Are you sure you want to delete this reservation?')) {
                this.delete.emit(this.reservation.house_availability_id);
                this.visibleChange.emit(false);
            }
        }
    }
} 