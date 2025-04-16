import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, effect, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, House, HouseAvailability, HouseType } from '../service/data.service';
import { Subject, takeUntil } from 'rxjs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { HotTableModule, HotTableComponent } from '@handsontable/angular';
import { registerAllModules } from 'handsontable/registry';
import Handsontable from 'handsontable';
import { ReservationFormComponent } from '../reservations/reservation-form/reservation-form.component';

// Register all Handsontable modules
registerAllModules();

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
    selector: 'app-reservation-2',
    templateUrl: './reservation-2.component.html',
    styleUrls: ['./reservation-2.component.scss'],
    standalone: true,
    imports: [CommonModule, ProgressSpinnerModule, HotTableModule, ReservationFormComponent],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Reservation2Component implements OnInit, OnDestroy {
    // Convert to signals for reactive state management
    houses = signal<House[]>([]);
    houseAvailabilities = signal<HouseAvailability[]>([]);
    days = signal<Date[]>(this.generateDays());
    
    // Add signals for house type filtering
    houseTypes = signal<HouseType[]>([]);
    selectedHouseTypeId = signal<number | null>(null);
    filteredHouses = computed(() => this.filterHousesByType());
    
    // Signal for the entire grid matrix (from original component)
    gridMatrix = signal<CellData[][]>([]);
    
    // Optimized data structures from original component
    private reservationMap = new Map<string, HouseAvailability>();
    private houseIndexMap = new Map<number, number>();
    private dayIndexMap = new Map<number, number>();
    
    // Add destroy subject for takeUntil pattern
    private destroy$ = new Subject<void>();
    
    // Performance monitoring
    private renderStartTime: number = 0;
    private updateStartTime: number = 0;
    private totalCells: number = 0;
    
    // Add reference to the hot table component
    @ViewChild('hotTable') private hotTableComponent?: HotTableComponent;
    
    // Add observer for calendar
    private calendarObserver?: MutationObserver;
    
    // Track previous house type ID to detect changes
    private _previousHouseTypeId: number | null = null;
    
    // Handsontable settings
    hotSettings = computed(() => {
        // Use filteredHouses instead of houses directly
        const houses = this.filteredHouses();
        const days = this.days();
        
        return {
            data: this.generateTableData(),
            colHeaders: days.map(day => this.formatDate(day)),
            rowHeaders: houses.map(house => house.house_number?.toString() || ''),
            // width: '100%',
            // height: '100%',
            licenseKey: 'non-commercial-and-evaluation',
            // className: 'htCenter',
            // Enable proper scrolling - fix type by using string literal 
            // stretchH: 'none' as 'none', // This explicit type casting fixes the issue
            // colWidths: 100,
            // fixedColumnsStart: 0,
            // Fix headers in place while scrolling
            // fixedRowsTop: 0,
            // Force all rows to be exactly 30px high
            // rowHeights: 30,
            // Set manual column widths - all day columns at 80px
            // manualColumnWidths: Array(days.length).fill(80),
            // Set manual row heights for all rows - adjust count based on filtered houses
            // manualRowHeights: Array(houses.length).fill(30),
            // Ensure consistent row and column sizes
            // autoRowSize: false,
            // autoColumnSize: false,
            // Ensure headers are properly sized
            // renderAllRows: true,
            // renderAllColumns: true,
            // Replace simple boolean with custom context menu
            contextMenu: {
                items: {
                    editReservation: {
                        name: '<i class="pi pi-pencil"></i> Edit Reservation',
                        callback: (key: string, selection: any[]) => {
                            const [row, col] = [selection[0].start.row, selection[0].start.col];
                            this.handleEditReservation(row, col);
                        },
                        disabled: () => {
                            // Access hot instance via any type to bypass type checking
                            const hot = this.hotTableComponent ? (this.hotTableComponent as any).hotInstance : null;
                            const sel = hot?.getSelected();
                            if (sel && sel.length > 0) {
                                const [row, col] = [sel[0][0], sel[0][1]];
                                return !this.hasCellReservation(row, col);
                            }
                            return true;
                        }
                    },
                    deleteReservation: {
                        name: '<i class="pi pi-trash"></i> Delete Reservation',
                        callback: (key: string, selection: any[]) => {
                            const [row, col] = [selection[0].start.row, selection[0].start.col];
                            this.handleDeleteReservation(row, col);
                        },
                        disabled: () => {
                            // Access hot instance via any type to bypass type checking
                            const hot = this.hotTableComponent ? (this.hotTableComponent as any).hotInstance : null;
                            const sel = hot?.getSelected();
                            if (sel && sel.length > 0) {
                                const [row, col] = [sel[0][0], sel[0][1]];
                                return !this.hasCellReservation(row, col);
                            }
                            return true;
                        }
                    },
                    sep1: { name: '---------' },
                    addReservation: {
                        name: '<i class="pi pi-plus"></i> Add New Reservation',
                        callback: (key: string, selection: any[]) => {
                            const [row, col] = [selection[0].start.row, selection[0].start.col];
                            this.handleAddReservation(row, col);
                        },
                        disabled: () => {
                            // Access hot instance via any type to bypass type checking
                            const hot = this.hotTableComponent ? (this.hotTableComponent as any).hotInstance : null;
                            const sel = hot?.getSelected();
                            if (sel && sel.length > 0) {
                                const [row, col] = [sel[0][0], sel[0][1]];
                                return this.hasCellReservation(row, col);
                            }
                            return false;
                        }
                    },
                }
            },
            // Make sure all cells maintain their dimensions
            // afterInit: () => {
            // },
            // Simpler afterColumnResize that makes sure we don't go below 80px
            // afterColumnResize: (column: number, width: number) => {
            //     if (width < 80) {
            //         setTimeout(() => this.enforceMinColumnWidth(column, 80), 0);
            //     }
            // },
            columns: days.map((day, index) => ({
                data: `day${index}`,
                // readOnly: true,
                renderer: (instance: any, td: HTMLTableCellElement, row: number, col: number, prop: string | number, value: any, cellProperties: any) => {
                    this.cellRenderer(instance, td, row, col, prop, value, cellProperties);
                }
            })),
            // afterChange: () => {
            //     // Force update when data changes
            //     this.hotSettings();
            // },
            cells: (row: number, col: number) => {
                // Handle special day columns
                const day = this.days()[col];
                let className = '';
                
                if (this.isToday(day)) className += ' today-column';
                if (this.isSaturday(day)) className += ' saturday-column';
                if (this.isSunday(day)) className += ' sunday-column';
                
                return { className };
            }
        };
    });

    // Add signals for reservation form
    showReservationForm = signal<boolean>(false);
    selectedHouseId = signal<number>(0);
    selectedStartDate = signal<Date>(new Date());
    selectedEndDate = signal<Date>(new Date());
    editingReservation = signal<Partial<HouseAvailability>>({});
    
    // Add a signal for the next reservation date (if any) to pass to the form
    nextReservationDate = signal<Date | null>(null);

    constructor(private dataService: DataService) {
        // Monitor grid matrix updates
        effect(() => {
            const grid = this.gridMatrix();
            if (grid.length > 0) {
                this.totalCells = grid.length * grid[0].length;
            }
        });
    }

    ngOnInit(): void {
        this.renderStartTime = performance.now();
        
        // Load houses data if not already loaded
        this.dataService.loadHouses().pipe(takeUntil(this.destroy$)).subscribe();
        
        // Load house availabilities data if not already loaded
        this.dataService.loadHouseAvailabilities().pipe(takeUntil(this.destroy$)).subscribe();
        
        // Load house types data
        this.dataService.getHouseTypes().pipe(takeUntil(this.destroy$)).subscribe(types => {
            this.houseTypes.set(types);
        });
        
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
        
        // Disconnect the calendar observer if it exists
        if (this.calendarObserver) {
            this.calendarObserver.disconnect();
        }
    }
    
    // Update the grid matrix when data changes - from original component
    private updateGridMatrix(): void {
        this.updateStartTime = performance.now();
        
        // Use filteredHouses instead of houses directly
        const houses = this.filteredHouses();
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

        // Verify the grid dimensions match filtered houses
        const selectedTypeId = this.selectedHouseTypeId();

        // Count reserved cells to verify data
        let reservedCellCount = 0;
        grid.forEach(row => {
            row.forEach(cell => {
                if (cell.isReserved) reservedCellCount++;
            });
        });

        // Log update performance
        setTimeout(() => {
            const updateTime = performance.now() - this.updateStartTime;
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

            // Calculate display text - ensure single line
            const startDate = new Date(reservation.house_availability_start_date);
            startDate.setHours(0, 0, 0, 0);
            const checkDate = new Date(day);
            checkDate.setHours(0, 0, 0, 0);
            
            if (reservation.house_availability_start_date === reservation.house_availability_end_date) {
                // Put everything on one line for single-day reservations
                cellData.displayText = `${reservation.last_name} ${reservation.reservation_number}`;
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

            // Calculate tooltip - include all details here
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

    // Generate array of dates for the current view
    private generateDays(): Date[] {
        const days: Date[] = [];
        const currentYear = new Date().getFullYear(); // Use current year
        const startDate = new Date(currentYear, 2, 31); // March 31st (month is 0-based)
        const endDate = new Date(currentYear, 10, 15);  // November 15th (month is 0-based)
        
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
        // Use filteredHouses instead of houses directly
        const houses = this.filteredHouses();
        const days = this.days();
        const grid = this.gridMatrix();
        
        // Use the gridMatrix data to create the table data
        return houses.map((house, houseIndex) => {
            const rowData: any = {};
            
            // If grid matrix has been generated
            if (grid.length > houseIndex) {
                const rowCells = grid[houseIndex];
                
                days.forEach((_, dayIndex) => {
                    if (rowCells.length > dayIndex) {
                        const cellData = rowCells[dayIndex];
                        rowData[`day${dayIndex}`] = cellData.displayText || '';
                    } else {
                        rowData[`day${dayIndex}`] = '';
                    }
                });
            } else {
                // Fallback if grid matrix hasn't been generated yet
                days.forEach((_, dayIndex) => {
                    rowData[`day${dayIndex}`] = '';
                });
            }
            
            return rowData;
        });
    }

    // Custom cell renderer for Handsontable
    private cellRenderer(instance: any, td: HTMLTableCellElement, row: number, dayIndex: number, prop: string | number, value: any, cellProperties: any): void {
        const grid = this.gridMatrix();
        
        // Make sure the grid and row exist
        if (grid.length > row && grid[row].length > dayIndex) {
            const cellData = grid[row][dayIndex];
            
            if (cellData.isReserved) {
                td.style.backgroundColor = cellData.color;
                td.style.color = '#000';
                td.style.textAlign = 'center';
                td.style.whiteSpace = 'nowrap';
                td.style.overflow = 'hidden';
                td.style.textOverflow = 'ellipsis';
                td.style.alignContent = 'center';
                td.title = cellData.tooltip;
                td.innerHTML = cellData.displayText;
            } else {
                td.style.backgroundColor = 'transparent';
                td.innerHTML = '';
                
                // Apply day-specific styling
                if (cellData.isToday) td.classList.add('today-column');
                if (cellData.isSaturday) td.classList.add('saturday-column');
                if (cellData.isSunday) td.classList.add('sunday-column');
            }
        } else {
            td.style.backgroundColor = 'transparent';
            td.innerHTML = '';
        }
    }

    // Format date for column headers
    private formatDate(date: Date): string {
        // Croatian short date format: day.month (without leading zeros)
        const day = date.getDate();
        const month = date.getMonth() + 1; // getMonth() is 0-based
        return `${day}.${month}`;
    }
    
    // Enforce minimum column width
    private enforceMinColumnWidth(column: number, minWidth: number): void {
    }

    private handleEditReservation(row: number, col: number): void {
        const grid = this.gridMatrix();
        if (grid.length > row && grid[row].length > col) {
            const cellData = grid[row][col];
            if (cellData.isReserved) {
                // Find the actual reservation object
                const key = this.getReservationKey(this.houses()[row].house_id, this.days()[col]);
                const reservation = this.reservationMap.get(key);
                
                if (!reservation) {
                    return;
                }
                
                // Set the form state to edit this reservation
                this.selectedHouseId.set(reservation.house_id);
                
                // Create new Date objects from strings to avoid reference issues
                const startDate = new Date(reservation.house_availability_start_date);
                const endDate = new Date(reservation.house_availability_end_date);
                
                this.selectedStartDate.set(startDate);
                this.selectedEndDate.set(endDate);
                
                // Set the full reservation data for editing
                this.editingReservation.set({
                    ...reservation // Copy all fields from the existing reservation
                });
                
                // Check for next reservation to limit end date
                this.updateNextReservationDate();
                
                // Use setTimeout to help avoid event listener errors with the calendar component
                setTimeout(() => {
                    // Important: Make sure to reset visibility state first
                    if (this.showReservationForm()) {
                        // If somehow the form is still showing, reset it first
                        this.showReservationForm.set(false);
                        setTimeout(() => {
                            this.showReservationForm.set(true);
                        }, 100);
                    } else {
                        // Normal case - just show the form
                        this.showReservationForm.set(true);
                    }
                    
                    // Set up calendar date restrictions
                    setTimeout(() => {
                        this.setupCalendarDateRestrictions();
                    }, 300);
                }, 0);
            }
        }
    }

    private handleDeleteReservation(row: number, col: number): void {
        const grid = this.gridMatrix();
        if (grid.length > row && grid[row].length > col) {
            const cellData = grid[row][col];
            if (cellData.isReserved) {
                // Find the actual reservation object
                const key = this.getReservationKey(this.houses()[row].house_id, this.days()[col]);
                const reservation = this.reservationMap.get(key);
                
                if (!reservation) {
                    return;
                }
                
                // Show confirmation dialog with reservation details
                const lastName = reservation.last_name || 'Unknown';
                const refNumber = reservation.reservation_number || 'No reference';
                const startDate = new Date(reservation.house_availability_start_date).toLocaleDateString();
                const endDate = new Date(reservation.house_availability_end_date).toLocaleDateString();
                
                const confirmMessage = 
                    `Are you sure you want to delete this reservation?\n\n` +
                    `Guest: ${lastName}\n` +
                    `Reference: ${refNumber}\n` +
                    `Period: ${startDate} to ${endDate}\n\n` +
                    `This action cannot be undone.`;
                
                const confirmDelete = confirm(confirmMessage);
                
                if (confirmDelete) {
                    // First update UI for immediate feedback
                    const currentAvailabilities = this.houseAvailabilities();
                    const filteredAvailabilities = currentAvailabilities.filter(
                        avail => avail.house_availability_id !== reservation.house_availability_id
                    );
                    this.houseAvailabilities.set(filteredAvailabilities);
                    this.updateGridMatrix();
                    
                    // Delete from backend
                    this.dataService.deleteHouseAvailability(reservation.house_availability_id).subscribe({
                        next: (result) => {
                            // Update was already done optimistically above
                        },
                        error: (error: any) => {
                            // Revert the optimistic update
                            this.houseAvailabilities.set(currentAvailabilities);
                            this.updateGridMatrix();
                        },
                        complete: () => {
                        }
                    });
                }
            }
        }
    }

    private handleAddReservation(row: number, col: number): void {
        const houses = this.houses();
        const days = this.days();
        
        if (houses.length > row && days.length > col) {
            const house = houses[row];
            const day = days[col];
            
            // First make sure we reset any previous state
            this.editingReservation.set({});
            
            // Create new Date objects for start and end dates to avoid reference issues
            const startDate = new Date(day);
            
            // Calculate end date as the next day by default for better UX
            const endDate = new Date(day);
            endDate.setDate(endDate.getDate() + 1); // Add one day to the end date
            
            // Set basic form data while we wait for the availability type to load
            this.selectedHouseId.set(house.house_id);
            this.selectedStartDate.set(startDate);
            this.selectedEndDate.set(endDate);
            
            // Check for next reservation to limit end date
            this.updateNextReservationDate();
            
            // Check if there's a upcoming reservation that would limit the end date
            const nextReservation = this.findNextReservation(house.house_id, startDate);
            if (nextReservation) {
                const nextStartDate = new Date(nextReservation.house_availability_start_date);
                
                // If the default end date would overlap, adjust it
                if (endDate >= nextStartDate) {
                    // Set end date to the day before the next reservation
                    const adjustedEndDate = new Date(nextStartDate);
                    adjustedEndDate.setDate(adjustedEndDate.getDate() - 1);
                    this.selectedEndDate.set(adjustedEndDate);
                }
            }
            
            // Use setTimeout to help avoid event listener errors with the calendar component
            setTimeout(() => {
                // Get the correct house availability type ID for "Occupied"
                this.dataService.getHouseAvailabilityTypeByName("Occupied").then(occupiedType => {
                    if (!occupiedType || !occupiedType.house_availability_type_id) {
                        return;
                    }
                    
                    const availabilityTypeId = occupiedType.house_availability_type_id;
                    
                    // Now set the full reservation data with the correct type ID
                    this.editingReservation.set({
                        house_id: house.house_id,
                        house_availability_type_id: availabilityTypeId, // Use the correct type ID
                        color_theme: Math.floor(Math.random() * 10), // Random color theme
                        color_tint: 0.5, // Default tint
                        adults: 2, // Default values
                        babies: 0,
                        has_arrived: false,
                        has_departed: false,
                        prev_connected: false,
                        next_connected: false
                    });
                    
                    // Important: Make sure to reset visibility state first
                    if (this.showReservationForm()) {
                        // If somehow the form is still showing, reset it first
                        this.showReservationForm.set(false);
                        setTimeout(() => {
                            this.showReservationForm.set(true);
                        }, 100);
                    } else {
                        // Normal case - just show the form
                        this.showReservationForm.set(true);
                    }
                }).catch(error => {
                });
            }, 0); // Use timeout of 0 to defer execution to next event cycle
        }
    }

    // Format date as YYYY-MM-DD to avoid timezone issues
    private formatDateToYYYYMMDD(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    handleReservationSave(reservation: HouseAvailability): void {
        // Extract dates directly from the reservation object (these come from the form)
        let startDateStr = reservation.house_availability_start_date;
        let endDateStr = reservation.house_availability_end_date;
        
        // Convert to Date objects for validation
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        
        // Ensure dates are valid
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return;
        }
        
        // Validate that end date is not before start date
        if (endDate < startDate) {
            return;
        }
        
        // Check if we're editing an existing reservation or creating a new one
        const isEditing = reservation.house_availability_id && reservation.house_availability_id < 1000000;
        
        // Skip overlap validation for the reservation we're currently editing
        const currentReservationId = isEditing ? reservation.house_availability_id : undefined;
        
        // Check if the reservation overlaps with another one in the same house
        // First, check if there's a next reservation
        const nextReservation = this.findNextReservation(reservation.house_id, startDate, currentReservationId);
        if (nextReservation) {
            const nextStartDate = new Date(nextReservation.house_availability_start_date);
            
            // If our end date is on or after the next reservation's start date, we have an overlap
            if (endDate >= nextStartDate) {
                return;
            }
        }
        
        // Format dates for backend properly - we need YYYY-MM-DD format
        // We'll use our own function instead of relying on toISOString which can cause timezone issues
        const formattedStartDate = this.formatDateToYYYYMMDD(startDate);
        const formattedEndDate = this.formatDateToYYYYMMDD(endDate);
        
        // First, get the correct house availability type ID for "Occupied"
        this.dataService.getHouseAvailabilityTypeByName("Occupied").then(occupiedType => {
            if (!occupiedType || !occupiedType.house_availability_type_id) {
                return;
            }
            
            const availabilityTypeId = occupiedType.house_availability_type_id;
            
            if (isEditing) {
                // We're updating an existing reservation
                
                // Create an updated reservation with the new values
                const updatedReservation: HouseAvailability = {
                    ...reservation,
                    // Use the formatted dates from the form data
                    house_availability_start_date: formattedStartDate,
                    house_availability_end_date: formattedEndDate,
                    house_availability_type_id: availabilityTypeId, // Use the correct type ID
                    reservation_length: this.calculateDaysBetween(startDate, endDate) + 1 // Include both start and end date
                };
                
                // First update UI for immediate feedback
                const currentAvailabilities = this.houseAvailabilities();
                const updatedAvailabilities = currentAvailabilities.map(avail => 
                    avail.house_availability_id === updatedReservation.house_availability_id ? 
                    updatedReservation : avail
                );
                this.houseAvailabilities.set(updatedAvailabilities);
                this.updateGridMatrix();
                
                // Hide the form immediately for better UX
                this.showReservationForm.set(false);
                
                // Then send to backend using the updateHouseAvailability method
                this.dataService.updateHouseAvailability(updatedReservation).subscribe({
                    next: (savedReservation: HouseAvailability | null) => {
                        if (!savedReservation) {
                            // Revert the optimistic update
                            this.houseAvailabilities.set(currentAvailabilities);
                            this.updateGridMatrix();
                        }
                    },
                    error: (error: any) => {
                        // Revert the optimistic update
                        this.houseAvailabilities.set(currentAvailabilities);
                        this.updateGridMatrix();
                    }
                });
            } else {
                // We're creating a new reservation (existing code path)
                
                // Create a new reservation using the dates directly from the form
                const newReservation: HouseAvailability = {
                    ...reservation,
                    house_availability_id: Math.floor(Math.random() * 100000) + 10000000, // Use a very large temporary ID
                    // Use the formatted dates from the form data
                    house_availability_start_date: formattedStartDate,
                    house_availability_end_date: formattedEndDate,
                    house_availability_type_id: availabilityTypeId, // Use the correct type ID
                    reservation_length: this.calculateDaysBetween(startDate, endDate) + 1 // Include both start and end date
                };
                
                // Ensure all required fields have values (even if they're default/empty values)
                if (!newReservation.has_arrived) newReservation.has_arrived = false;
                if (!newReservation.has_departed) newReservation.has_departed = false;
                if (!newReservation.prev_connected) newReservation.prev_connected = false;
                if (!newReservation.next_connected) newReservation.next_connected = false;
                if (!newReservation.color_theme && newReservation.color_theme !== 0) newReservation.color_theme = Math.floor(Math.random() * 10);
                if (!newReservation.color_tint && newReservation.color_tint !== 0) newReservation.color_tint = 0.5;
                if (!newReservation.adults) newReservation.adults = 0;
                if (!newReservation.babies) newReservation.babies = 0;
                if (!newReservation.cribs) newReservation.cribs = 0;
                if (!newReservation.dogs_d) newReservation.dogs_d = 0;
                if (!newReservation.dogs_s) newReservation.dogs_s = 0;
                if (!newReservation.dogs_b) newReservation.dogs_b = 0;
                
                // First update UI for immediate feedback
                const currentAvailabilities = this.houseAvailabilities();
                this.houseAvailabilities.set([...currentAvailabilities, newReservation]);
                this.updateGridMatrix();
                
                // Hide the form immediately for better UX
                this.showReservationForm.set(false);
                
                // Then send to backend using the DataService method
                this.dataService.saveHouseAvailability(newReservation).subscribe({
                    next: (savedReservation: HouseAvailability | null) => {
                        if (savedReservation) {
                            // Update the local data with the saved reservation (which now has a real ID)
                            const updatedAvailabilities = this.houseAvailabilities().map(avail => 
                                avail.house_availability_id === newReservation.house_availability_id ? 
                                savedReservation : avail
                            );
                            this.houseAvailabilities.set(updatedAvailabilities);
                            this.updateGridMatrix();
                        }
                    },
                    error: (error: any) => {
                    }
                });
            }
        }).catch(error => {
        });
    }
    
    handleReservationCancel(): void {
        // First set the form to not visible
        this.showReservationForm.set(false);
        
        // Reset all form-related state to ensure we can open it again
        setTimeout(() => {
            // Use timeout to ensure the form is fully closed before resetting state
            this.editingReservation.set({});
        }, 100);
    }
    
    // Handle visibility changes from the form
    handleVisibilityChange(isVisible: boolean): void {
        // Update the visibility signal
        this.showReservationForm.set(isVisible);
        
        // If the form is being closed (not being opened), reset state
        if (!isVisible) {
            // Use timeout to ensure the form is fully closed before resetting state
            setTimeout(() => {
                this.editingReservation.set({});
                this.nextReservationDate.set(null); // Also reset next reservation date
            }, 100);
        } else if (isVisible) {
            // If form is being shown, check if we need to update for next reservation
            // And set up date restrictions
            this.updateNextReservationDate();
            
            // Give the form time to initialize and render the calendar components
            setTimeout(() => {
                this.setupCalendarDateRestrictions();
            }, 300);
        }
    }
    
    // Set up calendar date restrictions with MutationObserver to avoid event listener errors
    private setupCalendarDateRestrictions(): void {
    }
    
    // Apply restrictions to the end date calendar
    private restrictEndDateCalendar(): void {
    }

    // Update the next reservation date signal
    private updateNextReservationDate(): void {
        const houseId = this.selectedHouseId();
        const startDate = this.selectedStartDate();
        
        if (!houseId || !startDate) {
            this.nextReservationDate.set(null);
            return;
        }
        
        const nextReservation = this.findNextReservation(houseId, startDate);
        if (nextReservation) {
            // If we found a next reservation, update the signal with its start date
            const nextDate = new Date(nextReservation.house_availability_start_date);
            this.nextReservationDate.set(nextDate);
        } else {
            this.nextReservationDate.set(null);
        }
    }
    
    // Helper method to calculate days between two dates
    private calculateDaysBetween(startDate: Date, endDate: Date): number {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Reset hours to avoid time zone issues
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        
        // Calculate the difference in milliseconds
        const diffInMs = end.getTime() - start.getTime();
        
        // Convert to days
        return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    }

    // Add a method to find the next reservation for a house after a given date
    private findNextReservation(houseId: number, afterDate: Date, excludeReservationId?: number): HouseAvailability | null {
        const availabilities = this.houseAvailabilities();
        const afterDateMs = new Date(afterDate).setHours(0, 0, 0, 0);
        
        // Find all reservations for this house that start after the given date
        const futureReservations = availabilities.filter(avail => {
            // Match house ID
            if (avail.house_id !== houseId) return false;
            
            // Exclude the reservation we're currently editing if ID is provided
            if (excludeReservationId && avail.house_availability_id === excludeReservationId) return false;
            
            // Convert start date to timestamp for comparison
            const startDateMs = new Date(avail.house_availability_start_date).setHours(0, 0, 0, 0);
            
            // Keep only reservations that start after the given date
            return startDateMs > afterDateMs;
        });
        
        // If we found future reservations, return the one with the earliest start date
        if (futureReservations.length > 0) {
            // Sort by start date (ascending)
            return futureReservations.sort((a, b) => {
                const aDate = new Date(a.house_availability_start_date).getTime();
                const bDate = new Date(b.house_availability_start_date).getTime();
                return aDate - bDate;
            })[0]; // Return the first one (earliest)
        }
        
        // No future reservations found
        return null;
    }

    // Check if a cell has a reservation
    private hasCellReservation(row: number, col: number): boolean {
        const grid = this.gridMatrix();
        if (grid.length > row && grid[row].length > col) {
            const cellData = grid[row][col];
            return cellData.isReserved;
        }
        return false;
    }

    // Add method to filter houses by type
    private filterHousesByType(): House[] {
        const houses = this.houses();
        const selectedTypeId = this.selectedHouseTypeId();
        
        // If no type is selected, return all houses
        if (selectedTypeId === null) {
            return houses;
        }
        
        // Filter houses by the selected type
        return houses.filter(house => house.house_type_id === selectedTypeId);
    }
    
    // Method to set the selected house type
    setSelectedHouseType(typeId: number | null): void {
        if (this._previousHouseTypeId !== typeId) {
            this._previousHouseTypeId = typeId;
            this.selectedHouseTypeId.set(typeId);
            
            // First update the grid matrix with new filtered data
            this.updateGridMatrix();
            
            // Force a rebuild of the table with new data
            setTimeout(() => {
                if (this.hotTableComponent) {
                    const hot = (this.hotTableComponent as any).hotInstance;
                    if (hot) {
                        // Update with new data and dimensions
                        const filteredHouses = this.filteredHouses();
                        
                        hot.updateSettings({
                            data: this.generateTableData(),
                            rowHeaders: filteredHouses.map(house => house.house_number?.toString() || ''),
                            manualRowHeights: Array(filteredHouses.length).fill(30),
                        });
                        
                        // Explicitly set the number of rows to match filtered houses
                        if (filteredHouses.length !== hot.countRows()) {
                            if (filteredHouses.length > hot.countRows()) {
                                hot.alter('insert_row', hot.countRows(), filteredHouses.length - hot.countRows());
                            } else if (filteredHouses.length < hot.countRows()) {
                                hot.alter('remove_row', filteredHouses.length, hot.countRows() - filteredHouses.length);
                            }
                        }
                        
                        // Force rendering
                        hot.render();
                    }
                }
            }, 10);
        }
    }
    
    // Method to clear filters
    clearHouseTypeFilter(): void {
        this.setSelectedHouseType(null);
    }
    
    // Method to get the house type name
    getHouseTypeName(typeId: number | null): string {
        if (typeId === null) return 'All';
        
        const houseType = this.houseTypes().find((type: HouseType) => type.house_type_id === typeId);
        return houseType?.house_type_name || 'Unknown';
    }
}