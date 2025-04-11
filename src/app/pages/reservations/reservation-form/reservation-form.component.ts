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
    
    minStartDate: Date = new Date(); // Today as minimum start date
    maxDate: Date = new Date(new Date().setFullYear(new Date().getFullYear() + 2)); // 2 years from now
    dateConflictError: string | null = null;
    
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() save = new EventEmitter<HouseAvailability>();
    @Output() cancel = new EventEmitter<void>();

    ngOnInit() {
        // Initialize notes from reservation description if it exists
        if (this.reservation && this.reservation.description) {
            this.notes = this.reservation.description;
        } else {
            // Make sure notes is empty for new reservations
            this.notes = '';
        }
    }

    // Reset form when visibility changes (prevents data persistence between openings)
    ngOnChanges(changes: SimpleChanges) {
        if (changes['visible']) {
            if (!changes['visible'].currentValue) {
                // Form is being closed, reset notes
                this.notes = '';
            } else if (changes['visible'].currentValue) {
                // Form is being opened, check for description
                if (this.reservation && this.reservation.description) {
                    this.notes = this.reservation.description;
                } else {
                    this.notes = '';
                }
            }
        }
    }

    // Return the minimum allowed end date (either startDate or today, whichever is later)
    getMinEndDate(): Date {
        if (!this.startDate) {
            return this.minStartDate;
        }
        
        const startDate = new Date(this.startDate);
        const today = new Date();
        
        return startDate > today ? startDate : today;
    }

    onStartDateChange(): void {
        // If end date is before start date, update it to start date
        if (this.endDate && this.startDate && new Date(this.endDate) < new Date(this.startDate)) {
            // Set end date to one day after start date
            const newEndDate = new Date(this.startDate);
            newEndDate.setDate(newEndDate.getDate() + 1);
            this.endDate = newEndDate;
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
} 