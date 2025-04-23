import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, effect, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, House, HouseAvailability, HouseType } from '../service/data.service';
import { Subject, takeUntil } from 'rxjs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ReservationFormComponent } from '../reservations/reservation-form/reservation-form.component';

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
    imports: [CommonModule, ProgressSpinnerModule, ReservationFormComponent],
    changeDetection: ChangeDetectionStrategy.OnPush
}) 
export class Reservation2Component implements OnInit, OnDestroy {
    // Convert to signals for reactive state management
    houses = signal<House[]>([]);
    houseAvailabilities = signal<HouseAvailability[]>([]);
    days = signal<Date[]>(this.generateDays());
    
    // Add signals for house type filtering
    houseTypes = signal<HouseType[]>([]);
    selectedHouseTypeId = signal<number>(0);
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
    
    // Add observer for calendar
    private calendarObserver?: MutationObserver;
    
    // Track previous house type ID to detect changes
    private _previousHouseTypeId: number = 0;

    // Add signals for reservation form
    showReservationForm = signal<boolean>(false);
    selectedHouseId = signal<number>(0);
    selectedStartDate = signal<Date>(new Date());
    selectedEndDate = signal<Date>(new Date());
    editingReservation = signal<Partial<HouseAvailability>>({});
    
    // Add a signal for the next reservation date (if any) to pass to the form
    nextReservationDate = signal<Date | null>(null);

    // Add context menu signals and properties
    showContextMenu = signal<boolean>(false);
    contextMenuX = signal<number>(0);
    contextMenuY = signal<number>(0);
    selectedRow = signal<number>(-1);
    selectedCol = signal<number>(-1);
    selectedCellHasReservation = signal<boolean>(false);

    // Add signals for tracking the currently selected cell
    selectedCellRowIndex = signal<number>(-1);
    selectedCellColIndex = signal<number>(-1);

    // Add signals for tracking cell selection range in a single row
    selectedStartColIndex = signal<number>(-1);
    selectedEndColIndex = signal<number>(-1);
    isSelecting = signal<boolean>(false);

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
            
            // Always select the first house type by default if there are any
            if (types && types.length > 0) {
                this.setSelectedHouseType(types[0].house_type_id);
            }
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

    // Format date for column headers (make it public to use in template)
    formatDate(date: Date): string {
        // Croatian short date format: day.month (without leading zeros)
        const day = date.getDate();
        const month = date.getMonth() + 1; // getMonth() is 0-based
        return `${day}.${month}`;
    }
    
    // Enforce minimum column width
    private enforceMinColumnWidth(column: number, minWidth: number): void {
    }

    // Add context menu handler
    onCellRightClick(event: MouseEvent, row: number, col: number): void {
        // Prevent default context menu
        event.preventDefault();
        
        // Set the selected cell
        this.selectedRow.set(row);
        this.selectedCol.set(col);
        
        // Check if the cell has a reservation
        this.selectedCellHasReservation.set(this.hasCellReservation(row, col));
        
        // Show context menu at click position
        this.contextMenuX.set(event.clientX);
        this.contextMenuY.set(event.clientY);
        this.showContextMenu.set(true);
    }
    
    // Hide context menu when clicking elsewhere
    @HostListener('document:click')
    hideContextMenu(): void {
        this.showContextMenu.set(false);
    }
    
    // Make these methods public to use in template
    handleEditReservation(row: number, col: number): void {
        // Hide context menu first
        this.showContextMenu.set(false);
        
        // Get the actual house based on the filtered list
        const houses = this.filteredHouses();
        const days = this.days();
        
        if (houses.length > row && days.length > col) {
            const house = houses[row];
            const day = days[col];
            
            // Use actual house ID and date to find the reservation
            const key = this.getReservationKey(house.house_id, day);
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

    handleDeleteReservation(row: number, col: number): void {
        // Hide context menu first
        this.showContextMenu.set(false);
        
        // Get the actual house based on the filtered list
        const houses = this.filteredHouses();
        const days = this.days();
        
        if (houses.length > row && days.length > col) {
            const house = houses[row];
            const day = days[col];
            
            // Use actual house ID and date to find the reservation
            const key = this.getReservationKey(house.house_id, day);
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

    handleAddReservation(row: number, col: number): void {
        // Hide context menu first
        this.showContextMenu.set(false);
        
        // Get the actual house based on the filtered list
        const houses = this.filteredHouses();
        const days = this.days();
        
        if (houses.length > row && days.length > col) {
            const house = houses[row];
            
            // First make sure we reset any previous state
            this.editingReservation.set({});
            
            // Check if we have a multi-cell selection in this row
            let startDate: Date;
            let endDate: Date;
            
            if (this.selectedCellRowIndex() === row && 
                this.selectedStartColIndex() >= 0 && 
                this.selectedEndColIndex() >= 0 && 
                this.selectedStartColIndex() !== this.selectedEndColIndex()) {
                // We have a range selection - use that for the dates
                const startCol = Math.min(this.selectedStartColIndex(), this.selectedEndColIndex());
                const endCol = Math.max(this.selectedStartColIndex(), this.selectedEndColIndex());
                
                startDate = new Date(days[startCol]);
                // For end date, we want the next day after the selected range
                endDate = new Date(days[endCol]);
                endDate.setDate(endDate.getDate() + 1);
            } else {
                // Single cell selection - use default behavior
                // Create new Date objects for start and end dates to avoid reference issues
                startDate = new Date(days[col]);
                
                // Calculate end date as the next day by default for better UX
                endDate = new Date(days[col]);
                endDate.setDate(endDate.getDate() + 1); // Add one day to the end date
            }
            
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
            
            // Clear selection after using it
            if (this.selectedStartColIndex() !== this.selectedEndColIndex()) {
                // Reset selection
                this.selectedCellRowIndex.set(-1);
                this.selectedStartColIndex.set(-1);
                this.selectedEndColIndex.set(-1);
            }
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
        
        // Filter houses by the selected type
        const filteredHouses = houses.filter(house => house.house_type_id === selectedTypeId);
        
        // Add empty rows
        for (let i = 0; i < 20; i++) {
            // Create an empty house object with an ID that won't conflict with real houses
            // Using negative IDs to ensure they won't match real house IDs
            filteredHouses.push({
                house_id: -1000 - i,
                house_number: 0,
                house_type_id: selectedTypeId || 0, // Use 0 as fallback
                house_name: ''
            } as House);
        }
        
        return filteredHouses;
    }
    
    // Method to set the selected house type
    setSelectedHouseType(typeId: number): void {
        if (this._previousHouseTypeId !== typeId && typeId !== null) {
            this._previousHouseTypeId = typeId;
            this.selectedHouseTypeId.set(typeId);
            
            // Update the grid matrix with new filtered data
            this.updateGridMatrix();
        }
    }
    
    // Method to get the house type name
    getHouseTypeName(typeId: number): string {
        const houseType = this.houseTypes().find((type: HouseType) => type.house_type_id === typeId);
        return houseType?.house_type_name || 'Unknown';
    }

    // Simplified table settings that don't rely on Handsontable
    updateTableSettings(): void {
        // We'll update the grid matrix instead
        this.updateGridMatrix();
    }

    // Add a method to handle double-clicks on cells
    onCellDoubleClick(event: MouseEvent, row: number, col: number): void {
        // Get the actual house based on the filtered list
        const houses = this.filteredHouses();
        const days = this.days();
        
        if (houses.length > row && days.length > col) {
            const isReserved = this.hasCellReservation(row, col);
            
            if (isReserved) {
                // If there's a reservation, edit it
                this.handleEditReservation(row, col);
            } else {
                // If there's no reservation, add a new one
                this.handleAddReservation(row, col);
            }
        }
    }

    // Handle cell click to select a cell
    onCellClick(event: MouseEvent, row: number, col: number): void {
        // Set the selected cell coordinates
        this.selectedCellRowIndex.set(row);
        this.selectedCellColIndex.set(col);
        
        // Start a new selection
        this.selectedStartColIndex.set(col);
        this.selectedEndColIndex.set(col);
        this.isSelecting.set(true);
        
        // Prevent event bubbling if needed
        event.stopPropagation();
    }

    // Handle mouse down on a cell to start selection
    onCellMouseDown(event: MouseEvent, row: number, col: number): void {
        // Set the selected cell coordinates and start selection
        this.selectedCellRowIndex.set(row);
        this.selectedStartColIndex.set(col);
        this.selectedEndColIndex.set(col);
        this.isSelecting.set(true);
        
        // Prevent text selection during drag
        event.preventDefault();
    }

    // Handle mouse move to update selection range
    onCellMouseMove(event: MouseEvent, row: number, col: number): void {
        // Only update if we're actively selecting and in the same row
        if (this.isSelecting() && row === this.selectedCellRowIndex()) {
            this.selectedEndColIndex.set(col);
        }
    }

    // Handle mouse up to end selection
    @HostListener('document:mouseup')
    onDocumentMouseUp(): void {
        if (this.isSelecting()) {
            this.isSelecting.set(false);
        }
    }

    // Check if a cell is selected (either single or in range)
    isCellSelected(row: number, col: number): boolean {
        if (row !== this.selectedCellRowIndex()) return false;
        
        const startCol = Math.min(this.selectedStartColIndex(), this.selectedEndColIndex());
        const endCol = Math.max(this.selectedStartColIndex(), this.selectedEndColIndex());
        
        return col >= startCol && col <= endCol;
    }

    // Helper methods to get the start and end columns of the current selection
    getStartColIndex(): number {
        if (this.selectedStartColIndex() < 0 || this.selectedEndColIndex() < 0) return -1;
        return Math.min(this.selectedStartColIndex(), this.selectedEndColIndex());
    }

    getEndColIndex(): number {
        if (this.selectedStartColIndex() < 0 || this.selectedEndColIndex() < 0) return -1;
        return Math.max(this.selectedStartColIndex(), this.selectedEndColIndex());
    }

    // Get the selected date range (useful for creating new reservations)
    getSelectedDateRange(): { startDate: Date, endDate: Date } | null {
        const row = this.selectedCellRowIndex();
        if (row < 0) return null;
        
        const startCol = Math.min(this.selectedStartColIndex(), this.selectedEndColIndex());
        const endCol = Math.max(this.selectedStartColIndex(), this.selectedEndColIndex());
        
        if (startCol < 0 || endCol < 0) return null;
        
        const days = this.days();
        if (startCol >= days.length || endCol >= days.length) return null;
        
        return {
            startDate: new Date(days[startCol]),
            endDate: new Date(days[endCol])
        };
    }

    // Clear cell selection when clicking elsewhere
    @HostListener('document:click', ['$event'])
    clearSelectionOnOutsideClick(event: MouseEvent): void {
        // Check if the click was outside the table
        const tableElement = (event.target as HTMLElement).closest('.reservation-table');
        if (!tableElement) {
            // Clear selection
            this.selectedCellRowIndex.set(-1);
            this.selectedStartColIndex.set(-1);
            this.selectedEndColIndex.set(-1);
        }
    }
}