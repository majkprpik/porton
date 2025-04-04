import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DataService, House, HouseAvailability } from '../service/data.service';
import { Subscription } from 'rxjs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
    selector: 'app-reservations',
    templateUrl: './reservations.html',
    styleUrls: ['./reservations.scss'],
    standalone: true,
    imports: [CommonModule, ScrollingModule, ButtonModule, TooltipModule, ProgressSpinnerModule],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Reservations implements OnInit, OnDestroy {
    // Convert to signals for reactive state management
    houses = signal<House[]>([]);
    houseAvailabilities = signal<HouseAvailability[]>([]);
    days = signal<Date[]>(this.generateDays());
    
    // Store subscriptions to unsubscribe later
    private subscriptions: Subscription[] = [];

    constructor(private dataService: DataService) {}

    ngOnInit(): void {
        // Load houses data if not already loaded
        this.dataService.loadHouses().subscribe();
        
        // Load house availabilities data if not already loaded
        this.dataService.loadHouseAvailabilities().subscribe();
        
        // Subscribe to houses data from DataService
        const housesSubscription = this.dataService.houses$.subscribe(houses => {
            this.houses.set(houses);
            //console.log('Houses:', houses); // Debug log
        });
        
        // Subscribe to house availabilities data from DataService
        const availabilitiesSubscription = this.dataService.houseAvailabilities$.subscribe(availabilities => {
            this.houseAvailabilities.set(availabilities);
            //console.log('Availabilities:', availabilities); // Debug log
        });
        
        // Store subscriptions for cleanup
        this.subscriptions.push(housesSubscription, availabilitiesSubscription);
    }
    
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions to prevent memory leaks
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    // Check if a house is reserved on a specific day
    isReserved(houseId: number, day: Date): boolean {
        // Check if the day falls within any reservation period for this house
        return this.houseAvailabilities().some(availability => {
            if (availability.house_id !== houseId) return false;
            
            const startDate = new Date(availability.house_availability_start_date);
            const endDate = new Date(availability.house_availability_end_date);
            
            // Set time to midnight for accurate date comparison
            const checkDate = new Date(day);
            checkDate.setHours(0, 0, 0, 0);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);
            
            return checkDate >= startDate && checkDate <= endDate;
        });
    }
    
    // Get the color for a reservation slot
    getReservationColor(houseId: number, day: Date): string {
        if (!this.isReserved(houseId, day)) return 'transparent';
        
        const reservation = this.getReservationForDay(houseId, day);
        if (!reservation) return 'transparent';

        // Use predefined colors based on color_theme
        const colors = [
            '#FFB3BA', // Light pink
            '#BAFFC9', // Light green
            '#BAE1FF', // Light blue
            '#FFFFBA', // Light yellow
            '#FFE4BA', // Light orange
            '#E8BAFF', // Light purple
            '#BAF2FF', // Light cyan
            '#FFC9BA', // Light coral
            '#D4FFBA', // Light lime
            '#FFBAEC'  // Light magenta
        ];

        // Use color_theme as index into colors array
        const baseColor = colors[reservation.color_theme % colors.length];

        // Adjust opacity based on color_tint (0.7 to 1.0)
        const opacity = 0.7 + (reservation.color_tint * 0.3);

        // Convert hex to rgba
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(baseColor);
        if (result) {
            const r = parseInt(result[1], 16);
            const g = parseInt(result[2], 16);
            const b = parseInt(result[3], 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }

        return baseColor;
    }
    
    // Get reservation info for tooltip
    getReservationInfo(houseId: number, day: Date): string {
        if (!this.isReserved(houseId, day)) return '';
        
        // Find the reservation for this house and day
        const reservation = this.houseAvailabilities().find(availability => {
            if (availability.house_id !== houseId) return false;
            
            const startDate = new Date(availability.house_availability_start_date);
            const endDate = new Date(availability.house_availability_end_date);
            
            // Set time to midnight for accurate date comparison
            const checkDate = new Date(day);
            checkDate.setHours(0, 0, 0, 0);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);
            
            return checkDate >= startDate && checkDate <= endDate;
        });
        
        if (!reservation) return '';
        
        // Format dates for display
        const startDate = new Date(reservation.house_availability_start_date);
        const endDate = new Date(reservation.house_availability_end_date);
        
        // Create tooltip text
        let tooltip = `Reservation: ${reservation.last_name || 'Unknown'}`;
        tooltip += `\nFrom: ${startDate.toLocaleDateString()}`;
        tooltip += `\nTo: ${endDate.toLocaleDateString()}`;
        
        if (reservation.reservation_number) {
            tooltip += `\nRef: ${reservation.reservation_number}`;
        }
        
        if (reservation.adults > 0) {
            tooltip += `\nAdults: ${reservation.adults}`;
        }
        
        if (reservation.babies > 0) {
            tooltip += `\nBabies: ${reservation.babies}`;
        }
        
        return tooltip;
    }

    // Get reservation display text for a cell
    getReservationDisplay(houseId: number, day: Date): string {
        if (!this.isReserved(houseId, day)) return '';
        
        const reservation = this.getReservationForDay(houseId, day);
        if (!reservation) return '';

        // Check if this is the first day of the reservation
        const startDate = new Date(reservation.house_availability_start_date);
        startDate.setHours(0, 0, 0, 0);
        const checkDate = new Date(day);
        checkDate.setHours(0, 0, 0, 0);

        // If it's a single day reservation, show both last name and number in the same cell
        if (reservation.house_availability_start_date === reservation.house_availability_end_date) {
            return `${reservation.last_name}\n${reservation.reservation_number}`;
        }

        // For multi-day reservations:
        // If it's the first day, show only the last name
        if (startDate.getTime() === checkDate.getTime()) {
            return reservation.last_name || '';
        }

        // If it's the second day, show only the reservation number
        const secondDay = new Date(startDate);
        secondDay.setDate(secondDay.getDate() + 1);
        secondDay.setHours(0, 0, 0, 0);
        if (checkDate.getTime() === secondDay.getTime()) {
            return reservation.reservation_number || '';
        }

        // For all other days, show nothing
        return '';
    }

    // Get a unique identifier for the reservation to use for hover effects
    getReservationIdentifier(houseId: number, day: Date): string {
        const reservation = this.getReservationForDay(houseId, day);
        if (!reservation) return '';
        return `res-${houseId}-${new Date(reservation.house_availability_start_date).getTime()}`;
    }

    // Helper method to get reservation for a specific day
    private getReservationForDay(houseId: number, day: Date): HouseAvailability | null {
        return this.houseAvailabilities().find(availability => {
            if (availability.house_id !== houseId) return false;
            
            const startDate = new Date(availability.house_availability_start_date);
            const endDate = new Date(availability.house_availability_end_date);
            
            // Set time to midnight for accurate date comparison
            const checkDate = new Date(day);
            checkDate.setHours(0, 0, 0, 0);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);
            
            return checkDate >= startDate && checkDate <= endDate;
        }) || null;
    }

    private generateDays(): Date[] {
        const days: Date[] = [];
        const startDate = new Date(2025, 3, 1); // April 1st 2025 (month is 0-based)
        const endDate = new Date(2025, 9, 30); // November 31st 2025

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            days.push(new Date(d));
        }

        return days;
    }

    isToday(date: Date): boolean {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    }

    isSaturday(date: Date): boolean {
        return date.getDay() === 6; // 6 is Saturday
    }

    isSunday(date: Date): boolean {
        return date.getDay() === 0; // 0 is Sunday
    }

    // onReservationHover(event: MouseEvent, houseId: number, day: Date) {
    //     const resId = this.getReservationIdentifier(houseId, day);
    //     if (!resId) return;

    //     const cells = document.querySelectorAll(`td[class="${resId}"]`);
    // }
} 