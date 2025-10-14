import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { House, HouseAvailability, Task, TaskType, HouseType } from '../../core/models/data.models';
import { combineLatest, Subject, takeUntil } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { signal } from '@angular/core';
import { TaskService } from '../../core/services/task.service';
import { HouseService } from '../../core/services/house.service';
import { InputTextModule } from 'primeng/inputtext';
import { TranslateModule } from '@ngx-translate/core';
import { LayoutService } from '../../layout/services/layout.service';
import { ChartComponent } from '../statistics/chart.component';
import { DataService } from '../../core/services/data.service';
import { nonNull } from '../../shared/rxjs-operators/non-null';
import { StatisticsService } from '../../core/services/statistics.service';
import { HouseCardComponent } from './house-card/house-card.component';

// Define the special location option interface
interface SpecialLocation {
    name: string;
    type: string;
}

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [
        CommonModule, 
        CardModule, 
        ButtonModule, 
        DialogModule, 
        DropdownModule, 
        FormsModule,
        InputTextModule,
        TranslateModule,
        ChartComponent,
        HouseCardComponent,
    ],
    template: `
        <div class="home-container" (click)="handleContainerClick($event)">
            <div class="legend-container">
                <div class="legend-wrapper">
                    <div class="legend-items">
                        <div class="legend-item"><span class="legend-color legend-green"></span> {{ 'HOME.HOUSE-STATUS.FREE' | translate }} ({{ 'HOME.HOUSE-STATUS.CLEANED' | translate }}) </div>
                        <div class="legend-item"><span class="legend-color legend-yellow"></span> {{ 'HOME.HOUSE-STATUS.FREE' | translate }} ({{ 'HOME.HOUSE-STATUS.NOT-CLEANED' | translate }}) </div>
                        <div class="legend-item"><span class="legend-color legend-red"></span> {{ 'HOME.HOUSE-STATUS.OCCUPIED' | translate }} </div>
                        <div class="legend-item"><span class="legend-color legend-lightred"></span> {{ 'HOME.HOUSE-STATUS.ARRIVAL-DAY' | translate }} ({{ 'HOME.HOUSE-STATUS.CLEANED' | translate }}) </div>
                    </div>
                    <div class="house-controls">
                        <div class="search-container">
                            <input 
                                type="text" 
                                pInputText 
                                class="w-full"
                                [placeholder]="'HOME.SEARCH.SEARCH-HOUSES' | translate" 
                                [(ngModel)]="searchTerm"
                                (input)="applyFilters()">
                        </div>
                        <div class="sort-buttons">
                            <p-button 
                                [outlined]="sortType !== 'number'"
                                [raised]="sortType === 'number'"
                                icon="pi pi-sort-numeric-up" 
                                [label]="'HOME.SEARCH.BY-NUMBER' | translate"
                                (onClick)="sortBy('number')"
                                styleClass="p-button-sm">
                            </p-button>
                            <p-button 
                                [outlined]="sortType !== 'type'"
                                [raised]="sortType === 'type'"
                                icon="pi pi-sort-alpha-up" 
                                [label]="'HOME.SEARCH.BY-TYPE' | translate"
                                (onClick)="sortBy('type')"
                                styleClass="p-button-sm">
                            </p-button>
                            <p-button 
                                [outlined]="sortType !== 'status'"
                                [raised]="sortType === 'status'"
                                icon="pi pi-filter"
                                [label]="'HOME.SEARCH.BY-STATUS' | translate"
                                (onClick)="sortBy('status')"
                                styleClass="p-button-sm">
                            </p-button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="houses-container">
                <div class="house-grid">
                    @if (sortType == 'number' || !sortType) {
                        @for (house of filteredHouses(); track house.house_id) {
                            <app-house-card
                                [house]="house"
                                [houseAvailabilities]="houseAvailabilities"
                                [expandedHouseId]="expandedHouseId"
                                [isUrgentIconVisibleMap]="isUrgentIconVisibleMap"
                            ></app-house-card>
                        }
                    } @else if (sortType == 'type') {
                        @for (group of groupedHouses(); track group.type.house_type_id) {
                            <div class="type-divider">{{ group.type.house_type_name }}</div>
                            @for (house of group.houses; track house.house_id) {
                                <app-house-card
                                    [house]="house"
                                    [houseAvailabilities]="houseAvailabilities"
                                    [expandedHouseId]="expandedHouseId"
                                    [isUrgentIconVisibleMap]="isUrgentIconVisibleMap"
                                ></app-house-card>
                            }
                        }
                    } @else if(sortType == 'status'){
                        @for (group of groupedHousesByStatus(); track group.status) {
                            <div class="type-divider">
                                {{ ('HOME.HOUSE-STATUS.' + group.status) | translate }}
                                <span class="houses-count">
                                    {{group.houses.length}}
                                </span>
                            </div> 
                            @for (house of group.houses; track house.house_id) {
                                <app-house-card
                                    [house]="house"
                                    [houseAvailabilities]="houseAvailabilities"
                                    [expandedHouseId]="expandedHouseId"
                                    [isUrgentIconVisibleMap]="isUrgentIconVisibleMap"
                                ></app-house-card>
                            }
                        }
                    }
                </div>
            </div>

            <div class="statistics-container">
                <div class="chart-row">
                    @for(chart of pinnedCharts; track chart){
                        <div class="pinned-container">
                            <app-chart
                                [title]="chart.title"
                                [dataType]="chart.dataType"
                                [canSelectDiagramType]="chart.canSelectDiagramType"
                                [periods]="chart.periods"
                                [metrics]="chart.metrics"
                                [metricFields]="chart.metricFields"
                                [isPinnableToHome]="chart.isPinnableToHome"
                                [chartTypes]="chart.chartTypes"
                            ></app-chart>
                        </div>
                    }
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            :host ::ng-deep .sort-buttons .p-button {
                height: 30px !important;
            }

            .home-container {
                display: flex;
                flex-direction: column;
                gap: 10px;
                position: relative;

                .legend-container {
                    padding: 0.8rem 1rem;
                    background-color: var(--surface-card);
                    border-radius: 6px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    
                    .legend-wrapper {
                        display: flex;
                        flex-direction: row;
                        gap: 1rem;
    
                        .legend-items {
                            display: flex;
                            flex-wrap: wrap;
                            justify-content: center;
                            gap: 1rem;
    
                            .legend-item {
                                display: flex;
                                align-items: center;
                                gap: 0.5em;
                                font-size: 0.9em;
                                white-space: nowrap;
    
                                .legend-color {
                                    display: inline-block;
                                    width: 16px;
                                    height: 16px;
                                    border-radius: 4px;
                                    margin-right: 0.3em;
                                    border: 1px solid #bbb;
                                }
                                
                                .legend-green { background: var(--p-green-600, #22c55e); }
                                .legend-yellow { background: var(--p-yellow-400, #fde047); }
                                .legend-red { background: var(--p-red-600, #ef4444); }
                                .legend-lightred { background: var(--p-red-400, #f87171); }
                            }
                        }
    
                        .house-controls {
                            display: flex;
                            flex-direction: row;
                            flex-wrap: wrap;
                            justify-content: center;
                            gap: 1rem;

                            .search-container {
                                flex: 1;
                                min-width: 200px;
                                max-width: 300px;
                                display: flex;
                            }
                            
                            .sort-buttons {
                                display: flex;
                                gap: 0.5rem;
                                align-items: center;
                            }
                        }
                    }
                }
                
                .houses-container {
                    background-color: var(--surface-card);
                    border-radius: 6px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    width: 100%;
                    box-sizing: border-box;
                    padding: 15px;
    
                    .house-grid {
                        display: grid;
                        grid-template-columns: repeat(6, 1fr);
                        gap: 0.5rem;
                        padding: 0;
                        position: relative;
                        padding-bottom: 20px;

                        .type-divider {
                            grid-column: 1 / -1;
                            margin: 0.75rem 0 0.25rem;
                            padding: 0 0 0 0.25rem;
                            font-weight: 700;
                            font-size: 0.95rem;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
            
                            .houses-count{
                                display: inline-flex;
                                align-items: center;
                                justify-content: center;
                                width: 22px;
                                height: 22px;
                                background: var(--primary-color);
                                color: var(--primary-color-text);
                                border-radius: 50px;
                                font-size: 12px;
                                font-weight: 700;
                            }
                        }
                    }
                }
                
                .statistics-container{
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    background-color: transparent;
                    align-items: start;
                    gap: 10px;
                    margin-bottom: 20px;
    
                    .chart-row {
                        display: flex;
                        flex-direction: row;
                        width: 100%;
                        gap: 10px;
                        min-width: 0;
    
                        .pinned-container {
                            flex: 1 1 45%;
                            min-width: 0;      
                            max-width: 100%;  
                            height: 900px;
                            background-color: var(--surface-card);
                            border-radius: 10px;
                            padding: 20px;
                            box-sizing: border-box;
                            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                            overflow: hidden;
                        }
                    }
                }

                @media screen and (max-width: 1700px){
                    .statistics-container {
                        .chart-row {
                            flex-direction: column;
                        }
                    }
                }

                @media screen and (max-width: 1200px) {
                    .houses-container{
                        .house-grid {
                            grid-template-columns: repeat(4, 1fr);
                        }
                    }
                }

                @media screen and (min-width: 992px) {
                    .legend-wrapper {
                        flex-direction: row;
                        justify-content: space-between;
                        align-items: center;

                        .legend-items {
                            justify-content: flex-start;
                        }
                    }
                    
                    .house-controls {
                        justify-content: flex-end;

                        .search-container {
                            max-width: 250px;
                        }
                    }
                    
                }
                
                @media screen and (max-width: 767px) {
                    .legend-container {
                        padding: 0.6rem;

                        .legend-wrapper{
                            .legend-items {
                                flex-direction: column;
                                align-items: flex-start;
                                gap: 0.4rem;
        
                                .legend-item {
                                    font-size: 0.85em;
                                }
                            }
                        }
                    }

                    .houses-container{
                        .house-grid {
                            grid-template-columns: repeat(2, 1fr);
                        }
                    }
                    
                    .house-controls {
                        align-items: stretch;

                        .search-container {
                            max-width: none;
                        }
                        
                        .sort-buttons {
                            justify-content: center;
                        }
                    }
                }
    
                :host ::ng-deep .p-button.p-button-sm {
                    font-size: 0.875rem;
                    padding: 0.4rem 0.75rem;
                }
                
                :host ::ng-deep .p-button.p-button-sm .p-button-icon {
                    font-size: 0.875rem;
                }
            }
        `
    ]
})
export class Home implements OnInit, OnDestroy {
    houses = signal<House[]>([]);
    filteredHouses = signal<House[]>([]);
    houseAvailabilities = signal<HouseAvailability[]>([]);
    houseTypes = signal<HouseType[]>([]);
    expandedHouseId: number | null = null;
    currentReservationIndex = new Map<number, number>();
    
    searchTerm: string = '';
    sortType: 'number' | 'type' | 'status' | null = 'number';
    
    // Group houses by type for divider display
    groupedHouses = signal<{ type: HouseType; houses: House[] }[]>([]);
    groupedHousesByStatus = signal<{ status: string; houses: House[] }[]>([]);

    specialLocations: SpecialLocation[] = [
        { name: 'Zgrada', type: 'building' },
        { name: 'Parcela', type: 'parcel' }
    ];

    locationOptions: (House | SpecialLocation)[] = [];

    isOccupancyChartVisible: boolean = false; 
    occupancyMetrics = [
        { name: 'Occupancy', value: 'occupancy' },
    ]

    // Form fields
    selectedLocation: House | SpecialLocation | null = null;
    selectedHouse: House | null = null;
    faultDescription: string = '';
    locationType: string = 'house';

    // Form fields for Unscheduled task
    selectedLocationForTask: House | SpecialLocation | null = null;
    selectedHouseForTask: House | null = null;
    locationTypeForTask: string = 'house';
    selectedTaskType: TaskType | null = null;
    taskDescription: string = '';
    tasks: Task[] = [];

    isUrgentIconVisibleMap: { [taskId: number]: boolean } = {};

    pinnedCharts: any[] = [];

    private destroy$ = new Subject<void>();

    constructor(
        private dataService: DataService,
        public taskService: TaskService,
        public houseService: HouseService,
        private layoutService: LayoutService,
        private statisticsService: StatisticsService,
    ) {}

    ngOnInit(): void {
        this.monitorChartRemovals();
        this.loadPinnedCharts();
        this.monitorTasksAndUrgentIcons();
        this.subscribeToDataStreams();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private monitorChartRemovals() {
        this.layoutService.$chartToRemove
        .pipe(takeUntil(this.destroy$))
        .subscribe(chartToRemove => {
            this.pinnedCharts = this.pinnedCharts.filter(pinnedChart => pinnedChart.dataType !== chartToRemove);
        });
    }

    private monitorTasksAndUrgentIcons() {
        combineLatest([
            this.dataService.tasks$.pipe(nonNull()),
            this.taskService.isUrgentIconVisible$
        ])
        .pipe(takeUntil(this.destroy$))
        .subscribe(([tasks, visible]) => {
            this.tasks = tasks;
            this.isUrgentIconVisibleMap = {};
            this.setUrgentIconsMap(visible);
        });
    }

    private subscribeToDataStreams() {
        combineLatest([
            this.dataService.houseAvailabilities$.pipe(nonNull()),
            this.dataService.houseTypes$.pipe(nonNull()),
            this.dataService.houses$.pipe(nonNull()),
        ])
        .pipe(takeUntil(this.destroy$))
        .subscribe(([availabilities, houseTypes, houses]) => {
            this.houseAvailabilities.set(availabilities);
            this.houseTypes.set(houseTypes);

            const filteredHouses = houses.filter(h => h.house_number > 0);
            this.houses.set(filteredHouses);
            this.filteredHouses.set(filteredHouses);

            this.updateLocationOptions();
            this.applyFilters();
        });
    }

    setUrgentIconsMap(visible: boolean){
        this.tasks.forEach(task => {
            if (task.is_unscheduled) {
                this.isUrgentIconVisibleMap[task.task_id] = visible;
            }
        });
    }

    loadPinnedCharts(){
        const pinnedChartsNames = this.layoutService.loadPinnedCharts();
        this.pinnedCharts = this.statisticsService.charts.filter(c => pinnedChartsNames.some((pc: any) => pc == c.dataType))
    }

    @HostListener('document:click', ['$event'])
    handleDocumentClick(event: MouseEvent) {
        // Check if click is outside any house card and expanded content
        const clickedElement = event.target as HTMLElement;
        if (!clickedElement.closest('.house-card') && !clickedElement.closest('.expanded-content')) {
            this.expandedHouseId = null;
        }
    }

    handleContainerClick(event: Event) {
        // Prevent document click listener from handling container clicks
        event.stopPropagation();
    }

    handleExpandedContentClick(event: Event) {
        // Prevent the click from bubbling up to the house card
        event.stopPropagation();
    }

    toggleExpand(event: Event, houseId: number) {
        event.stopPropagation();
        // If clicking the same card, toggle it. If clicking a different card, switch to it.
        this.expandedHouseId = this.expandedHouseId === houseId ? null : houseId;
        if (this.expandedHouseId === houseId) {
            // Initialize or reset the current reservation index when expanding
            this.currentReservationIndex.set(houseId, this.getCurrentReservationIndex(houseId));
        }
    }

    // Handle location change in fault report dialog
    onLocationChange(event: any) {
        const selection = event.value;
        if (selection && 'type' in selection) {
            // This is a special location
            this.locationType = selection.type;
            this.selectedHouse = null;
        } else {
            // This is a house
            this.locationType = 'house';
            this.selectedHouse = selection;
        }
    }

    // Handle location change in Unscheduled task dialog
    onLocationChangeForTask(event: any) {
        const selection = event.value;
        if (selection && 'type' in selection) {
            // This is a special location
            this.locationTypeForTask = selection.type;
            this.selectedHouseForTask = null;
        } else {
            // This is a house
            this.locationTypeForTask = 'house';
            this.selectedHouseForTask = selection;
        }
    }

    getCurrentReservationIndex(houseId: number): number {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const allSlots = this.getSortedReservationsWithGaps(houseId);
        const index = allSlots.findIndex((slot) => {
            if (slot.isGap) return false;

            const startDate = new Date(slot.startDate);
            const endDate = new Date(slot.endDate!);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);

            // If today is the start date or within the reservation period
            return (startDate.getTime() === today.getTime() || today > startDate) && today <= endDate;
        });

        return index;
    }

    getSortedReservations(houseId: number): HouseAvailability[] {
        return this.houseAvailabilities()
            .filter((availability) => availability.house_id === houseId)
            .sort((a, b) => new Date(a.house_availability_start_date).getTime() - new Date(b.house_availability_start_date).getTime());
    }

    getSortedReservationsWithGaps(houseId: number): { isGap: boolean; startDate: Date; endDate: Date | null; nextStartDate: Date | null }[] {
        const reservations = this.getSortedReservations(houseId);
        const result: { isGap: boolean; startDate: Date; endDate: Date | null; nextStartDate: Date | null }[] = [];

        // If we have no reservations, return empty array
        if (reservations.length === 0) {
            return result;
        }

        // Add initial gap if first reservation is in the future
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const firstReservation = reservations[0];
        const firstStart = new Date(firstReservation.house_availability_start_date);
        firstStart.setHours(0, 0, 0, 0);

        // Only add initial gap if first reservation starts after today
        if (firstStart.getTime() > today.getTime()) {
            result.push({
                isGap: true,
                startDate: today,
                endDate: new Date(firstStart),
                nextStartDate: firstStart
            });
        }

        for (let i = 0; i < reservations.length; i++) {
            const current = reservations[i];
            const next = reservations[i + 1];

            // Add current reservation
            result.push({
                isGap: false,
                startDate: new Date(current.house_availability_start_date),
                endDate: new Date(current.house_availability_end_date),
                nextStartDate: null
            });

            // Check for gap between current and next reservation
            if (next) {
                const currentEnd = new Date(current.house_availability_end_date);
                const nextStart = new Date(next.house_availability_start_date);

                // Add one day to currentEnd to check for immediate consecutive dates
                currentEnd.setDate(currentEnd.getDate() + 1);

                if (currentEnd.getTime() < nextStart.getTime()) {
                    // There's a gap
                    result.push({
                        isGap: true,
                        startDate: currentEnd,
                        endDate: new Date(nextStart),
                        nextStartDate: nextStart
                    });
                }
            }
        }

        return result;
    }

    getCurrentReservationDates(houseId: number): string {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const allSlots = this.getSortedReservationsWithGaps(houseId);
        const currentIndex = this.currentReservationIndex.get(houseId) ?? this.getCurrentReservationIndex(houseId);

        if (allSlots.length === 0) {
            return '----- - -----';
        }

        // If showing initial empty state (index is -1)
        if (currentIndex === -1) {
            // Find the next upcoming reservation or gap
            const nextSlot = allSlots.find((slot) => {
                if (slot.isGap) {
                    return slot.startDate > today;
                }
                return slot.startDate > today;
            });

            const prevSlot = allSlots
                .filter(slot => slot.endDate && slot.endDate < today) // slots that ended before today
                .reduce((prev, curr) => {
                    if (!prev) return curr; // first candidate
                    // pick the one with the latest endDate before today
                    return curr.endDate! > prev.endDate! ? curr : prev;
                }, undefined as typeof allSlots[0] | undefined);

            if (nextSlot) {
                const formatDate = (date: Date) => `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.`;
                if (nextSlot.isGap) {
                    // For gaps, also add one day to end date
                    const endDatePlusOne = new Date(nextSlot.endDate!);
                    endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
                    return `${formatDate(nextSlot.startDate)} - ${formatDate(endDatePlusOne)}`;
                } else {
                    if(prevSlot?.endDate){
                        prevSlot.endDate.setDate(prevSlot.endDate.getDate() + 1);
                        
                        return `${formatDate(prevSlot.endDate)} - ${formatDate(nextSlot.startDate)}`;
                    } else {
                        return `----- - ${formatDate(nextSlot.startDate)}`;
                    }
                }
            }
            return '----- - -----';
        }

        const slot = allSlots[currentIndex];
        const formatDate = (date: Date) => `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.`;

        if(!slot.endDate){
            return `${formatDate(slot.startDate)} - ----- - -----`;
        }

        if (slot.isGap) {
            return `${formatDate(slot.startDate)} - ${formatDate(slot.endDate)}`;
        } else {
            const nextDay = new Date(slot.endDate);
            nextDay.setDate(nextDay.getDate() + 1);
            return `${formatDate(slot.startDate)} - ${formatDate(nextDay)}`;
        }
    }

    navigateReservation(houseId: number, direction: 'prev' | 'next') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const allSlots = this.getSortedReservationsWithGaps(houseId);
        let currentIndex = this.currentReservationIndex.get(houseId);

        // If we don't have a current index, initialize based on current state
        if (currentIndex === undefined) {
            currentIndex = this.getCurrentReservationIndex(houseId);
        }

        // If we're showing empty state (-1) and going next, start from the first upcoming slot
        if (currentIndex === -1 && direction === 'next') {
            const nextIndex = allSlots.findIndex((slot) => {
                if (slot.isGap) {
                    return slot.startDate > today;
                }
                return slot.startDate > today;
            });
            if (nextIndex !== -1) {
                this.currentReservationIndex.set(houseId, nextIndex);
            }
            return;
        } else if (currentIndex === -1 && direction == 'prev'){
            const prevIndex = allSlots
                .map((slot, index) => ({ slot, index }))        
                .filter(({ slot }) => slot.endDate && slot.endDate < today) 
                .reduce((prev, curr) => {
                    if (!prev) return curr;
                    return curr.slot.endDate! > prev.slot.endDate! ? curr : prev;
                }, undefined as { slot: typeof allSlots[0]; index: number } | undefined)?.index;

            if(prevIndex !== -1 && prevIndex){
                this.currentReservationIndex.set(houseId, prevIndex);
            }
            return;
        }

        if (direction === 'prev' && currentIndex > -1) {
            this.currentReservationIndex.set(houseId, currentIndex - 1);
        } else if (direction === 'next' && currentIndex < allSlots.length - 1) {
            this.currentReservationIndex.set(houseId, currentIndex + 1);
        }
    }

    getAdultsCount(houseId: number): number {
        const allSlots = this.getSortedReservationsWithGaps(houseId);
        const currentIndex = this.currentReservationIndex.get(houseId) ?? this.getCurrentReservationIndex(houseId);

        if (currentIndex === -1 || currentIndex >= allSlots.length) {
            return 0;
        }

        const slot = allSlots[currentIndex];
        if (slot.isGap) {
            return 0;
        }

        const reservation = this.getSortedReservations(houseId)[allSlots.slice(0, currentIndex + 1).filter((s) => !s.isGap).length - 1];
        return reservation?.adults || 0;
    }

    getBabiesCount(houseId: number): number {
        const allSlots = this.getSortedReservationsWithGaps(houseId);
        const currentIndex = this.currentReservationIndex.get(houseId) ?? this.getCurrentReservationIndex(houseId);

        if (currentIndex === -1 || currentIndex >= allSlots.length) {
            return 0;
        }

        const slot = allSlots[currentIndex];
        if (slot.isGap) {
            return 0;
        }

        const reservation = this.getSortedReservations(houseId)[allSlots.slice(0, currentIndex + 1).filter((s) => !s.isGap).length - 1];
        return reservation?.babies || 0;
    }

    getDogsCount(houseId: number): number {
        const allSlots = this.getSortedReservationsWithGaps(houseId);
        const currentIndex = this.currentReservationIndex.get(houseId) ?? this.getCurrentReservationIndex(houseId);

        if (currentIndex === -1 || currentIndex >= allSlots.length) {
            return 0;
        }

        const slot = allSlots[currentIndex];
        if (slot.isGap) {
            return 0;
        }

        const reservation = this.getSortedReservations(houseId)[allSlots.slice(0, currentIndex + 1).filter((s) => !s.isGap).length - 1];
        if (!reservation) return 0;
        return (reservation.dogs_d || 0) + (reservation.dogs_s || 0) + (reservation.dogs_b || 0);
    }

    getBabyCribsCount(houseId: number): number {
        const allSlots = this.getSortedReservationsWithGaps(houseId);
        const currentIndex = this.currentReservationIndex.get(houseId) ?? this.getCurrentReservationIndex(houseId);

        if (currentIndex === -1 || currentIndex >= allSlots.length) {
            return 0;
        }

        const slot = allSlots[currentIndex];
        if (slot.isGap) {
            return 0;
        }

        const reservation = this.getSortedReservations(houseId)[allSlots.slice(0, currentIndex + 1).filter((s) => !s.isGap).length - 1];
        if (!reservation) return 0;
        return reservation.cribs || 0;
    }

    isCurrentSlotGap(houseId: number): boolean {
        const allSlots = this.getSortedReservationsWithGaps(houseId);
        const currentIndex = this.currentReservationIndex.get(houseId) ?? this.getCurrentReservationIndex(houseId);

        if (currentIndex === -1 || currentIndex >= allSlots.length) {
            return true;
        }

        const slot = allSlots[currentIndex];
        if (!slot.isGap && slot.endDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const endDate = new Date(slot.endDate);
            endDate.setHours(23, 59, 59, 999); 

            if (today <= endDate) {
                return false;
            }
        }

        return slot.isGap;
    }

    isCurrentSlotOccupied(houseId: number): boolean {
        const allSlots = this.getSortedReservationsWithGaps(houseId);
        const currentIndex = this.currentReservationIndex.get(houseId) ?? this.getCurrentReservationIndex(houseId);

        // If we don't have a valid index or we're looking at a gap, the slot is not occupied
        if (currentIndex === -1 || currentIndex >= allSlots.length || allSlots[currentIndex].isGap) {
            return false;
        }

        // If we're looking at a reservation slot, it's occupied
        return true;
    }

    updateLocationOptions() {
        this.locationOptions = [...this.specialLocations, ...this.houses()];
    }

    isFormValid(): boolean {
        return !!this.selectedLocation;
    }

    isTaskFormValid(): boolean {
        return !!this.selectedLocationForTask && !!this.selectedTaskType;
    }

    openTaskDetails(event: Event, task: any) {
        event.stopPropagation();
        this.taskService.$taskModalData.next(task);
    }

    applyFilters() {
        let result = [...this.houses()];
        
        if (this.searchTerm && this.searchTerm.trim() !== '') {
            const searchLower = this.searchTerm.toLowerCase();
            result = result.filter(house => 
                house.house_name.toString().toLowerCase().includes(searchLower) || 
                house.house_number.toString().toLowerCase().includes(searchLower)
            );
        }
        
        if (this.sortType == 'number') {
            result.sort((a, b) => a.house_number - b.house_number);
            this.filteredHouses.set(result);
            this.groupedHouses.set([]);
        } else if (this.sortType == 'type') {
            result.sort((a, b) => {
                if (a.house_type_id !== b.house_type_id) {
                    return a.house_type_id - b.house_type_id;
                }
                return a.house_number - b.house_number;
            });
            
            const types = this.houseTypes();
            const grouped = types.map(type => {
                return {
                    type,
                    houses: result.filter(house => house.house_type_id === type.house_type_id)
                };
            }).filter(group => group.houses.length > 0); 
            
            this.groupedHouses.set(grouped);
            this.filteredHouses.set(result);
        } else if (this.sortType == 'status'){
            const statusOrder = ['OCCUPIED', 'ARRIVAL-DAY', 'NOT-CLEANED', 'FREE'];
            
            result.sort((a, b) => {
                const statusA = this.houseService.getHouseStatus(a);
                const statusB = this.houseService.getHouseStatus(b);
                const orderDiff = statusOrder.indexOf(statusA) - statusOrder.indexOf(statusB);
                if (orderDiff !== 0) return orderDiff;
                return a.house_number - b.house_number;
            });

            const grouped = statusOrder.map(status => {
                return {
                    status,
                    houses: result.filter(h => this.houseService.getHouseStatus(h) === status)
                };
            }).filter(group => group.houses.length > 0);

            this.groupedHousesByStatus.set(grouped);
            this.filteredHouses.set(result);
        } else {
            this.filteredHouses.set(result);
            this.groupedHouses.set([]);
        }
    }
    
    sortBy(type: 'number' | 'type' | 'status') {
        this.sortType = this.sortType === type ? null : type;
        
        if (this.sortType !== 'type') {
            this.groupedHouses.set([]);
        }
        
        this.applyFilters();
    }

    getTaskIcon(task: Task): string {
        if (this.isUrgentIconVisibleMap[task.task_id]) {
            return 'fa fa-exclamation-triangle';
        }

        return this.taskService.getTaskIcon(task.task_type_id);
    }
}