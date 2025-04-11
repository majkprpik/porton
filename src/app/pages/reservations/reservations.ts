import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DataService, House, HouseAvailability } from '../service/data.service';
import { Subscription, Subject, takeUntil } from 'rxjs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { FormsModule } from '@angular/forms';
import { ReservationFormComponent } from './reservation-form/reservation-form.component';

interface CellData {
    isReserved: boolean;
    color: string;
    displayText: string;
    tooltip: string;
    identifier: string;
    isToday: boolean;
    isSaturday: boolean;
    isSunday: boolean;
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
        FormsModule,
        ReservationFormComponent
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Reservations implements OnInit, OnDestroy {
    houses = signal<House[]>([]);
    houseAvailabilities = signal<HouseAvailability[]>([]);
    days = signal<Date[]>(this.generateDays());
    
    // Signal for the entire grid matrix
    gridMatrix = signal<CellData[][]>([]);

    // Reservation form state
    showReservationForm = signal<boolean>(false);
    newReservation = signal<Partial<HouseAvailability>>({});
    selectedHouseId = signal<number>(0);
    selectedStartDate = signal<Date>(new Date());
    selectedEndDate = signal<Date>(new Date());

    // Store subscriptions to unsubscribe later
    private subscriptions: Subscription[] = [];

    // Optimized data structures
    private reservationMap = new Map<string, HouseAvailability>();
    private houseIndexMap = new Map<number, number>();
    private dayIndexMap = new Map<number, number>();

    // Add destroy subject for takeUntil pattern
    private destroy$ = new Subject<void>();

    // Performance monitoring
    private renderStartTime: number = 0;
    private updateStartTime: number = 0;
    private totalCells: number = 0;

    constructor(private dataService: DataService) {
        // Monitor grid matrix updates
        effect(() => {
            const grid = this.gridMatrix();
            if (grid.length > 0) {
                this.totalCells = grid.length * grid[0].length;
                console.log(`Grid updated: ${this.totalCells} total cells`);
                console.log(`Grid dimensions: ${grid.length} rows × ${grid[0].length} columns`);
            }
        });
    }

    ngOnInit(): void {
        this.renderStartTime = performance.now();
        
        // Load houses data if not already loaded
        this.dataService.loadHouses().pipe(takeUntil(this.destroy$)).subscribe();
        
        // Load house availabilities data if not already loaded
        this.dataService.loadHouseAvailabilities().pipe(takeUntil(this.destroy$)).subscribe();
        
        // Subscribe to houses data from DataService
        this.dataService.houses$
            .pipe(takeUntil(this.destroy$))
            .subscribe(houses => {
                this.houses.set(houses);
                this.updateGridMatrix();
            });
        
        // Subscribe to house availabilities data from DataService
        this.dataService.houseAvailabilities$
            .pipe(takeUntil(this.destroy$))
            .subscribe(availabilities => {
                this.houseAvailabilities.set(availabilities);
                this.updateGridMatrix();
            });

        // Monitor initial render
        setTimeout(() => {
            const renderTime = performance.now() - this.renderStartTime;
            console.log(`Initial render time: ${renderTime.toFixed(2)}ms`);
            console.log(`Cells per second: ${(this.totalCells / (renderTime / 1000)).toFixed(2)}`);
        }, 0);
    }
    
    ngOnDestroy(): void {
        // Cleanup takeUntil subject
        this.destroy$.next();
        this.destroy$.complete();

        // Clear signals
        this.houses.set([]);
        this.houseAvailabilities.set([]);
        this.days.set([]);
        this.gridMatrix.set([]);

        // Clear maps
        this.reservationMap.clear();
        this.houseIndexMap.clear();
        this.dayIndexMap.clear();
    }

    // Update the grid matrix when data changes
    private updateGridMatrix(): void {
        this.updateStartTime = performance.now();
        
        const houses = this.houses();
        const days = this.days();
        const availabilities = this.houseAvailabilities();

        // Clear and rebuild maps
        this.reservationMap.clear();
        this.houseIndexMap.clear();
        this.dayIndexMap.clear();

        // Build house index map
        houses.forEach((house, index) => {
            this.houseIndexMap.set(house.house_id, index);
        });

        // Build day index map
        days.forEach((day, index) => {
            this.dayIndexMap.set(day.getTime(), index);
        });

        // Build reservation map
        availabilities.forEach(availability => {
            const startDate = new Date(availability.house_availability_start_date);
            const endDate = new Date(availability.house_availability_end_date);
            
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const key = this.getReservationKey(availability.house_id, d);
                this.reservationMap.set(key, availability);
            }
        });

        // Generate grid data
        const grid: CellData[][] = [];
        for (const house of houses) {
            const row: CellData[] = [];
            
            for (const day of days) {
                const key = this.getReservationKey(house.house_id, day);
                const reservation = this.reservationMap.get(key);
                
                row.push(this.createCellData(day, reservation));
            }
            
            grid.push(row);
        }

        this.gridMatrix.set(grid);

        // Log update performance
        setTimeout(() => {
            const updateTime = performance.now() - this.updateStartTime;
            console.log(`Grid update time: ${updateTime.toFixed(2)}ms`);
            console.log(`Update rate: ${(this.totalCells / (updateTime / 1000)).toFixed(2)} cells/second`);
        }, 0);
    }

    private getReservationKey(houseId: number, date: Date): string {
        return `${houseId}-${date.getTime()}`;
    }

    private createCellData(day: Date, reservation?: HouseAvailability): CellData {
        const cellData: CellData = {
            isReserved: false,
            color: 'transparent',
            displayText: '',
            tooltip: '',
            identifier: '',
            isToday: this.isToday(day),
            isSaturday: this.isSaturday(day),
            isSunday: this.isSunday(day)
        };

        if (reservation) {
            // Calculate color
            const colors = ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFE4BA', '#E8BAFF', '#BAF2FF', '#FFC9BA', '#D4FFBA', '#FFBAEC'];
            const baseColor = colors[reservation.color_theme % colors.length];
            const opacity = 0.7 + (reservation.color_tint * 0.3);
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(baseColor);
            
            if (result) {
                const r = parseInt(result[1], 16);
                const g = parseInt(result[2], 16);
                const b = parseInt(result[3], 16);
                cellData.color = `rgba(${r}, ${g}, ${b}, ${opacity})`;
            } else {
                cellData.color = baseColor;
            }

            // Calculate display text
            const startDate = new Date(reservation.house_availability_start_date);
            startDate.setHours(0, 0, 0, 0);
            const checkDate = new Date(day);
            checkDate.setHours(0, 0, 0, 0);
            
            if (reservation.house_availability_start_date === reservation.house_availability_end_date) {
                cellData.displayText = `${reservation.last_name}\n${reservation.reservation_number}`;
            } else if (startDate.getTime() === checkDate.getTime()) {
                cellData.displayText = reservation.last_name || '';
            } else {
                const secondDay = new Date(startDate);
                secondDay.setDate(secondDay.getDate() + 1);
                secondDay.setHours(0, 0, 0, 0);
                if (checkDate.getTime() === secondDay.getTime()) {
                    cellData.displayText = reservation.reservation_number || '';
                }
            }

            // Calculate tooltip
            const resStartDate = new Date(reservation.house_availability_start_date);
            const resEndDate = new Date(reservation.house_availability_end_date);
            cellData.tooltip = `Reservation: ${reservation.last_name || 'Unknown'}`;
            cellData.tooltip += `\nFrom: ${resStartDate.toLocaleDateString()}`;
            cellData.tooltip += `\nTo: ${resEndDate.toLocaleDateString()}`;
            if (reservation.reservation_number) cellData.tooltip += `\nRef: ${reservation.reservation_number}`;
            if (reservation.adults > 0) cellData.tooltip += `\nAdults: ${reservation.adults}`;
            if (reservation.babies > 0) cellData.tooltip += `\nBabies: ${reservation.babies}`;

            // Set identifier
            cellData.identifier = `res-${reservation.house_id}-${new Date(reservation.house_availability_start_date).getTime()}`;
            cellData.isReserved = true;
        }

        return cellData;
    }

    private generateDays(): Date[] {
        const days: Date[] = [];
        const startDate = new Date(2025, 2, 31); // March 31st 2025 (month is 0-based)
        const endDate = new Date(2025, 10, 15); // November 15th 2025

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

    // Move complex calculations to methods
    getCellClasses(cellData: CellData): { [key: string]: boolean } {
        return {
            'reservation-slot': cellData.isReserved,
            'today-column': cellData.isToday,
            'saturday-column': cellData.isSaturday,
            'sunday-column': cellData.isSunday
        };
    }

    getColumnClasses(day: Date): { [key: string]: boolean } {
        return {
            'today-column': this.isToday(day),
            'saturday-column': this.isSaturday(day),
            'sunday-column': this.isSunday(day)
        };
    }

    // CRUD Operations
    createReservation(reservation: HouseAvailability): void {
        // Add to houseAvailabilities
        const currentAvailabilities = this.houseAvailabilities();
        this.houseAvailabilities.set([...currentAvailabilities, reservation]);
        
        // Update grid matrix
        this.updateGridMatrix();
    }

    updateReservation(reservation: HouseAvailability): void {
        // Update in houseAvailabilities
        const currentAvailabilities = this.houseAvailabilities();
        const index = currentAvailabilities.findIndex(a => 
            a.house_availability_id === reservation.house_availability_id
        );
        
        if (index !== -1) {
            currentAvailabilities[index] = reservation;
            this.houseAvailabilities.set([...currentAvailabilities]);
            
            // Update grid matrix
            this.updateGridMatrix();
        }
    }

    deleteReservation(reservationId: number): void {
        // Remove from houseAvailabilities
        const currentAvailabilities = this.houseAvailabilities();
        this.houseAvailabilities.set(
            currentAvailabilities.filter(a => a.house_availability_id !== reservationId)
        );
        
        // Update grid matrix
        this.updateGridMatrix();
    }

    // Handle click on an empty cell
    onCellClick(houseIndex: number, dayIndex: number): void {
        const cellData = this.gridMatrix()[houseIndex][dayIndex];
        
        // Only open form if cell is not reserved
        if (!cellData.isReserved) {
            const house = this.houses()[houseIndex];
            const day = this.days()[dayIndex];
            
            // Set selected data for the form
            this.selectedHouseId.set(house.house_id);
            this.selectedStartDate.set(new Date(day));
            this.selectedEndDate.set(new Date(day));
            
            // Initialize new reservation with default values
            this.newReservation.set({
                house_id: house.house_id,
                house_availability_type_id: 1, // Default availability type
                color_theme: Math.floor(Math.random() * 10), // Random color theme
                color_tint: Math.random(), // Random tint
                adults: 0,
                babies: 0,
                cribs: 0,
                dogs_d: 0,
                dogs_s: 0,
                dogs_b: 0,
                has_arrived: false,
                has_departed: false,
                prev_connected: false,
                next_connected: false
            });
            
            // Force update and open the form
            setTimeout(() => {
                this.showReservationForm.set(true);
            }, 0);
        }
    }

    // Handle form submission
    handleSaveReservation(reservation: HouseAvailability): void {
        this.createReservation(reservation);
        this.closeReservationForm();
    }

    // Handle form cancellation
    handleCancelReservation(): void {
        this.closeReservationForm();
    }
    
    // Centralized method to close the form and reset state
    private closeReservationForm(): void {
        // First close the form
        this.showReservationForm.set(false);
        
        // Then reset form data after a short delay
        setTimeout(() => {
            this.newReservation.set({});
        }, 100);
    }
} 