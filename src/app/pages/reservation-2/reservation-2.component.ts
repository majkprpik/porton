import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, HostListener, effect } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { House, HouseAvailability, HouseType } from '../service/data.models';
import { Subject, takeUntil, forkJoin, combineLatest, firstValueFrom } from 'rxjs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ReservationFormComponent } from '../reservation-form/reservation-form.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { LayoutService } from '../../layout/service/layout.service';
import { DataService } from '../service/data.service';
import { TooltipModule } from 'primeng/tooltip';

interface CellData {
    isReserved: boolean;
    color: string;
    displayText: string;
    tooltip: string;
    identifier: string;
    isToday: boolean;
    isSaturday: boolean;
    isSunday: boolean;
    isReservationStart: boolean;
    isReservationMiddle: boolean;
    isReservationEnd: boolean;
}

@Component({
    selector: 'app-reservation-2',
    templateUrl: './reservation-2.component.html',
    styleUrls: ['./reservation-2.component.scss'],
    standalone: true,
    imports: [
        CommonModule, 
        ProgressSpinnerModule,
        ReservationFormComponent,
        TranslateModule,
        ButtonModule,
        TitleCasePipe,
        TooltipModule,
    ],
    providers: [DatePipe],
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
    tempHouses: House[] = [];
    
    // Signal for the entire grid matrix (from original component)
    gridMatrix = signal<CellData[][]>([]);
    
    // Optimized data structures from original component
    private reservationMap = new Map<string, HouseAvailability>();
    private houseIndexMap = new Map<number, number>();
    private dayIndexMap = new Map<number, number>();
    
    // Add destroy subject for takeUntil pattern
    private destroy$ = new Subject<void>();
    
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

    // Add signals for tracking the currently selected cell
    selectedCellRowIndex = signal<number>(-1);
    selectedCellColIndex = signal<number>(-1);

    // Add signals for tracking cell selection range in a single row
    selectedStartColIndex = signal<number>(-1);
    selectedEndColIndex = signal<number>(-1);
    isSelecting = signal<boolean>(false);

    // Add a signal to track the currently selected reservation ID
    selectedReservationId = signal<number | null>(null);

    droppableSpots: any = [];
    reservationToMove: any;

    // Add a flag to track whether the page has been loaded for the first time
    private isFirstLoad = true;

    colors = ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFE4BA', '#E8BAFF', '#BAF2FF', '#FFC9BA', '#D4FFBA', '#FFBAEC'];

    isNightMode: boolean | undefined = undefined;

    cellHeightInPx: number = 30;

    constructor(
        private dataService: DataService,
        private messageService: MessageService,
        private translateService: TranslateService,
        private confirmationService: ConfirmationService,
        private datePipe: DatePipe,
        private layoutService: LayoutService,
    ) {

        effect(() => {
            this.isNightMode = this.layoutService.layoutConfig().darkTheme;
        });
    }

    ngOnInit(): void {
        this.dataService.loadHouses().pipe(takeUntil(this.destroy$)).subscribe();
        this.dataService.loadHouseAvailabilities().pipe(takeUntil(this.destroy$)).subscribe();
        this.dataService.getHouseTypes().pipe(takeUntil(this.destroy$)).subscribe(types => {
            this.houseTypes.set(types.filter(t => t.house_type_name != 'dodatno'));
            
            if (types && types.length > 0) {
                this.setSelectedHouseType(types[0].house_type_id);
            }
        });

        this.dataService.tempHouses$.subscribe(tempHouses => {
            this.tempHouses = tempHouses;
        });
        
        this.dataService.houses$
            .pipe(takeUntil(this.destroy$))
            .subscribe(houses => {
                this.houses.set(houses);
                this.updateGridMatrix();
                
                if (this.isFirstLoad && houses.length > 0) {
                    this.scrollToToday();
                }
            });

        forkJoin({
            temp: this.dataService.loadTempHouseAvailabilities(),
            main: this.dataService.loadHouseAvailabilities(),
        }).subscribe( ({temp, main}) => {
            const combined = [...main, ...temp];
            this.houseAvailabilities.set(combined);
            this.updateGridMatrix();
        });

        combineLatest([
            this.dataService.houseAvailabilities$,
            this.dataService.tempHouseAvailabilities$
        ]).subscribe({
            next: ([houseAvailabilities, tempHouseAvailabilities]) => {
                if(houseAvailabilities && tempHouseAvailabilities){
                    const combined = [...houseAvailabilities, ...tempHouseAvailabilities];
                    this.houseAvailabilities.set(combined);
                    this.updateGridMatrix();
                }
            },
            error: (error) => {
                console.error(error);
            }
        });
        
        // Subscribe to house availabilities updates from real-time database changes
        this.dataService.$houseAvailabilitiesUpdate
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                // When we receive a notification that reservations have changed, reload them
                this.dataService.loadHouseAvailabilities().pipe(takeUntil(this.destroy$)).subscribe();
            });
            
        this.loadCellHeight();

        // Monitor initial render
        setTimeout(() => {
            // Scroll to today after the initial render if it's the first load
            if (this.isFirstLoad) {
                this.scrollToToday();
                this.isFirstLoad = false;
            }
        }, 300); // Longer delay for initial render
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

        // Count reserved cells to verify data
        let reservedCellCount = 0;
        grid.forEach(row => {
            row.forEach(cell => {
                if (cell.isReserved) reservedCellCount++;
            });
        });
    }

    private getReservationKey(houseId: number, date: Date): string {
        return `${houseId}-${date.getTime()}`;
    }

    private createCellData(day: Date, reservation?: HouseAvailability): CellData {
        const cellData: CellData = {
            isReserved: false,
            color: '',
            displayText: '',
            tooltip: '',
            identifier: '',
            isToday: this.isToday(day),
            isSaturday: this.isSaturday(day),
            isSunday: this.isSunday(day),
            isReservationStart: false,
            isReservationMiddle: false,
            isReservationEnd: false
        };

        if (reservation) {
            // Calculate color
            const baseColor = this.colors[reservation.color_theme % this.colors.length];
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
            const endDate = new Date(reservation.house_availability_end_date);
            endDate.setHours(0, 0, 0, 0);
            const checkDate = new Date(day);
            checkDate.setHours(0, 0, 0, 0);
            
            // Determine if this cell is the start, middle, or end of a reservation
            cellData.isReservationStart = checkDate.getTime() === startDate.getTime();
            cellData.isReservationEnd = checkDate.getTime() === endDate.getTime();
            cellData.isReservationMiddle = checkDate > startDate && checkDate < endDate;
            
            if (reservation.house_availability_start_date === reservation.house_availability_end_date) {
                // Put everything on one line for single-day reservations
                cellData.displayText = `${reservation.last_name} ${reservation.reservation_number}`;
                // Single day reservation is both start and end
                cellData.isReservationStart = true;
                cellData.isReservationEnd = true;
                cellData.isReservationMiddle = false;
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
            if (reservation.dogs_d > 0) cellData.tooltip += `\nPets: ${reservation.dogs_d}`;
            if (reservation.dogs_b > 0) cellData.tooltip += `\nBig pets: ${reservation.dogs_b}`;
            if (reservation.dogs_s > 0) cellData.tooltip += `\nSmall pets: ${reservation.dogs_s}`;
            if (reservation.cribs > 0) cellData.tooltip += `\nCribs: ${reservation.cribs}`;

            // Set identifier
            cellData.identifier = `res-${reservation.house_id}-${new Date(reservation.house_availability_start_date).getTime()}`;
            cellData.isReserved = true;
        }

        return cellData;
    }

    clearAvailableSpaces(){
        this.reservationToMove = undefined;
        this.droppableSpots = [];
    }

    getReservationByRowAndColumn(row: number, col: number){
        const houses = this.filteredHouses();
        const days = this.days();

        const house = houses[row];
        const day = days[col];
        
        const key = this.getReservationKey(house.house_id, day);
        const reservation = this.reservationMap.get(key);

        return reservation;
    }

    isSpotAvailable(row: number, col: number){
        if(!this.droppableSpots.length) return;

        const house = this.filteredHouses()[row];
        const day = this.days()[col];

        return this.droppableSpots.some((ds: any) => ds.house_id == house.house_id && ds.date.getTime() == day.getTime());
    }

    getDroppableSpotsForReservation(event: any, row: any, col: any){
        event.stopPropagation();
        this.droppableSpots = [];

        const reservation = this.getReservationByRowAndColumn(row, col);
        if(!reservation) return;

        if(this.reservationToMove && reservation.house_availability_id == this.reservationToMove.house_availability_id){
            this.clearAvailableSpaces();
            return;
        }

        this.reservationToMove = reservation;
        const houses = this.filteredHouses();
        const days = this.days();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const reservationLength = this.getSelectedReservationLength(this.reservationToMove);

        houses.forEach(house => {
            days.forEach(day => {
                if(day < today) return;

                const k = this.getReservationKey(house.house_id, day);
                const res = this.reservationMap.get(k);
                let isDroppable = false;

                if(!res){
                    isDroppable = this.isNumberOfDaysAvailableInTheFuture(day, house.house_id, reservationLength);
                } else if(res && res.house_availability_id == this.reservationToMove.house_availability_id){
                    isDroppable = this.isNumberOfDaysAvailableInTheFuture(day, house.house_id, reservationLength);
                } else if(res && res.house_availability_id != this.reservationToMove.house_availability_id){
                    return;
                }

                if(isDroppable){
                    this.droppableSpots.push({
                        house_id: house.house_id,
                        date: day,
                    });
                }
            });
        });
    }

    isNumberOfDaysAvailableInTheFuture(startDay: Date, houseId: number, numberOfDays: number): boolean{
        const house = this.filteredHouses().find(house => house.house_id == houseId);
        if(!house) return false;

        const days = this.days();
        let daysCount = 0;

        for(let day of days){
            if(day < startDay) continue;
    
            const k = this.getReservationKey(house.house_id, day);
            const res = this.reservationMap.get(k);
    
            if(res && res.house_availability_id != this.reservationToMove.house_availability_id) return false;
    
            daysCount++;
            
            if(daysCount >= numberOfDays) {
                return true;
            }
        }

        return false;
    }

    private getSelectedReservationLength(reservation: HouseAvailability){
        const start = new Date(reservation.house_availability_start_date);
        const end = new Date(reservation.house_availability_end_date);
        const timeDiff = end.getTime() - start.getTime();
        return Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;
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
    
    getNumberOfAdults(grid: any){
        if(grid.tooltip){
            const match = grid.tooltip.match(/Adults:\s*(\d+)/);
            const adults = match ? parseInt(match[1], 10) : null;

            return adults;
        }

        return '';
    }

    getNumberOfCribs(grid: any){
        if(grid.tooltip){
            const cribs = grid.tooltip.match(/Cribs:\s*(\d+)/);

            if(!cribs){
                return '';
            }

            const cribsCount = cribs ? parseInt(cribs[1], 10) : 0;

            return cribsCount;
        }

        return '';
    }

    getNumberOfPets(grid: any){
        if(grid.tooltip){
            const pets = grid.tooltip.match(/Pets:\s*(\d+)/);
            const smallPets = grid.tooltip.match(/Small pets:\s*(\d+)/);
            const bigPets = grid.tooltip.match(/Big pets:\s*(\d+)/);

            if (!pets && !smallPets && !bigPets) {
                return '';
            }

            const petsCount = pets ? parseInt(pets[1], 10) : 0;
            const smallPetsCount = smallPets ? parseInt(smallPets[1], 10) : 0;
            const bigPetsCount = bigPets ? parseInt(bigPets[1], 10) : 0;

            return petsCount + smallPetsCount + bigPetsCount;
        }

        return '';
    }

    getNumberOfBabies(grid: any){
        if(grid.tooltip){ 
            const babies = grid.tooltip.match(/Babies:\s*(\d+)/);

            if(!babies){
                return '';
            }

            const babiesCount = babies ? parseInt(babies[1], 10) : 0;

            return babiesCount;
        }

        return '';
    }

    // Make these methods public to use in template
    handleEditReservation(row: number, col: number): void {
        // Hide context menu first
        this.showReservationForm.set(false);
        
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
            }, 0);
        }
    }

    // New version of handleDeleteReservation that takes a reservationId directly
    handleDeleteReservation(data: { availabilityId: number; houseId: number }): void {
        // Find the reservation by ID
        const reservation = this.houseAvailabilities().find(
            avail => avail.house_availability_id === data.availabilityId
        );
        
        if (!reservation) return;
        
        // First update UI optimistically
        const currentAvailabilities = this.houseAvailabilities();
        const filteredAvailabilities = currentAvailabilities.filter(
            avail => avail.house_availability_id !== data.availabilityId
        );
        this.houseAvailabilities.set(filteredAvailabilities);
        this.updateGridMatrix();
        
        // Delete from backend
        this.dataService.deleteHouseAvailability(data.availabilityId, data.houseId).subscribe({
            next: (result) => {
                // Update was already done optimistically above
            },
            error: (error: any) => {
                console.error("Error deleting reservation:", error);
                // Revert the optimistic update
                forkJoin({
                    temp: this.dataService.loadTempHouseAvailabilities(),
                    main: this.dataService.loadHouseAvailabilities(),
                }).subscribe( ({temp, main}) => {
                    const combined = [...main, ...temp];
                    this.houseAvailabilities.set(combined);
                    this.updateGridMatrix();
                });
            }
        });
    }

    handleAddReservation(row: number, col: number): void {
        // Hide context menu first
        this.showReservationForm.set(false);
        
        // Get the actual house based on the filtered list
        const houses = this.filteredHouses();
        const days = this.days();
        
        if (houses.length > row && days.length > col) {
            const house = houses[row];
            
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
                endDate = new Date(days[endCol]);
            } else {
                // Single cell selection - use default behavior
                startDate = new Date(days[col]);
                endDate = new Date(days[col]);
            }
            
            // Open the reservation form with the selected dates
            this.openReservationForm(house, startDate, endDate);
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
        
        if (isEditing) {
            // We're updating an existing reservation
            
            // Create an updated reservation with the new values
            const updatedReservation: HouseAvailability = {
                ...reservation,
                // Use the formatted dates from the form data
                house_availability_start_date: formattedStartDate,
                house_availability_end_date: formattedEndDate,
                reservation_length: this.calculateDaysBetween(startDate, endDate) + 1 // Include both start and end date
            };
            
            // Hide the form immediately for better UX
            this.showReservationForm.set(false);
            
            // Then send to backend using the updateHouseAvailability method
            this.dataService.updateHouseAvailability(updatedReservation).subscribe({
                next: (savedReservation: HouseAvailability | null) => {
                    // Force a complete reload of all availabilities to ensure we have the latest data
                    forkJoin({
                        temp: this.dataService.loadTempHouseAvailabilities(),
                        main: this.dataService.loadHouseAvailabilities(),
                    }).subscribe( ({temp, main}) => {
                        const combined = [...main, ...temp];
                        this.houseAvailabilities.set(combined);
                        this.updateGridMatrix();
                    });
                },
                error: (error: any) => {
                    console.error("Error updating reservation:", error);
                    // Force a reload anyway to ensure we have consistent data
                    forkJoin({
                        temp: this.dataService.loadTempHouseAvailabilities(),
                        main: this.dataService.loadHouseAvailabilities(),
                    }).subscribe( ({temp, main}) => {
                        const combined = [...main, ...temp];
                        this.houseAvailabilities.set(combined);
                        this.updateGridMatrix();
                    });
                }
            });
        } else {
            // We're creating a new reservation
            
            // Create a new reservation using the dates directly from the form
            const newReservation: HouseAvailability = {
                ...reservation,
                house_availability_id: Math.floor(Math.random() * 100000) + 10000000, // Use a very large temporary ID
                // Use the formatted dates from the form data
                house_availability_start_date: formattedStartDate,
                house_availability_end_date: formattedEndDate,
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
            
            // Hide the form immediately for better UX
            this.showReservationForm.set(false);

            // Then send to backend using the DataService method
            this.dataService.saveHouseAvailability(newReservation).subscribe({
                next: (savedReservation: HouseAvailability | null) => {
                    forkJoin({
                        temp: this.dataService.loadTempHouseAvailabilities(),
                        main: this.dataService.loadHouseAvailabilities(),
                    }).subscribe( ({temp, main}) => {
                        const combined = [...main, ...temp];
                        this.houseAvailabilities.set(combined);

                        setTimeout(() => {
                            this.updateGridMatrix();
                        }, 300);
                    });
                },
                error: (error: any) => {
                    console.error("Error saving reservation:", error);
                    // Force a reload anyway to ensure we have consistent data
                    this.dataService.loadHouseAvailabilities().subscribe(freshData => {
                        forkJoin({
                            temp: this.dataService.loadTempHouseAvailabilities(),
                            main: this.dataService.loadHouseAvailabilities(),
                        }).subscribe( ({temp, main}) => {
                            const combined = [...main, ...temp];
                            this.houseAvailabilities.set(combined);
                            this.updateGridMatrix();
                        });
                    });
                }
            });
        }
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
    hasCellReservation(row: number, col: number): boolean {
        // Make sure we don't go out of bounds
        if (row < 0 || col < 0) return false;
        
        // Check if the grid matrix is initialized
        const grid = this.gridMatrix();
        if (!grid || grid.length === 0) return false;
        
        // Make sure row and column are within grid bounds
        if (row >= grid.length) return false;
        
        const rowData = grid[row];
        if (!rowData || col >= rowData.length) return false;
        
        // Now we can safely check if the cell has a reservation
        return rowData[col]?.isReserved === true;
    }

    // Add method to filter houses by type
    private filterHousesByType(): House[] {
        const houses = this.houses();
        const selectedTypeId = this.selectedHouseTypeId();
        
        // Filter houses by the selected type
        const filteredHouses = houses.filter(house => house.house_type_id === selectedTypeId);
        const dummyHouses = this.tempHouses.filter(th => th.house_type_id == selectedTypeId);
        
        for (let i = 0; i < dummyHouses.length; i++) {
            filteredHouses.push(dummyHouses[i]);
        }
        
        return filteredHouses;
    }

    // Method to scroll to today's date in the table
    scrollToToday(): void {
        setTimeout(() => {
            // Find the column that represents today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Find today's column index
            const todayIndex = this.days().findIndex(day => {
                const d = new Date(day);
                d.setHours(0, 0, 0, 0);
                return d.getTime() === today.getTime();
            });
            
            if (todayIndex >= 0) {
                // Get all day header cells
                const dayHeaders = document.querySelectorAll('.day-header');
                if (dayHeaders.length > todayIndex) {
                    const todayHeader = dayHeaders[todayIndex] as HTMLElement;
                    
                    // Calculate the position to scroll to (center the column)
                    const tableContainer = document.querySelector('.table-container');
                    if (tableContainer) {
                        const containerWidth = tableContainer.clientWidth;
                        const columnPosition = todayHeader.offsetLeft;
                        const columnWidth = todayHeader.offsetWidth;
                        
                        // Scroll to position the today column in the middle
                        const scrollLeft = columnPosition - (containerWidth / 2) + (columnWidth / 2);
                        tableContainer.scrollLeft = scrollLeft > 0 ? scrollLeft : 0;
                    }
                }
            }
        }, 100); // Small delay to ensure the DOM is fully rendered
    }
    
    // Updated method for setting house type that doesn't trigger scrolling to today
    setSelectedHouseType(typeId: number): void {
        if (this._previousHouseTypeId !== typeId && typeId !== null) {
            this._previousHouseTypeId = typeId;
            this.selectedHouseTypeId.set(typeId);
            
            // Update the grid matrix with new filtered data
            this.updateGridMatrix();
            
            // Only scroll to today if this is the first load
            if (this.isFirstLoad) {
                this.scrollToToday();
                this.isFirstLoad = false;
            }
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

    // Check if a date is before today (in the past)
    isDateInPast(date: Date): boolean {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset hours to get just the date
        
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0); // Reset hours for fair comparison
        
        return checkDate < today;
    }

    // Check if a cell's date is in the past
    isCellInPast(col: number): boolean {
        const days = this.days();
        if (col < 0 || col >= days.length) return false;
        
        return this.isDateInPast(days[col]);
    }

    moveReservation(row: number, col: number){
        if(!this.reservationToMove) return;

        const reservationLength = this.getSelectedReservationLength(this.reservationToMove);
        const selectedHouse = this.filteredHouses()[row];
        const selectedDay = this.days()[col];

        const endDate = new Date(selectedDay);
        endDate.setDate(endDate.getDate() + reservationLength - 1)

        const houseToMove = this.houses().find(house => house.house_id == this.reservationToMove.house_id);
        const dayToMove = this.reservationToMove.house_availability_start_date;

        this.confirmationService.confirm({
            header: this.translateService.instant('RESERVATIONS.MODAL.MOVE-RESERVATION'),
            message: this.translateService.instant('RESERVATIONS.MESSAGES.CONFIRM-MOVE-RESERVATION', {
                name: this.reservationToMove.last_name || 'Guest',
                old_house_number: houseToMove?.house_number || 'N/A',
                old_start_date: this.datePipe.transform(dayToMove, 'dd.MM'),
                new_house_number: selectedHouse?.house_number || 'N/A',
                new_start_date: this.datePipe.transform(selectedDay, 'dd.MM')
            }),
            icon: 'pi pi-exclamation-triangle',
            rejectLabel: 'Cancel',
            rejectButtonProps: {
                label: this.translateService.instant('BUTTONS.CANCEL'),
                severity: 'secondary',
                outlined: true
            },
            acceptButtonProps: {
                label: this.translateService.instant('BUTTONS.CONFIRM'),
                severity: 'danger'
            },
            accept: async () => {
                const reservationCopy = { 
                    ...this.reservationToMove,
                    house_id: selectedHouse.house_id,
                    house_availability_start_date: selectedDay.toLocaleDateString('en-CA').split('T')[0],
                    house_availability_end_date: endDate.toLocaleDateString('en-CA').split('T')[0],
                };

                //ne moze update jer je nekad temp_house_availability, a nekad house_availability, zato ide delete pa create novi
                try {
                    const deleted = await firstValueFrom(
                        this.dataService.deleteHouseAvailability(
                            this.reservationToMove.house_availability_id,
                            this.reservationToMove.house_id
                        )
                    );

                    if (deleted) {
                        const saved = await firstValueFrom(
                            this.dataService.saveHouseAvailability(reservationCopy)
                        );

                        if (saved) {
                            this.clearAvailableSpaces();
                        }
                    }
                } catch (error) {
                    console.error('Error while moving reservation:', error);
                    this.clearAvailableSpaces();
                }
            },
            reject: () => {
                this.messageService.add({ severity: 'warn', summary: this.translateService.instant('APP-LAYOUT.TASK-DETAILS.MESSAGES.CANCELLED'), detail: this.translateService.instant('APP-LAYOUT.TASK-DETAILS.MESSAGES.REMOVE-IMAGE.CANCELLED') });
                this.clearAvailableSpaces();
            }
        });
    }

    // Handle mouse down on a cell to start selection
    onCellMouseDown(event: MouseEvent, row: number, col: number): void {
        if(this.isSpotAvailable(row, col)){
            this.moveReservation(row, col);
            return;
        }

        this.clearAvailableSpaces();

        // Only allow selection on cells that don't have reservations
        if (this.hasCellReservation(row, col)) {
            return;
        }
        
        // Don't allow selecting dates in the past
        if (this.isCellInPast(col)) {
            return;
        }
        
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
            // Check if the current cell has a reservation
            if (this.hasCellReservation(row, col)) {
                // If so, don't extend the selection to include it
                return;
            }
            
            // Don't allow extending selection to dates in the past
            if (this.isCellInPast(col)) {
                return;
            }
            
            // Check if there are any reservations between the start and this cell
            const startCol = this.selectedStartColIndex();
            const minCol = Math.min(startCol, col);
            const maxCol = Math.max(startCol, col);
            
            // Check if any cells in the potential range have reservations or are in the past
            for (let checkCol = minCol; checkCol <= maxCol; checkCol++) {
                if (this.hasCellReservation(row, checkCol) || this.isCellInPast(checkCol)) {
                    // If a reservation or past date is found in the range, limit the selection
                    if (col > startCol) {
                        // Moving right - limit to the column before the reservation/past date
                        let lastValidCol = startCol;
                        for (let c = startCol + 1; c < checkCol; c++) {
                            if (!this.hasCellReservation(row, c) && !this.isCellInPast(c)) {
                                lastValidCol = c;
                            }
                        }
                        this.selectedEndColIndex.set(lastValidCol);
                    } else {
                        // Moving left - limit to the column after the reservation/past date
                        let lastValidCol = startCol;
                        for (let c = startCol - 1; c > checkCol; c--) {
                            if (!this.hasCellReservation(row, c) && !this.isCellInPast(c)) {
                                lastValidCol = c;
                            }
                        }
                        this.selectedEndColIndex.set(lastValidCol);
                    }
                    return;
                }
            }
            
            // If no issues found in the range, update normally
            this.selectedEndColIndex.set(col);
        }
    }

    // Handle regular cell click
    onCellClick(event: MouseEvent, row: number, col: number): void {
        // If the cell has a reservation, don't allow selection
        if (this.hasCellReservation(row, col)) {
            // Maybe do something different for reserved cells, like showing details
            return;
        }
        
        // Don't allow selecting dates in the past
        if (this.isCellInPast(col)) {
            return;
        }
        
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

    // Handle mouse up to end selection
    @HostListener('document:mouseup')
    onDocumentMouseUp(): void {
        setTimeout(() => {
            if (this.isSelecting()) {
                this.isSelecting.set(false);

                const dateRange = this.getSelectedDateRange();
                if (dateRange && this.selectedCellRowIndex() >= 0) {
                    const houses = this.filteredHouses();
                    const row = this.selectedCellRowIndex();

                    if (houses.length > row) {
                        const house = houses[row];
                        this.openReservationForm(house, dateRange.startDate, dateRange.endDate);
                    }
                }
            }
        });
    }

    // Helper method to open the reservation form with given dates
    private openReservationForm(house: House, startDate: Date, endDate: Date): void {
        // First make sure we reset any previous state
        this.editingReservation.set({});
        
        // Create new date objects to avoid reference issues
        const formStartDate = new Date(startDate);
        const formEndDate = new Date(endDate);
        
        // Reset the time components to avoid timezone issues
        formStartDate.setHours(0, 0, 0, 0);
        formEndDate.setHours(0, 0, 0, 0);
        
        // Additional validation for start date being today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (formStartDate.getTime() === today.getTime()) {
            // Double check that we have a valid today's date
            const todayCopy = new Date();
            todayCopy.setHours(0, 0, 0, 0);
            this.selectedStartDate.set(todayCopy);
        } else {
            // Normal case
            this.selectedStartDate.set(formStartDate);
        }
        
        // Set other form data
        this.selectedHouseId.set(house.house_id);
        this.selectedEndDate.set(formEndDate);
        
        // Check for next reservation to limit end date
        this.updateNextReservationDate();
        
        // Convert dates to string format for the reservation object
        const startDateString = this.formatDateToYYYYMMDD(formStartDate);
        const endDateString = this.formatDateToYYYYMMDD(formEndDate);
        
        // Check if there's a upcoming reservation that would limit the end date
        const nextReservation = this.findNextReservation(house.house_id, formStartDate);
        if (nextReservation) {
            const nextStartDate = new Date(nextReservation.house_availability_start_date);
            nextStartDate.setHours(0, 0, 0, 0);
            
            // If the default end date would overlap, adjust it
            if (formEndDate >= nextStartDate) {
                // Set end date to the day before the next reservation
                const adjustedEndDate = new Date(nextStartDate);
                adjustedEndDate.setDate(adjustedEndDate.getDate() - 1);
                this.selectedEndDate.set(adjustedEndDate);
            }
        }
        
        // Use setTimeout to help avoid event listener errors with the calendar component
        setTimeout(() => {
            this.editingReservation.set({
                house_id: house.house_id,
                house_availability_start_date: startDateString, // Use the string version
                house_availability_end_date: endDateString, // Use the string version
                color_theme: Math.floor(Math.random() * 10), // Random color theme
                color_tint: 0.5, // Default tint
                adults: 2, // Default values
                babies: 0,
                cribs: 0,
                has_arrived: false,
                has_departed: false,
                prev_connected: false,
                next_connected: false,
                dogs_b: 0,
                dogs_d: 0,
                dogs_s: 0,
            });
            
            // Show the form
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
        }, 0);
        
        // Clear selection after using it
        this.clearSelection();
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

    // Clear selection
    private clearSelection(): void {
        this.selectedCellRowIndex.set(-1);
        this.selectedStartColIndex.set(-1);
        this.selectedEndColIndex.set(-1);
    }

    // Handle click on a reservation cell
    onReservationCellClick(event: MouseEvent, row: number, col: number): void {
        // Stop propagation to prevent other click handlers
        event.stopPropagation();
        
        // Check if the cell is actually a reservation
        const grid = this.gridMatrix();
        if (!grid || grid.length <= row || !grid[row] || grid[row].length <= col) {
            return;
        }
        
        const cellData = grid[row][col];
        if (!cellData || !cellData.isReserved) {
            return;
        }
        
        // Find the reservation for this cell
        const houses = this.filteredHouses();
        const days = this.days();
        
        if (houses.length > row && days.length > col) {
            const house = houses[row];
            const day = days[col];
            
            const key = this.getReservationKey(house.house_id, day);
            const reservation = this.reservationMap.get(key);
            
            if (reservation) {
                // Set or clear selected reservation highlight
                if (this.selectedReservationId() === reservation.house_availability_id) {
                    this.selectedReservationId.set(null);
                } else {
                    this.selectedReservationId.set(reservation.house_availability_id);
                }
                
                // Now also open the edit form for this reservation
                this.handleEditReservation(row, col);
            }
        }
    }

    // Check if a cell is part of the currently selected reservation
    isCellInSelectedReservation(row: number, col: number): boolean {
        const selectedId = this.selectedReservationId();
        if (selectedId === null) {
            return false;
        }
        
        const grid = this.gridMatrix();
        // If we don't have grid data yet, return false
        if (!grid || grid.length <= row || !grid[row] || grid[row].length <= col) {
            return false;
        }
        
        // First, check if this cell is reserved at all
        if (!grid[row][col].isReserved) {
            return false;
        }
        
        const houses = this.filteredHouses();
        const days = this.days();
        
        if (houses.length > row && days.length > col) {
            const house = houses[row];
            const day = days[col];
            
            const key = this.getReservationKey(house.house_id, day);
            const reservation = this.reservationMap.get(key);
            
            return reservation?.house_availability_id === selectedId;
        }
        
        return false;
    }

    // Add a method to manually refresh the data
    manualRefresh(): void {
        // Reload house availabilities from the database
        this.dataService.loadHouseAvailabilities().subscribe({
            next: (freshData) => {
                forkJoin({
                    temp: this.dataService.loadTempHouseAvailabilities(),
                    main: this.dataService.loadHouseAvailabilities(),
                }).subscribe( ({temp, main}) => {
                    const combined = [...main, ...temp];
                    this.houseAvailabilities.set(combined);
                    this.updateGridMatrix();
                });
            },
            error: (error) => {
                console.error("Error reloading availabilities:", error);
            }
        });
    }

    changeCellHeight(cellHeightInPx: number){
        this.cellHeightInPx = cellHeightInPx;
        localStorage.setItem('portonReservationsCellHeight', JSON.stringify(cellHeightInPx));
    }

    loadCellHeight(){
        let cellHeight = localStorage.getItem('portonReservationsCellHeight');

        if(!cellHeight) {
            this.cellHeightInPx = 30;
        } else {
            this.cellHeightInPx = parseInt(cellHeight);
        }
    }
}