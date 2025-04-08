import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DataService, House, HouseAvailability } from '../service/data.service';
import { Subscription } from 'rxjs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { FormsModule } from '@angular/forms';

// Cache helper function - Improved key generation for Dates
function memoize<T extends (...args: any[]) => any>(fn: T): T {
    const cache = new Map<string, ReturnType<T>>();
    return ((...args: Parameters<T>) => {
        const key = JSON.stringify(args, (k, v) => (v instanceof Date ? v.getTime() : v));
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = fn(...args);
        cache.set(key, result);
        return result;
    }) as T;
}

interface CellData {
    isReserved: boolean;
    color: string;
    displayText: string;
    tooltip: string;
    identifier: string;
}

@Component({
    selector: 'app-reservations',
    templateUrl: './reservations.html',
    styleUrls: ['./reservations.scss'],
    standalone: true,
    imports: [
        CommonModule, 
        ScrollingModule, 
        ButtonModule, 
        TooltipModule, 
        ProgressSpinnerModule,
        DialogModule,
        InputTextModule,
        InputNumberModule,
        CalendarModule,
        FormsModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Reservations implements OnInit, OnDestroy {
    // Convert to signals for reactive state management
    houses = signal<House[]>([]);
    houseAvailabilities = signal<HouseAvailability[]>([]);
    days = signal<Date[]>(this.generateDays());
    
    // Cache for cell data
    private cellDataCache = new Map<string, CellData>();

    // Memoize the core reservation lookup
    private memoizedGetReservationForDay = memoize(this._getReservationForDay.bind(this));

    // New reservation dialog
    showNewReservationDialog = signal<boolean>(false);
    selectedHouseId = signal<number | null>(null);
    selectedStartDate = signal<Date | null>(null);
    
    // New reservation form data
    newReservation = signal<{
        name: string;
        pmsNumber: string;
        startDate: Date | null;
        endDate: Date | null;
        adults: number;
        children: number;
        babies: number;
        cribs: number;
    }>({
        name: '',
        pmsNumber: '',
        startDate: null,
        endDate: null,
        adults: 0,
        children: 0,
        babies: 0,
        cribs: 0
    });
    
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
            this.clearCache(); // Clear cache when houses change
        });
        
        // Subscribe to house availabilities data from DataService
        const availabilitiesSubscription = this.dataService.houseAvailabilities$.subscribe(availabilities => {
            this.houseAvailabilities.set(availabilities);
            this.clearCache(); // Clear cache when availabilities change
        });
        
        // Store subscriptions for cleanup
        this.subscriptions.push(housesSubscription, availabilitiesSubscription);
    }
    
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions to prevent memory leaks
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    // Clear cache when data changes
    private clearCache(): void {
        this.cellDataCache.clear();
        // We might need to clear the memoizedGetReservationForDay cache too if it depends on external state implicitly
        // For now, assume it only depends on its arguments (houseId, day) and the stable houseAvailabilities signal
    }

    // Get cell data with caching - OPTIMIZED
    private getCellData(houseId: number, day: Date): CellData {
        const key = `${houseId}-${day.getTime()}`;
        if (this.cellDataCache.has(key)) {
            return this.cellDataCache.get(key)!;
        }

        // 1. Find the reservation ONCE using the memoized function
        const reservation = this.memoizedGetReservationForDay(houseId, day);

        // 2. Calculate all cell data based on the single lookup result
        const isReserved = !!reservation;
        let color = 'transparent';
        let displayText = '';
        let tooltip = '';
        let identifier = '';

        if (isReserved && reservation) {
            // Calculate color
            const colors = ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFE4BA', '#E8BAFF', '#BAF2FF', '#FFC9BA', '#D4FFBA', '#FFBAEC'];
            const baseColor = colors[reservation.color_theme % colors.length];
            const opacity = 0.7 + (reservation.color_tint * 0.3);
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(baseColor);
            if (result) {
                const r = parseInt(result[1], 16);
                const g = parseInt(result[2], 16);
                const b = parseInt(result[3], 16);
                color = `rgba(${r}, ${g}, ${b}, ${opacity})`;
            } else {
                color = baseColor;
            }

            // Calculate display text
            const startDate = new Date(reservation.house_availability_start_date);
            startDate.setHours(0, 0, 0, 0);
            const checkDate = new Date(day);
            checkDate.setHours(0, 0, 0, 0);
            if (reservation.house_availability_start_date === reservation.house_availability_end_date) {
                displayText = `${reservation.last_name}\n${reservation.reservation_number}`;
            } else if (startDate.getTime() === checkDate.getTime()) {
                displayText = reservation.last_name || '';
            } else {
                const secondDay = new Date(startDate);
                secondDay.setDate(secondDay.getDate() + 1);
                secondDay.setHours(0, 0, 0, 0);
                if (checkDate.getTime() === secondDay.getTime()) {
                    displayText = reservation.reservation_number || '';
                }
            }

            // Calculate tooltip
            const resStartDate = new Date(reservation.house_availability_start_date);
            const resEndDate = new Date(reservation.house_availability_end_date);
            tooltip = `Reservation: ${reservation.last_name || 'Unknown'}`;
            tooltip += `\nFrom: ${resStartDate.toLocaleDateString()}`;
            tooltip += `\nTo: ${resEndDate.toLocaleDateString()}`;
            if (reservation.reservation_number) tooltip += `\nRef: ${reservation.reservation_number}`;
            if (reservation.adults > 0) tooltip += `\nAdults: ${reservation.adults}`;
            if (reservation.babies > 0) tooltip += `\nBabies: ${reservation.babies}`;

            // Calculate identifier
            identifier = `res-${houseId}-${new Date(reservation.house_availability_start_date).getTime()}`;
        }

        const cellData: CellData = {
            isReserved,
            color,
            displayText,
            tooltip,
            identifier
        };

        // 3. Store the combined data in the cache
        this.cellDataCache.set(key, cellData);
        return cellData;
    }

    // Public methods now just access the cached data directly
    isReserved(houseId: number, day: Date): boolean {
        return this.getCellData(houseId, day).isReserved;
    }

    getReservationColor(houseId: number, day: Date): string {
        return this.getCellData(houseId, day).color;
    }

    getReservationInfo(houseId: number, day: Date): string {
        return this.getCellData(houseId, day).tooltip;
    }

    getReservationDisplay(houseId: number, day: Date): string {
        return this.getCellData(houseId, day).displayText;
    }

    getReservationIdentifier(houseId: number, day: Date): string {
        return this.getCellData(houseId, day).identifier;
    }

    // --- Renamed Private Helper Method --- 
    // Helper method to get reservation for a specific day (actual lookup logic)
    private _getReservationForDay(houseId: number, day: Date): HouseAvailability | null {
        // console.log(`_getReservationForDay called for ${houseId} - ${day.toLocaleDateString()}`); // Debugging
        return this.houseAvailabilities().find(availability => {
            if (availability.house_id !== houseId) return false;
            
            const startDate = new Date(availability.house_availability_start_date);
            const endDate = new Date(availability.house_availability_end_date);
            
            const checkDate = new Date(day);
            checkDate.setHours(0, 0, 0, 0);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);
            
            return checkDate >= startDate && checkDate <= endDate;
        }) || null;
    }

    // --- Other Methods (unchanged) --- 

    private generateDays(): Date[] {
        const days: Date[] = [];
        const startDate = new Date(2025, 3, 1); // April 1st 2025 (month is 0-based)
        const endDate = new Date(2025, 9, 30); // October 30th 2025

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

    onSlotClick(houseId: number, day: Date): void {
        if (this.isReserved(houseId, day)) return; 
        
        this.selectedHouseId.set(houseId);
        this.selectedStartDate.set(day);
        this.newReservation.update(val => ({
            ...val,
            startDate: day,
            endDate: null
        }));
        this.showNewReservationDialog.set(true);
    }

    resetNewReservationForm(): void {
        this.newReservation.set({
            name: '',
            pmsNumber: '',
            startDate: null,
            endDate: null,
            adults: 0,
            children: 0,
            babies: 0,
            cribs: 0
        });
        this.selectedHouseId.set(null);
        this.selectedStartDate.set(null);
    }

    onSubmitNewReservation(): void {
        const reservation = this.newReservation();
        if (!reservation.startDate || !reservation.endDate || !this.selectedHouseId()) {
            return;
        }

        console.log('New reservation:', {
            houseId: this.selectedHouseId(),
            ...reservation
        });

        this.showNewReservationDialog.set(false);
        this.resetNewReservationForm();
    }

    updateNewReservationField(field: keyof Reservations['newReservation']['prototype'], value: any): void {
        this.newReservation.update(current => ({
            ...current,
            [field]: value
        }));
    }

    isValidDateRange(): boolean {
        const reservation = this.newReservation();
        if (!reservation.startDate || !reservation.endDate) return false;
        return reservation.endDate >= reservation.startDate;
    }
} 