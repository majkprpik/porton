import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, House, HouseAvailability, HouseStatus, HouseStatusTask, Task, TaskType } from '../service/data.service';
import { Subscription } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { MenuItem } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { signal } from '@angular/core';
import { TaskService } from '../service/task.service';
import { HouseService } from '../service/house.service';

// Define the special location option interface
interface SpecialLocation {
    name: string;
    type: string;
}

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, CardModule, ButtonModule, DialogModule, DropdownModule, FormsModule],
    template: `
        <div class="home-container" (click)="handleContainerClick($event)">
            <div class="house-grid">
                @for (house of houses(); track house.house_id) {
                    <div 
                        class="house-card" 
                        [class.occupied]="houseService.isHouseOccupied(house.house_id)" 
                        [class.available]="!houseService.isHouseOccupied(house.house_id) && !houseService.hasAnyTasks(house.house_id)" 
                        [class.available-with-tasks]="!houseService.isHouseOccupied(house.house_id) && houseService.hasAnyTasks(house.house_id)"
                        [class.available-with-arrival]="!houseService.isHouseOccupied(house.house_id) && houseService.hasArrivalForToday(house.house_id)"
                        [class.expanded]="expandedHouseId === house.house_id" 
                        (click)="toggleExpand($event, house.house_id)">
                        <div class="house-content">
                            <div class="house-number">{{ house.house_name }}</div>
                            <div class="house-icons">
                                @if (houseService.hasAnyTasks(house.house_id)) {
                                    @for (task of houseService.getHouseTasks(house.house_id); track task.task_id) {
                                        @if (!taskService.isTaskCompleted(task)){
                                            @if (taskService.isRepairTask(task)) {
                                                <i class="fa fa-wrench" [ngClass]="{ 'rotate-icon': taskService.isTaskInProgress(task) }" (click)="openTaskDetails($event, task)"></i>
                                            } @else if (taskService.isHouseCleaningTask(task)) {
                                                <i class="fa fa-house" [ngClass]="{ 'rotate-icon': taskService.isTaskInProgress(task) }" (click)="openTaskDetails($event, task)"></i>
                                            } @else if (taskService.isTowelChangeTask(task)) {
                                                <i class="fa fa-bookmark" [ngClass]="{ 'rotate-icon': taskService.isTaskInProgress(task) }" (click)="openTaskDetails($event, task)"></i>
                                            } @else if (taskService.isDeckCleaningTask(task)) {
                                                <i class="fa fa-umbrella-beach" [ngClass]="{ 'rotate-icon': taskService.isTaskInProgress(task) }" (click)="openTaskDetails($event, task)"></i>
                                            } @else if (taskService.isSheetChangeTask(task)) {
                                                <i class="fa fa-bed" [ngClass]="{ 'rotate-icon': taskService.isTaskInProgress(task) }" (click)="openTaskDetails($event, task)"></i>
                                            } @else {
                                                <i class="fa fa-file" [ngClass]="{ 'rotate-icon': taskService.isTaskInProgress(task) }" (click)="openTaskDetails($event, task)"></i>
                                            }
                                        }
                                    }
                                }
                            </div>
                        </div>
                        <div
                            class="expanded-content"
                            [class.expanded-occupied]="!isCurrentSlotGap(house.house_id) && isCurrentSlotOccupied(house.house_id)"
                            [class.expanded-free]="isCurrentSlotGap(house.house_id) || !isCurrentSlotOccupied(house.house_id)"
                            (click)="handleExpandedContentClick($event)"
                        >
                            <div class="date-range">
                                <div class="date-nav">
                                    <i class="fa fa-chevron-left" (click)="navigateReservation(house.house_id, 'prev')"></i>
                                    <span>{{ getCurrentReservationDates(house.house_id) }}</span>
                                    <i class="fa fa-chevron-right" (click)="navigateReservation(house.house_id, 'next')"></i>
                                </div>
                                <div class="numbers">
                                    <div class="number-item">
                                        <i class="fa fa-user"></i>
                                        <span>{{ getAdultsCount(house.house_id) }}</span>
                                    </div>
                                    <span class="separator">|</span>
                                    <div class="number-item">
                                        <i class="fa fa-heart"></i>
                                        <span>{{ getBabiesCount(house.house_id) }}</span>
                                    </div>
                                    <span class="separator">|</span>
                                    <div class="number-item">
                                        <i class="fa fa-star"></i>
                                        <span>{{ getDogsCount(house.house_id) }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                }
            </div>
        </div>
    `,
    styles: [
        `
            .home-container {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .header-card {
                background: var(--surface-card);
                padding: 1rem;
                border-radius: 6px;
                margin-bottom: 1rem;

                h2 {
                    margin: 0;
                    color: var(--text-color);
                    font-size: 1.5rem;
                }
            }

            .house-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0.25rem;
                padding: 0;
                position: relative;
            }

            .house-card {
                background: var(--surface-card);
                border-radius: 6px;
                box-shadow:
                    0 2px 1px -1px rgba(0, 0, 0, 0.2),
                    0 1px 1px 0 rgba(0, 0, 0, 0.14),
                    0 1px 3px 0 rgba(0, 0, 0, 0.12);
                transition: all 0.2s ease;
                cursor: pointer;
                min-width: unset;
                position: relative;
                z-index: 1;

                &.expanded {
                    z-index: 2;
                    border-radius: 6px 6px 0 0;
                    box-shadow: none;
                    outline: 1px solid rgba(255, 255, 255, 0.3);

                    .house-content {
                        border-radius: 6px 6px 0 0;
                    }

                    .expanded-content {
                        visibility: visible;
                        opacity: 1;
                        transform: translateY(0);
                        border-radius: 0 0 6px 6px;
                        outline: 1px solid rgba(255, 255, 255, 0.3);
                        outline-top: none;
                        margin-top: -1px;
                    }

                    &:before {
                        content: '';
                        position: absolute;
                        top: -1px;
                        left: -1px;
                        right: -1px;
                        bottom: -1px;
                        z-index: -1;
                        border-radius: 7px;
                        box-shadow: var(--p-shadow-2);
                    }
                }

                .house-content {
                    padding: 0.5rem;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: space-between;
                }

                .expanded-content {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    width: 100%;
                    background: var(--surface-card);
                    border-radius: 6px;
                    box-shadow: var(--p-shadow-2);
                    padding: 0.5rem;
                    visibility: hidden;
                    opacity: 0;
                    transform: translateY(-10px);
                    transition: all 0.3s ease;
                    z-index: 3;

                    &.expanded-occupied {
                        background: var(--p-red-400);
                        color: white;

                        .date-nav i {
                            color: white;
                            &:hover {
                                background-color: rgba(255, 255, 255, 0.2);
                            }
                        }
                    }

                    &.expanded-free {
                        background: var(--p-green-500);
                        color: white;

                        .date-nav i {
                            color: white;
                            &:hover {
                                background-color: rgba(255, 255, 255, 0.2);
                            }
                        }
                    }

                    .date-range {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 0.5rem;

                        .date-nav {
                            display: flex;
                            align-items: center;
                            gap: 0.5rem;
                            font-size: 1rem;

                            i {
                                cursor: pointer;
                                padding: 0.25rem;
                                border-radius: 50%;
                                transition: background-color 0.2s;

                                &:hover {
                                    background-color: var(--p-surface-hover);
                                }
                            }
                        }

                        .numbers {
                            display: flex;
                            align-items: center;
                            gap: 0.5rem;
                            font-size: 1.2rem;
                            font-weight: 500;

                            .number-item {
                                display: flex;
                                align-items: center;
                                gap: 0.25rem;

                                i {
                                    font-size: 1rem;
                                }
                            }

                            .separator {
                                opacity: 0.8;
                            }
                        }
                    }
                }

                &.available {
                    background: var(--p-green-600);
                    .house-number,
                    .house-icons i {
                        color: var(--p-green-100);
                    }

                    @media (prefers-color-scheme: dark) {
                        background: var(--p-green-600);
                        .house-number,
                        .house-icons i {
                            color: var(--p-green-100);
                        }
                    }
                }

                &.occupied {
                    background: var(--p-red-600);
                    .house-number,
                    .house-icons i {
                        color: var(--p-red-100);
                    }

                    @media (prefers-color-scheme: dark) {
                        background: var(--p-red-600);
                        .house-number,
                        .house-icons i {
                            color: var(--p-red-100);
                        }
                    }
                }

                &.available-with-arrival{
                    background: var(--p-red-400);
                    .house-number,
                    .house-icons i {
                        color: var(--p-red-100);
                    }

                    @media (prefers-color-scheme: dark) {
                        background: var(--p-red-400);
                        .house-number,
                        .house-icons i {
                            color: var(--p-red-100);
                        }
                    }
                }

                &.occupied-without-arrival{
                    background: var(--p-green-400);
                    .house-number,
                    .house-icons i {
                        color: var(--p-green-100);
                    }

                    @media (prefers-color-scheme: dark) {
                        background: var(--p-green-400);
                        .house-number,
                        .house-icons i {
                            color: var(--p-green-100);
                        }
                    }
                }

                &.available-with-tasks {
                    background: var(--p-yellow-400);
                    .house-number,
                    .house-icons i {
                        color: var(--p-yellow-100);
                    }

                    @media (prefers-color-scheme: dark) {
                        background: var(--p-yellow-400);
                        .house-number,
                        .house-icons i {
                            color: var(--p-yellow-100);
                        }
                    }
                }

                &:hover {
                    box-shadow: var(--p-shadow-2);
                    transform: translateY(-1px);
                }

                .house-number {
                    font-size: 1.25rem;
                    font-weight: 700;
                    padding-left: 0;
                }

                .house-icons {
                    display: flex;
                    gap: 0.25rem;
                    padding-right: 0;

                    i {
                        font-size: 1.25rem;
                    }
                }
            }

            @media screen and (min-width: 768px) {
                .house-grid {
                    grid-template-columns: repeat(4, 1fr);
                    gap: 0.5rem;
                }

                .house-card {
                    .house-content {
                        padding: 0.75rem 1rem;
                    }

                    .house-number {
                        font-size: 1.5rem;
                    }

                    .house-icons {
                        gap: 0.5rem;
                        i {
                            font-size: 1.5rem;
                        }
                    }
                }
            }

            @media screen and (min-width: 1200px) {
                .house-grid {
                    grid-template-columns: repeat(6, 1fr);
                }
            }

            .tasks-section {
                margin-top: 0.5rem;
                border-top: 1px solid rgba(255, 255, 255, 0.2);
                padding-top: 0.5rem;
            }

            .tasks-header {
                font-size: 0.9rem;
                margin-bottom: 0.3rem;
                opacity: 0.9;
            }

            .tasks-list {
                display: flex;
                flex-direction: column;
                gap: 0.3rem;
            }

            .task-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.9rem;
                padding: 0.2rem 0.5rem;
                border-radius: 4px;
                background: rgba(255, 255, 255, 0.1);

                &.completed {
                    background: rgba(255, 255, 255, 0.2);
                }

                i {
                    font-size: 1rem;
                }
            }

            .fault-report-form {
                padding: 1.5rem 0;

                .field {
                    margin-bottom: 1rem;
                }

                label {
                    color: var(--text-color);
                }
            }

            .task-form {
                padding: 1.5rem 0;

                .field {
                    margin-bottom: 1rem;
                }

                label {
                    color: var(--text-color);
                }
            }

            .rotate-icon {
                animation: rotate 2s linear infinite;
            }

            @keyframes rotate {
                from {
                    transform: rotate(0deg);
                }
                to {
                    transform: rotate(360deg);
                }
            }
        `
    ]
})
export class Home implements OnInit, OnDestroy {
    houses = signal<House[]>([]);
    houseAvailabilities = signal<HouseAvailability[]>([]);
    houseStatuses = signal<HouseStatus[]>([]);
    private subscriptions: Subscription[] = [];
    expandedHouseId: number | null = null;
    currentReservationIndex = new Map<number, number>();

    // Special locations
    specialLocations: SpecialLocation[] = [
        { name: 'Zgrada', type: 'building' },
        { name: 'Parcela', type: 'parcel' }
    ];

    // Combined location options
    locationOptions: (House | SpecialLocation)[] = [];

    // Dialog visibility flags
    faultReportVisible: boolean = false;
    extraordinaryTaskVisible: boolean = false;
    phoneDialogVisible: boolean = false;

    // Form fields
    selectedLocation: House | SpecialLocation | null = null;
    selectedHouse: House | null = null;
    faultDescription: string = '';
    locationType: string = 'house';

    // Form fields for extraordinary task
    selectedLocationForTask: House | SpecialLocation | null = null;
    selectedHouseForTask: House | null = null;
    locationTypeForTask: string = 'house';
    selectedTaskType: TaskType | null = null;
    taskDescription: string = '';
    taskTypes = signal<TaskType[]>([]);
    tasks: Task[] = [];

    menuItems: MenuItem[] = [
        {
            icon: 'pi pi-exclamation-circle',
            command: () => {
                this.faultReportVisible = true;
            }
        },
        {
            icon: 'pi pi-plus-circle',
            command: () => {
                this.extraordinaryTaskVisible = true;
            }
        },
        {
            icon: 'pi pi-phone',
            command: () => {
                this.phoneDialogVisible = true;
            }
        }
    ];

    constructor(
        private dataService: DataService,
        public taskService: TaskService,
        public houseService: HouseService,
    ) {}

    ngOnInit(): void {
        this.subscriptions.push(this.dataService.loadHouses().subscribe());
        this.subscriptions.push(this.dataService.loadHouseAvailabilities().subscribe());
        this.subscriptions.push(this.dataService.loadHouseStatuses().subscribe());

        this.subscriptions.push(this.dataService.tasks$.subscribe(tasks => {
            this.tasks = tasks;
        }));

        this.subscriptions.push(this.dataService.houses$.subscribe((houses) => {
            this.houses.set(houses.filter(h => h.house_number > 0));
            this.updateLocationOptions();
        }));

        this.subscriptions.push(this.dataService.houseAvailabilities$.subscribe((availabilities) => {
            this.houseAvailabilities.set(availabilities);
        }));

        this.subscriptions.push(this.dataService.houseStatuses$.subscribe((statuses) => {
            this.houseStatuses.set(statuses);
        }));

        this.subscriptions.push(this.dataService.taskTypes$.subscribe((types) => {
            this.taskTypes.set(types);
        }));

        this.subscriptions.push(this.dataService.getTaskTypes().subscribe());
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

    // Handle location change in extraordinary task dialog
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

        // If no slots at all
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

            if (nextSlot) {
                const formatDate = (date: Date) => `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.`;
                if (nextSlot.isGap) {
                    // For gaps, also add one day to end date
                    const endDatePlusOne = new Date(nextSlot.endDate!);
                    endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
                    return `${formatDate(nextSlot.startDate)} - ${formatDate(endDatePlusOne)}`;
                } else {
                    return `----- - ${formatDate(nextSlot.startDate)}`;
                }
            }
            return '----- - -----';
        }

        // Show the selected slot
        const slot = allSlots[currentIndex];
        const formatDate = (date: Date) => `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.`;

        // Always add one day to end date for both gaps and reservations
        const endDatePlusOne = new Date(slot.endDate!);
        endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
        return `${formatDate(slot.startDate)} - ${formatDate(endDatePlusOne)}`;
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
        }

        // Normal navigation between slots
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

    isCurrentSlotGap(houseId: number): boolean {
        const allSlots = this.getSortedReservationsWithGaps(houseId);
        const currentIndex = this.currentReservationIndex.get(houseId) ?? this.getCurrentReservationIndex(houseId);

        if (currentIndex === -1 || currentIndex >= allSlots.length) {
            return true; // Consider initial state as a gap
        }

        const slot = allSlots[currentIndex];
        if (!slot.isGap && slot.endDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const endDate = new Date(slot.endDate);
            endDate.setHours(23, 59, 59, 999); // Make end date inclusive until end of day

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

    // Update location options method
    updateLocationOptions() {
        this.locationOptions = [...this.specialLocations, ...this.houses()];
    }

    isFormValid(): boolean {
        return !!this.selectedLocation;
    }

    submitFaultReport() {
        if (!this.isFormValid()) return;

        // Get fault report task type (assuming it's "Popravak")
        this.dataService.getTaskTypeIdByTaskName('Popravak').then((taskTypeId) => {
            if (!taskTypeId) {
                console.error('Failed to get task type ID for "Popravak"');
                return;
            }

            // Get "U tijeku" (In Progress) task progress type
            this.dataService.getTaskProgressTypeIdByTaskProgressTypeName('U tijeku').then((progressTypeId) => {
                if (!progressTypeId) {
                    console.error('Failed to get task progress type ID for "U tijeku"');
                    return;
                }

                // Create task object based on location type
                const taskData: any = {
                    task_type_id: taskTypeId,
                    task_progress_type_id: progressTypeId,
                    description: this.faultDescription,
                    created_by: 'user', // Replace with actual user ID
                    is_unscheduled: true,
                    location_type: this.locationType
                };

                // Add appropriate location fields based on location type
                if (this.locationType === 'house' && this.selectedHouse) {
                    taskData.house_id = this.selectedHouse.house_id;
                    taskData.house_number = this.selectedHouse.house_number;
                } else {
                    // For buildings and parcels, add the location name
                    if (this.selectedLocation && 'name' in this.selectedLocation) {
                        taskData.location_name = this.selectedLocation.name;
                    }
                }

                // Create task
                this.dataService.createTask(taskData).subscribe(
                    (result) => {
                        console.log('Fault report created:', result);

                        // Reset form and close dialog
                        this.selectedLocation = null;
                        this.selectedHouse = null;
                        this.locationType = 'house';
                        this.faultDescription = '';
                        this.faultReportVisible = false;
                    },
                    (error) => console.error('Error creating fault report:', error)
                );
            });
        });
    }

    isTaskFormValid(): boolean {
        return !!this.selectedLocationForTask && !!this.selectedTaskType;
    }

    submitExtraordinaryTask() {
        if (!this.isTaskFormValid()) return;

        // Ensure we have selected a task type
        if (!this.selectedTaskType) return;

        // Get "U tijeku" (In Progress) task progress type
        this.dataService.getTaskProgressTypeIdByTaskProgressTypeName('U tijeku').then((progressTypeId) => {
            if (!progressTypeId) {
                console.error('Failed to get task progress type ID for "U tijeku"');
                return;
            }

            // Create task object based on location type
            const taskData: any = {
                task_type_id: this.selectedTaskType!.task_type_id,
                task_progress_type_id: progressTypeId,
                description: this.taskDescription,
                created_by: 'user', // Replace with actual user ID
                is_unscheduled: true,
                location_type: this.locationTypeForTask
            };

            // Add appropriate location fields based on location type
            if (this.locationTypeForTask === 'house' && this.selectedHouseForTask) {
                taskData.house_id = this.selectedHouseForTask.house_id;
                taskData.house_number = this.selectedHouseForTask.house_number;
            } else {
                // For buildings and parcels, add the location name
                if (this.selectedLocationForTask && 'name' in this.selectedLocationForTask) {
                    taskData.location_name = this.selectedLocationForTask.name;
                }
            }

            // Create task
            this.dataService.createTask(taskData).subscribe(
                (result) => {
                    console.log('Extraordinary task created:', result);

                    // Reset form and close dialog
                    this.selectedLocationForTask = null;
                    this.selectedHouseForTask = null;
                    this.locationTypeForTask = 'house';
                    this.selectedTaskType = null;
                    this.taskDescription = '';
                    this.extraordinaryTaskVisible = false;
                },
                (error) => console.error('Error creating extraordinary task:', error)
            );
        });
    }

    isHouseOccupied(houseId: number): boolean {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTime = today.getTime();

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const yesterdayTime = yesterday.getTime();

        const houseAvailabilities = this.houseAvailabilities()
            .filter((availability) => {
                if (availability.house_id == houseId) {
                    const start = new Date(availability.house_availability_start_date);
                    start.setHours(0, 0, 0, 0);

                    const end = new Date(availability.house_availability_end_date);
                    end.setHours(23, 59, 59, 999);

                    // Main case: today is in range
                    const isTodayInRange = start.getTime() <= todayTime && end.getTime() >= todayTime;

                    // Extra case: ended exactly yesterday
                    const endedYesterday = end.getTime() >= yesterdayTime && end.getTime() < todayTime;

                    return isTodayInRange || endedYesterday;
                }

                return false;
            })
            .sort((a, b) => {
                const endA = new Date(a.house_availability_end_date).getTime();
                const endB = new Date(b.house_availability_end_date).getTime();
                return endA - endB;
            });

        if(houseId == 455){
            console.log('aaa');
        }

        if (houseAvailabilities && houseAvailabilities.length == 1) {
            if(this.houseService.hasArrivalForToday(houseId)){
                return houseAvailabilities[0].has_arrived
            } else if(this.houseService.hasDepartureForToday(houseId)){
                return !houseAvailabilities[0].has_departed
            } else {
                return true;
            }
        } else if (houseAvailabilities && houseAvailabilities.length == 2) {
            if (!houseAvailabilities[0].has_departed) {
                return true;
            } else if (houseAvailabilities[0].has_departed && !houseAvailabilities[1].has_arrived) {
                return false;
            } else if (houseAvailabilities[0].has_departed && houseAvailabilities[1].has_arrived) {
                return true;
            }
        }

        return false;
    }

    openTaskDetails(event: Event, task: any) {
        event.stopPropagation();
        this.taskService.$taskModalData.next(task);
    }

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions to prevent memory leaks
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }
}
