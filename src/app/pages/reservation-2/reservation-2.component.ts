import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, House, HouseAvailability } from '../service/data.service';
import { Subscription } from 'rxjs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { HotTableModule } from '@handsontable/angular';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable modules
registerAllModules();

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
    selector: 'app-reservation-2',
    templateUrl: './reservation-2.component.html',
    styleUrls: ['./reservation-2.component.scss'],
    standalone: true,
    imports: [CommonModule, ProgressSpinnerModule, HotTableModule],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Reservation2Component implements OnInit, OnDestroy {
    // Convert to signals for reactive state management
    houses = signal<House[]>([]);
    houseAvailabilities = signal<HouseAvailability[]>([]);
    days = signal<Date[]>(this.generateDays());
    
    // Handsontable settings
    hotSettings = computed(() => {
        const houses = this.houses();
        const days = this.days();
        
        return {
            data: this.generateTableData(),
            colHeaders: ['House'].concat(days.map(day => this.formatDate(day))),
            rowHeaders: true,
            width: '100%',
            height: 'auto',
            licenseKey: 'non-commercial-and-evaluation',
            columns: [
                { 
                    data: 'house',
                    readOnly: true,
                    renderer: this.cellRenderer.bind(this)
                },
                ...days.map((_, index) => ({
                    data: `day${index}`,
                    readOnly: true,
                    renderer: this.cellRenderer.bind(this)
                }))
            ],
            afterChange: () => {
                // Force update when data changes
                this.hotSettings();
            }
        };
    });

    // Cache for cell data
    private cellDataCache = new Map<string, CellData>();

    // Memoize the core reservation lookup
    private memoizedGetReservationForDay = memoize(this._getReservationForDay.bind(this));

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

    // Helper method to get reservation for a specific day (actual lookup logic)
    private _getReservationForDay(houseId: number, day: Date): HouseAvailability | null {
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

    // Generate array of dates for the current view
    private generateDays(): Date[] {
        const days: Date[] = [];
        const startDate = new Date(2024, 2, 31); // March 31st, 2024 (month is 0-based)
        const endDate = new Date(2024, 10, 1);   // November 1st, 2024 (month is 0-based)
        
        // Set hours to 0 to avoid timezone issues
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        // Generate all dates between start and end date
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            days.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return days;
    }

    // Helper methods for date checks
    isToday(date: Date): boolean {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    isSaturday(date: Date): boolean {
        return date.getDay() === 6;
    }

    isSunday(date: Date): boolean {
        return date.getDay() === 0;
    }

    // Generate table data for Handsontable
    private generateTableData(): any[] {
        const houses = this.houses();
        const days = this.days();
        
        return houses.map(house => {
            const rowData: any = {
                house: house.house_name || `House ${house.house_number}`
            };
            
            days.forEach((day, index) => {
                const cellData = this.getCellData(house.house_id, day);
                rowData[`day${index}`] = cellData.displayText || '';
            });
            
            return rowData;
        });
    }

    // Custom cell renderer for Handsontable
    private cellRenderer(instance: any, td: HTMLTableCellElement, row: number, column: number, prop: string | number, value: any, cellProperties: any): void {
        const houses = this.houses();
        const days = this.days();
        
        if (column === 0) {
            // First column (house names)
            td.style.backgroundColor = '#f8f9fa';
            td.style.fontWeight = '600';
            td.innerHTML = value;
            return;
        }
        
        // Get the actual cell data
        const house = houses[row];
        const day = days[column - 1]; // -1 because first column is house name
        const cellData = this.getCellData(house.house_id, day);
        
        if (cellData.isReserved) {
            td.style.backgroundColor = cellData.color;
            td.style.color = '#000';
            td.style.textAlign = 'center';
            td.style.padding = '4px';
            td.style.whiteSpace = 'pre-line';
            td.title = cellData.tooltip;
            td.innerHTML = cellData.displayText;
        } else {
            td.style.backgroundColor = 'transparent';
            td.innerHTML = '';
        }
    }

    // Format date for column headers
    private formatDate(date: Date): string {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }


    dataset: any[] = [
      {id: 1, name: 'Ted Right', address: 'Wall Street'},
      {id: 2, name: 'Frank Honest', address: 'Pennsylvania Avenue'},
      {id: 3, name: 'Joan Well', address: 'Broadway'},
      {id: 4, name: 'Gail Polite', address: 'Bourbon Street'},
      {id: 5, name: 'Michael Fair', address: 'Lombard Street'},
      {id: 6, name: 'Mia Fair', address: 'Rodeo Drive'},
      {id: 7, name: 'Cora Fair', address: 'Sunset Boulevard'},
      {id: 8, name: 'Jack Right', address: 'Michigan Avenue'},
    ];
}
