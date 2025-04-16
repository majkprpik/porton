import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, effect, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, House, HouseAvailability, HouseType } from '../service/data.service';
import { Subscription, Subject, takeUntil } from 'rxjs';
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
            width: '100%',
            height: '100%',
            licenseKey: 'non-commercial-and-evaluation',
            className: 'htCenter',
            // Enable proper scrolling - fix type by using string literal 
            stretchH: 'none' as 'none', // This explicit type casting fixes the issue
            colWidths: 100,
            fixedColumnsStart: 0,
            // Fix headers in place while scrolling
            fixedRowsTop: 0,
            // Force all rows to be exactly 30px high
            rowHeights: 30,
            // Set manual column widths - all day columns at 80px
            manualColumnWidths: Array(days.length).fill(80),
            // Set manual row heights for all rows - adjust count based on filtered houses
            manualRowHeights: Array(houses.length).fill(30),
            // Ensure consistent row and column sizes
            autoRowSize: false,
            autoColumnSize: false,
            // Ensure headers are properly sized
            renderAllRows: true,
            renderAllColumns: true,
            // Replace simple boolean with custom context menu
            contextMenu: {
                items: {
                    // viewReservation: {
                    //     name: '<i class="pi pi-eye"></i> View Reservation',
                    //     callback: (key: string, selection: any[]) => {
                    //         const [row, col] = [selection[0].start.row, selection[0].start.col];
                    //         this.handleViewReservation(row, col);
                    //     },
                    //     disabled: () => {
                    //         // Access hot instance via any type to bypass type checking
                    //         const hot = this.hotTableComponent ? (this.hotTableComponent as any).hotInstance : null;
                    //         const sel = hot?.getSelected();
                    //         if (sel && sel.length > 0) {
                    //             const [row, col] = [sel[0][0], sel[0][1]];
                    //             return !this.hasCellReservation(row, col);
                    //         }
                    //         return true;
                    //     }
                    // },
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
                    // bulkReservation: {
                    //     name: '<i class="pi pi-list"></i> Bulk Create Reservations',
                    //     callback: () => {
                    //         this.handleBulkReservation();
                    //     }
                    // },
                    // sep2: { name: '---------' },
                    // filterReservations: {
                    //     name: '<i class="pi pi-filter"></i> Filter Reservations',
                    //     callback: () => {
                    //         this.handleFilterReservations();
                    //     }
                    // },
                    // exportData: {
                    //     name: '<i class="pi pi-download"></i> Export Data',
                    //     callback: () => {
                    //         this.handleExportData();
                    //     }
                    // },
                    // printView: {
                    //     name: '<i class="pi pi-print"></i> Print View',
                    //     callback: () => {
                    //         this.handlePrintView();
                    //     }
                    // }
                }
            },
            // Make sure all cells maintain their dimensions
            afterInit: () => {
                console.log('Handsontable initialized with fixed cell dimensions: 80x30');
                
                // Directly modify border styles
                setTimeout(() => {
                    const tableContainer = document.querySelector('.handsontable-wrapper');
                    if (tableContainer) {
                        const style = document.createElement('style');
                        style.textContent = `
                            .handsontable .htCore td, 
                            .handsontable .htCore th {
                                border-right: 1px solid rgba(180, 180, 180, 0.15) !important;
                                border-bottom: 1px solid rgba(180, 180, 180, 0.15) !important;
                            }
                        `;
                        tableContainer.appendChild(style);
                    }
                    
                    // Fix any scrolling issues
                    window.dispatchEvent(new Event('resize'));
                }, 100);
            },
            // Simpler afterColumnResize that makes sure we don't go below 80px
            afterColumnResize: (column: number, width: number) => {
                if (width < 80) {
                    setTimeout(() => this.enforceMinColumnWidth(column, 80), 0);
                }
            },
            columns: days.map((day, index) => ({
                data: `day${index}`,
                readOnly: true,
                renderer: (instance: any, td: HTMLTableCellElement, row: number, col: number, prop: string | number, value: any, cellProperties: any) => {
                    this.cellRenderer(instance, td, row, col, prop, value, cellProperties);
                }
            })),
            afterChange: () => {
                // Force update when data changes
                this.hotSettings();
            },
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
        
        // Load house types data
        this.dataService.getHouseTypes().pipe(takeUntil(this.destroy$)).subscribe(types => {
            this.houseTypes.set(types);
            console.log('House types loaded:', types);
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
                console.log('House availabilities loaded:', availabilities.length);
            });
            
        // Monitor initial render
        setTimeout(() => {
            const renderTime = performance.now() - this.renderStartTime;
            console.log(`Initial render time: ${renderTime.toFixed(2)}ms`);
            console.log(`Cells per second: ${(this.totalCells / (renderTime / 1000)).toFixed(2)}`);
        }, 0);
        
        // Set up scroll behavior to prevent browser navigation issues
        // this.setupScrollBehavior();
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

        console.log(`updateGridMatrix: ${houses.length} houses, ${days.length} days, ${availabilities.length} availabilities`);
        
        if (availabilities.length > 0) {
            console.log('Sample availability:', availabilities[0]);
        }

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
            
            // Log a few reservations for debugging
            if (this.reservationMap.size < 3) {
                console.log(`Adding reservation: house_id=${availability.house_id}, startDate=${startDate.toISOString()}, endDate=${endDate.toISOString()}`);
            }
            
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const key = this.getReservationKey(availability.house_id, d);
                this.reservationMap.set(key, availability);
            }
        });
        
        console.log(`Built reservation map with ${this.reservationMap.size} entries`);

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
        console.log(`Grid has ${grid.length} rows, filtered houses: ${houses.length}, filter: ${selectedTypeId === null ? 'none' : selectedTypeId}`);

        // Count reserved cells to verify data
        let reservedCellCount = 0;
        grid.forEach(row => {
            row.forEach(cell => {
                if (cell.isReserved) reservedCellCount++;
            });
        });
        console.log(`Grid contains ${reservedCellCount} reserved cells`);

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
        
        console.log(`Generating days from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
        
        // Set hours to 0 to avoid timezone issues
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        // Generate all dates between start and end date
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            days.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        console.log(`Generated ${days.length} days`);
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
                // For debugging - log a few reserved cells
                if (Math.random() < 0.01) {  // Only log ~1% of reserved cells to avoid console spam
                    // console.log(`Rendering reserved cell: row=${row}, dayIndex=${dayIndex}, color=${cellData.color}, text=${cellData.displayText}`);
                }
                
                td.style.backgroundColor = cellData.color;
                td.style.color = '#000';
                td.style.textAlign = 'center';
                // td.style.padding = '4px';
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
        if (!this.hotTableComponent) return;

        // Access the hot instance through hotInstance property
        const hot = (this.hotTableComponent as any).hotInstance;
        if (hot) {
            const currentWidths = [...hot.getSettings().manualColumnWidths];
            if (column < currentWidths.length) {
                if (currentWidths[column] < minWidth) {
                    currentWidths[column] = minWidth;
                    hot.updateSettings({ manualColumnWidths: currentWidths });
                }
            }
        }
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
                    console.error('Could not find reservation data for cell');
                    // alert('Error: Could not find reservation data.');
                    return;
                }
                
                console.log('Editing reservation:', reservation);
                
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
                    
                    console.log('Form is now visible with reservation data for editing');
                    
                    // Set up calendar date restrictions
                    setTimeout(() => {
                        this.setupCalendarDateRestrictions();
                    }, 300);
                }, 0);
            } else {
                // alert('No reservation at this location to edit');
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
                    console.error('Could not find reservation data for cell');
                    // alert('Error: Could not find reservation data.');
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
                    console.log('Deleting reservation:', reservation);
                    
                    // Show loading indicator if needed
                    // this.isLoading.set(true);
                    
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
                            console.log('Reservation deleted successfully:', result);
                            // Update was already done optimistically above
                            
                            // Show success message
                            // alert(`Reservation for ${lastName} has been deleted successfully.`);
                        },
                        error: (error: any) => {
                            console.error('Error deleting reservation:', error);
                            
                            // Revert the optimistic update
                            this.houseAvailabilities.set(currentAvailabilities);
                            this.updateGridMatrix();
                            
                            // Show error to user
                            // alert('Failed to delete reservation: ' + (error.message || 'Unknown error'));
                        },
                        complete: () => {
                            // Hide loading indicator if needed
                            // this.isLoading.set(false);
                        }
                    });
                }
            } else {
                // alert('No reservation at this location to delete');
            }
        }
    }

    private handleAddReservation(row: number, col: number): void {
        const houses = this.houses();
        const days = this.days();
        
        if (houses.length > row && days.length > col) {
            const house = houses[row];
            const day = days[col];
            console.log('Opening form to add reservation for house:', house, 'on day:', day);
            
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
                    
                    console.log(`Adjusted end date to ${adjustedEndDate.toLocaleDateString()} to avoid overlap with next reservation`);
                }
            }
            
            // Use setTimeout to help avoid event listener errors with the calendar component
            setTimeout(() => {
                // Get the correct house availability type ID for "Occupied"
                this.dataService.getHouseAvailabilityTypeByName("Occupied").then(occupiedType => {
                    if (!occupiedType || !occupiedType.house_availability_type_id) {
                        console.error('Could not find "Occupied" house availability type');
                        // alert('Error: Could not find appropriate reservation type. Please try again later.');
                        return;
                    }
                    
                    const availabilityTypeId = occupiedType.house_availability_type_id;
                    console.log(`Found "Occupied" house availability type with ID: ${availabilityTypeId}`);
                    
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
                    
                    console.log('Form should now be visible with new data');
                }).catch(error => {
                    console.error('Error retrieving house availability type:', error);
                    // alert('Failed to get required availability type information. Please try again later.');
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
        console.log('Preparing to save reservation from form:', reservation);
        
        // Extract dates directly from the reservation object (these come from the form)
        let startDateStr = reservation.house_availability_start_date;
        let endDateStr = reservation.house_availability_end_date;
        
        console.log('Raw dates from form:', { startDateStr, endDateStr });
        
        // Convert to Date objects for validation
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        
        // Ensure dates are valid
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            // alert('Please select valid start and end dates.');
            return;
        }
        
        // Validate that end date is not before start date
        if (endDate < startDate) {
            // alert('End date cannot be before start date. Please correct the dates.');
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
                // alert(`This reservation overlaps with another reservation in the same house starting on ${nextStartDate.toLocaleDateString()}. Please adjust the dates.`);
                return;
            }
        }
        
        // Format dates for backend properly - we need YYYY-MM-DD format
        // We'll use our own function instead of relying on toISOString which can cause timezone issues
        const formattedStartDate = this.formatDateToYYYYMMDD(startDate);
        const formattedEndDate = this.formatDateToYYYYMMDD(endDate);
        
        // Log the actual dates from the form
        console.log('Reservation dates from form:', {
            rawStartDate: startDateStr,
            rawEndDate: endDateStr,
            formattedStartDate,
            formattedEndDate,
            length: this.calculateDaysBetween(startDate, endDate) + 1
        });
        
        // First, get the correct house availability type ID for "Occupied"
        this.dataService.getHouseAvailabilityTypeByName("Occupied").then(occupiedType => {
            if (!occupiedType || !occupiedType.house_availability_type_id) {
                console.error('Could not find "Occupied" house availability type');
                // alert('Error: Could not find appropriate reservation type. Please try again later.');
                return;
            }
            
            const availabilityTypeId = occupiedType.house_availability_type_id;
            console.log(`Found "Occupied" house availability type with ID: ${availabilityTypeId}`);
            
            if (isEditing) {
                // We're updating an existing reservation
                console.log('Updating existing reservation with ID:', reservation.house_availability_id);
                
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
                        if (savedReservation) {
                            console.log('Reservation updated successfully:', savedReservation);
                            // Update already done optimistically above
                        } else {
                            console.error('Failed to update reservation - received null response');
                            // Show error to user
                            // alert('Failed to update reservation on server. Please try again.');
                            
                            // Revert the optimistic update
                            this.houseAvailabilities.set(currentAvailabilities);
                            this.updateGridMatrix();
                        }
                    },
                    error: (error: any) => {
                        console.error('Error updating reservation:', error);
                        // Show error to user
                        // alert('An error occurred while updating the reservation: ' + (error.message || 'Unknown error'));
                        
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
                            console.log('Reservation saved successfully:', savedReservation);
                            
                            // Update the local data with the saved reservation (which now has a real ID)
                            const updatedAvailabilities = this.houseAvailabilities().map(avail => 
                                avail.house_availability_id === newReservation.house_availability_id ? 
                                savedReservation : avail
                            );
                            this.houseAvailabilities.set(updatedAvailabilities);
                            this.updateGridMatrix();
                        } else {
                            console.error('Failed to save reservation - received null response');
                            // Show error to user
                            // alert('Failed to save reservation to server. Please try again.');
                        }
                    },
                    error: (error: any) => {
                        console.error('Error saving reservation:', error);
                        // Show error to user
                        // alert('An error occurred while saving the reservation: ' + (error.message || 'Unknown error'));
                    }
                });
            }
        }).catch(error => {
            console.error('Error retrieving house availability type:', error);
            // alert('Failed to get required availability type information. Please try again later.');
        });
    }
    
    handleReservationCancel(): void {
        console.log('Reservation form cancelled');
        
        // First set the form to not visible
        this.showReservationForm.set(false);
        
        // Reset all form-related state to ensure we can open it again
        setTimeout(() => {
            // Use timeout to ensure the form is fully closed before resetting state
            this.editingReservation.set({});
            console.log('Form state has been reset after closing');
        }, 100);
    }
    
    // Handle visibility changes from the form
    handleVisibilityChange(isVisible: boolean): void {
        console.log('Form visibility changed:', isVisible);
        
        // Update the visibility signal
        this.showReservationForm.set(isVisible);
        
        // If the form is being closed (not being opened), reset state
        if (!isVisible) {
            // Use timeout to ensure the form is fully closed before resetting state
            setTimeout(() => {
                this.editingReservation.set({});
                this.nextReservationDate.set(null); // Also reset next reservation date
                console.log('Form state has been reset after visibility change');
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
        console.log('Setting up calendar date restrictions with MutationObserver');
        
        // Use MutationObserver to detect when calendar panel is added to DOM
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if calendar panel has been added to DOM
                    const panel = document.querySelector('.p-datepicker:not(.p-datepicker-inline)');
                    if (panel) {
                        console.log('Calendar panel detected');
                        
                        // Apply initial date restrictions
                        this.restrictEndDateCalendar();
                        
                        // Monitor navigation clicks
                        const navObserver = new MutationObserver(() => {
                            // Reapply restrictions after DOM changes
                            setTimeout(() => this.restrictEndDateCalendar(), 10);
                        });
                        
                        // Observe the calendar panel for changes
                        navObserver.observe(panel, { childList: true, subtree: true });
                        
                        // Disconnect when calendar is closed
                        setTimeout(() => {
                            // Check periodically if calendar was closed
                            const checkInterval = setInterval(() => {
                                if (!document.querySelector('.p-datepicker:not(.p-datepicker-inline)')) {
                                    navObserver.disconnect();
                                    clearInterval(checkInterval);
                                    console.log('Calendar closed, observers disconnected');
                                }
                            }, 500);
                        }, 100);
                    }
                }
            }
        });
        
        // Start observing document body for calendar to appear
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Store observer for cleanup
        this.calendarObserver = observer;
    }
    
    // Apply restrictions to the end date calendar
    private restrictEndDateCalendar(): void {
        const nextDate = this.nextReservationDate();
        if (!nextDate) {
            console.log('No next reservation date, no need to restrict calendar');
            return;
        }
        
        console.log(`Restricting end date calendar to dates before ${nextDate.toLocaleDateString()}`);
        
        // Find all calendar day cells
        const calendarCells = document.querySelectorAll('.p-datepicker-calendar td:not(.p-datepicker-other-month)');
        if (!calendarCells || calendarCells.length === 0) {
            console.error('Could not find calendar day cells');
            return;
        }
        
        // The start date should be selectable
        const startDate = this.selectedStartDate();
        const startDateStr = `${startDate.getDate()}.${startDate.getMonth() + 1}.${startDate.getFullYear()}`;
        
        // Disable dates that are on or after the next reservation
        calendarCells.forEach((cell: Element) => {
            // Get the date from the cell
            const dayElement = cell.querySelector('span');
            if (!dayElement || !dayElement.textContent) return;
            
            const day = parseInt(dayElement.textContent.trim(), 10);
            if (isNaN(day)) return;
            
            // Get the month and year from the calendar header
            const calendarHeader = document.querySelector('.p-datepicker-title');
            if (!calendarHeader || !calendarHeader.textContent) return;
            
            // Parse the header which is in format "Month Year"
            const headerParts = calendarHeader.textContent.trim().split(' ');
            if (headerParts.length !== 2) return;
            
            const monthName = headerParts[0];
            const year = parseInt(headerParts[1], 10);
            if (isNaN(year)) return;
            
            // Map month name to month number (0-based)
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                               'July', 'August', 'September', 'October', 'November', 'December'];
            const month = monthNames.indexOf(monthName);
            if (month === -1) return;
            
            // Create date for this cell
            const cellDate = new Date(year, month, day);
            
            // Disable the cell if it's on or after the next reservation date
            if (cellDate >= nextDate) {
                cell.classList.add('p-disabled');
                cell.setAttribute('aria-disabled', 'true');
                
                // Add a visually distinct style
                cell.setAttribute('style', 'background-color: #f8d7da !important; color: #721c24 !important;');
                
                // Add a tooltip explaining why it's disabled
                cell.setAttribute('title', 'This date overlaps with another reservation');
            }
        });
    }

    // Handle start date changes in the form
    handleStartDateChange(newDate: Date): void {
        console.log('Start date changed:', newDate);
        this.selectedStartDate.set(newDate);
        
        // When the start date changes, we need to check if there's a next reservation
        // that would limit how far the end date can go
        this.updateNextReservationDate();
    }
    
    // Handle end date changes in the form
    handleEndDateChange(newDate: Date): void {
        console.log('End date changed:', newDate);
        this.selectedEndDate.set(newDate);
        
        // Check if the new end date overlaps with the next reservation
        const nextDate = this.nextReservationDate();
        if (nextDate && newDate >= nextDate) {
            // Warn the user but still allow setting the date (we'll validate on save)
            // alert(`Warning: This end date overlaps with another reservation starting on ${nextDate.toLocaleDateString()}`);
        }
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
            console.log(`Found next reservation for house ${houseId} starting on ${nextDate.toLocaleDateString()}`);
            this.nextReservationDate.set(nextDate);
        } else {
            // No next reservation found
            console.log(`No future reservations found for house ${houseId} after ${startDate.toLocaleDateString()}`);
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
            console.log(`Changing house type filter from ${this._previousHouseTypeId} to ${typeId}`);
            this._previousHouseTypeId = typeId;
            this.selectedHouseTypeId.set(typeId);
            
            // First update the grid matrix with new filtered data
            this.updateGridMatrix();
            
            // Force a rebuild of the table with new data
            setTimeout(() => {
                if (this.hotTableComponent) {
                    const hot = (this.hotTableComponent as any).hotInstance;
                    if (hot) {
                        console.log('Updating table after filter change');
                        
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