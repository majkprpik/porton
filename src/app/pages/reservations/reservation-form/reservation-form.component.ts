import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
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
        CalendarModule
    ]
})
export class ReservationFormComponent {
    @Input() visible = false;
    @Input() reservation: Partial<HouseAvailability> = {};
    @Input() houseId!: number;
    @Input() startDate!: Date;
    @Input() endDate!: Date;
    
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() save = new EventEmitter<HouseAvailability>();
    @Output() cancel = new EventEmitter<void>();

    onSave(): void {
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
            house_availability_end_date: formatDate(this.endDate)
        } as HouseAvailability;
        this.save.emit(reservation);
        this.visibleChange.emit(false);
    }

    onCancel(): void {
        this.cancel.emit();
        this.visibleChange.emit(false);
    }
} 