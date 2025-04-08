import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, House, HouseAvailability, HouseStatus, HouseStatusTask, TaskType } from '../service/data.service';
import { Subscription } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextarea } from 'primeng/inputtextarea';
import { MenuItem } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { signal } from '@angular/core';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [
        CommonModule, 
        CardModule, 
        ButtonModule, 
        DialogModule,
        DropdownModule,
        InputTextarea,
        FormsModule
    ],
    template: `
        <div class="home-container" (click)="handleContainerClick($event)">
            
            <div class="house-grid">
                @for (house of houses(); track house.house_id) {
                    <div class="house-card" 
                         [class.occupied]="isHouseOccupied(house.house_id)" 
                         [class.available]="!isHouseOccupied(house.house_id)"
                         [class.expanded]="expandedHouseId === house.house_id"
                         (click)="toggleExpand($event, house.house_id)">
                        <div class="house-content">
                            <div class="house-number">{{house.house_number}}</div>
                            <div class="house-icons">
                                <i class="pi pi-calendar"></i>
                                <i class="pi" [class.pi-check-circle]="hasCompletedTasks(house.house_id)" 
                                           [class.pi-times-circle]="hasInProgressTasks(house.house_id)"
                                           [class.pi-exclamation-circle]="!hasAnyTasks(house.house_id)"></i>
                                <i class="pi pi-cog"></i>
                            </div>
                        </div>
                        <div class="expanded-content" 
                             [class.expanded-occupied]="!isCurrentSlotGap(house.house_id) && isHouseOccupied(house.house_id)"
                             [class.expanded-free]="isCurrentSlotGap(house.house_id) || !isHouseOccupied(house.house_id)"
                             (click)="handleExpandedContentClick($event)">
                            <div class="date-range">
                                <div class="date-nav">
                                    <i class="pi pi-chevron-left" (click)="navigateReservation(house.house_id, 'prev')"></i>
                                    <span>{{getCurrentReservationDates(house.house_id)}}</span>
                                    <i class="pi pi-chevron-right" (click)="navigateReservation(house.house_id, 'next')"></i>
                                </div>
                                <div class="numbers">
                                    <div class="number-item">
                                        <i class="pi pi-user"></i>
                                        <span>{{getAdultsCount(house.house_id)}}</span>
                                    </div>
                                    <span class="separator">|</span>
                                    <div class="number-item">
                                        <i class="pi pi-heart"></i>
                                        <span>{{getBabiesCount(house.house_id)}}</span>
                                    </div>
                                    <span class="separator">|</span>
                                    <div class="number-item">
                                        <i class="pi pi-star"></i>
                                        <span>{{getDogsCount(house.house_id)}}</span>
                                    </div>
                                </div>
                                @if (hasAnyTasks(house.house_id)) {
                                    <div class="tasks-section">
                                        <div class="tasks-header">Tasks:</div>
                                        <div class="tasks-list">
                                            @for (task of getHouseTasks(house.house_id); track task.taskId) {
                                                <div class="task-item" [class.completed]="isTaskCompleted(task)">
                                                    <i class="pi" [class.pi-check-circle]="isTaskCompleted(task)"
                                                               [class.pi-clock]="!isTaskCompleted(task)"></i>
                                                    <span>{{task.taskTypeName}}</span>
                                                </div>
                                            }
                                        </div>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                }
            </div>

            <!-- Fault Report Dialog -->
            <p-dialog 
                header="Prijava kvara" 
                [(visible)]="faultReportVisible" 
                [modal]="true"
                [style]="{ width: '30rem' }"
                [breakpoints]="{ '960px': '75vw', '641px': '90vw' }"
            >
                <div class="fault-report-form">
                    <div class="field">
                        <label for="location" class="font-bold block mb-2">Lokacija*</label>
                        <p-dropdown
                            id="location"
                            [options]="houses()"
                            [(ngModel)]="selectedHouse"
                            optionLabel="house_number"
                            [filter]="true"
                            filterBy="house_number"
                            placeholder="Odaberi kuću"
                            [style]="{ width: '100%' }"
                        ></p-dropdown>
                    </div>
                    
                    <div class="field mt-4">
                        <label for="description" class="font-bold block mb-2">Opis*</label>
                        <textarea
                            id="description"
                            pInputTextarea
                            [(ngModel)]="faultDescription"
                            [rows]="5"
                            [style]="{ width: '100%' }"
                            placeholder="Unesite opis kvara"
                        ></textarea>
                    </div>
                </div>

                <ng-template pTemplate="footer">
                    <div class="flex justify-content-end gap-2">
                        <button 
                            pButton 
                            label="Odustani" 
                            class="p-button-text" 
                            (click)="faultReportVisible = false"
                        ></button>
                        <button 
                            pButton 
                            label="Prijavi" 
                            (click)="submitFaultReport()"
                            [disabled]="!isFormValid()"
                        ></button>
                    </div>
                </ng-template>
            </p-dialog>

            <!-- Extraordinary Task Dialog -->
            <p-dialog 
                header="Prijava izvanrednog zadatka" 
                [(visible)]="extraordinaryTaskVisible" 
                [modal]="true"
                [style]="{ width: '30rem' }"
                [breakpoints]="{ '960px': '75vw', '641px': '90vw' }"
            >
                <div class="task-form">
                    <div class="field">
                        <label for="location" class="font-bold block mb-2">Lokacija*</label>
                        <p-dropdown
                            id="location"
                            [options]="houses()"
                            [(ngModel)]="selectedHouseForTask"
                            optionLabel="house_number"
                            [filter]="true"
                            filterBy="house_number"
                            placeholder="Odaberi kuću"
                            [style]="{ width: '100%' }"
                        ></p-dropdown>
                    </div>
                    
                    <div class="field mt-4">
                        <label for="taskType" class="font-bold block mb-2">Vrsta zadatka*</label>
                        <p-dropdown
                            id="taskType"
                            [options]="taskTypes()"
                            [(ngModel)]="selectedTaskType"
                            optionLabel="task_type_name"
                            placeholder="Odaberi vrstu zadatka"
                            [style]="{ width: '100%' }"
                        ></p-dropdown>
                    </div>

                    <div class="field mt-4">
                        <label for="taskDescription" class="font-bold block mb-2">Opis*</label>
                        <textarea
                            id="taskDescription"
                            pInputTextarea
                            [(ngModel)]="taskDescription"
                            [rows]="5"
                            [style]="{ width: '100%' }"
                            placeholder="Unesite opis zadatka"
                        ></textarea>
                    </div>
                </div>

                <ng-template pTemplate="footer">
                    <div class="flex justify-content-end gap-2">
                        <button 
                            pButton 
                            label="Odustani" 
                            class="p-button-text" 
                            (click)="extraordinaryTaskVisible = false"
                        ></button>
                        <button 
                            pButton 
                            label="Prijavi zadatak" 
                            (click)="submitExtraordinaryTask()"
                            [disabled]="!isTaskFormValid()"
                        ></button>
                    </div>
                </ng-template>
            </p-dialog>

            <!-- Phone Dialog -->
            <p-dialog 
                header="Phone" 
                [(visible)]="phoneDialogVisible" 
                [modal]="true"
                [style]="{ width: '50vw' }"
                [breakpoints]="{ '960px': '75vw', '641px': '90vw' }"
            >
                <div class="p-4">
                    <h3>Phone Content</h3>
                    <p>This is a placeholder for the phone functionality.</p>
                </div>
                <ng-template pTemplate="footer">
                    <button pButton label="Close" (click)="phoneDialogVisible = false"></button>
                </ng-template>
            </p-dialog>
        </div>
    `,
    styles: [`
        .home-container {
            padding: 0.5rem;
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
            box-shadow: 0 2px 1px -1px rgba(0,0,0,.2), 
                       0 1px 1px 0 rgba(0,0,0,.14), 
                       0 1px 3px 0 rgba(0,0,0,.12);
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
                background: inherit;
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

                    & + .house-content {
                        background: var(--p-red-400);
                        color: white;
                        border-radius: 6px 6px 0 0;
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

                    & + .house-content {
                        background: var(--p-green-500);
                        color: white;
                        border-radius: 6px 6px 0 0;
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
                background: var(--p-surface-ground);
                .house-number, .house-icons i {
                    color: var(--p-green-500);
                }

                @media (prefers-color-scheme: dark) {
                    background: var(--p-green-400);
                    .house-number, .house-icons i {
                        color: var(--p-green-100);
                    }
                }
            }

            &.occupied {
                background: var(--p-surface-ground);
                .house-number, .house-icons i {
                    color: var(--p-red-500);
                }

                @media (prefers-color-scheme: dark) {
                    background: var(--p-red-400);
                    .house-number, .house-icons i {
                        color: var(--p-red-100);
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
    `]
})
export class Home implements OnInit, OnDestroy {
    houses = signal<House[]>([]);
    houseAvailabilities = signal<HouseAvailability[]>([]);
    houseStatuses = signal<HouseStatus[]>([]);
    private subscriptions: Subscription[] = [];
    expandedHouseId: number | null = null;
    currentReservationIndex = new Map<number, number>();

    // Dialog visibility flags
    faultReportVisible: boolean = false;
    extraordinaryTaskVisible: boolean = false;
    phoneDialogVisible: boolean = false;

    // Form fields
    selectedHouse: House | null = null;
    faultDescription: string = '';

    // Form fields for extraordinary task
    selectedHouseForTask: House | null = null;
    selectedTaskType: TaskType | null = null;
    taskDescription: string = '';
    taskTypes = signal<TaskType[]>([]);

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

    constructor(private dataService: DataService) {}

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

    getCurrentReservationIndex(houseId: number): number {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const allSlots = this.getSortedReservationsWithGaps(houseId);
        const index = allSlots.findIndex(slot => {
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
            .filter(availability => availability.house_id === houseId)
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
            const nextSlot = allSlots.find(slot => {
                if (slot.isGap) {
                    return slot.startDate > today;
                }
                return slot.startDate > today;
            });

            if (nextSlot) {
                const formatDate = (date: Date) => `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.`;
                if (nextSlot.isGap) {
                    return `${formatDate(nextSlot.startDate)} - ${formatDate(nextSlot.endDate!)}`;
                } else {
                    return `----- - ${formatDate(nextSlot.startDate)}`;
                }
            }
            return '----- - -----';
        }

        // Show the selected slot
        const slot = allSlots[currentIndex];
        const formatDate = (date: Date) => `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.`;
        
        if (slot.isGap) {
            // For gaps, show normal date range
            return `${formatDate(slot.startDate)} - ${formatDate(slot.endDate!)}`;
        } else {
            // For reservations, add one day to end date
            const endDatePlusOne = new Date(slot.endDate!);
            endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
            return `${formatDate(slot.startDate)} - ${formatDate(endDatePlusOne)}`;
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
            const nextIndex = allSlots.findIndex(slot => {
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

        const reservation = this.getSortedReservations(houseId)[allSlots.slice(0, currentIndex + 1).filter(s => !s.isGap).length - 1];
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

        const reservation = this.getSortedReservations(houseId)[allSlots.slice(0, currentIndex + 1).filter(s => !s.isGap).length - 1];
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

        const reservation = this.getSortedReservations(houseId)[allSlots.slice(0, currentIndex + 1).filter(s => !s.isGap).length - 1];
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

    hasCompletedTasks(houseId: number): boolean {
        const status = this.houseStatuses().find(s => s.house_id === houseId);
        if (!status?.housetasks?.length) return false;
        return status.housetasks.some(task => task.taskProgressTypeId === 3); // Assuming 3 is "Completed"
    }

    hasInProgressTasks(houseId: number): boolean {
        const status = this.houseStatuses().find(s => s.house_id === houseId);
        if (!status?.housetasks?.length) return false;
        return status.housetasks.some(task => task.taskProgressTypeId === 2); // Assuming 2 is "In Progress"
    }

    hasAnyTasks(houseId: number): boolean {
        const status = this.houseStatuses().find(s => s.house_id === houseId);
        return !!status?.housetasks?.length;
    }

    getHouseTasks(houseId: number): HouseStatusTask[] {
        const status = this.houseStatuses().find(s => s.house_id === houseId);
        return status?.housetasks || [];
    }

    isTaskCompleted(task: HouseStatusTask): boolean {
        return task.taskProgressTypeId === 3; // Assuming 3 is "Completed"
    }

    ngOnInit(): void {
        // Load houses data if not already loaded
        this.dataService.loadHouses().subscribe();
        
        // Load house availabilities data if not already loaded
        this.dataService.loadHouseAvailabilities().subscribe();

        // Load house statuses data
        this.dataService.loadHouseStatuses().subscribe();
        
        // Subscribe to houses data from DataService
        const housesSubscription = this.dataService.houses$.subscribe(houses => {
            this.houses.set(houses);
        });

        // Subscribe to house availabilities data from DataService
        const availabilitiesSubscription = this.dataService.houseAvailabilities$.subscribe(availabilities => {
            this.houseAvailabilities.set(availabilities);
        });

        // Subscribe to house statuses data from DataService
        const statusesSubscription = this.dataService.houseStatuses$.subscribe(statuses => {
            this.houseStatuses.set(statuses);
        });
        
        // Store subscriptions for cleanup
        this.subscriptions.push(housesSubscription, availabilitiesSubscription, statusesSubscription);

        // Subscribe to task types
        const taskTypesSubscription = this.dataService.taskTypes$.subscribe(types => {
            this.taskTypes.set(types);
        });
        
        // Add to subscriptions array
        this.subscriptions.push(taskTypesSubscription);

        // Load task types if not already loaded
        this.dataService.getTaskTypes().subscribe();
    }

    isHouseOccupied(houseId: number): boolean {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return this.houseAvailabilities().some(availability => {
            if (availability.house_id !== houseId) return false;
            
            const startDate = new Date(availability.house_availability_start_date);
            const endDate = new Date(availability.house_availability_end_date);
            
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999); // Make end date inclusive until end of day
            
            return today >= startDate && today <= endDate;
        });
    }

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions to prevent memory leaks
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    isFormValid(): boolean {
        return !!this.selectedHouse && !!this.faultDescription.trim();
    }

    submitFaultReport() {
        if (!this.isFormValid()) return;

        console.log('Submitting fault report:', {
            house: this.selectedHouse,
            description: this.faultDescription
        });

        // Here you would typically call a service method to save the fault report
        // For example: this.dataService.submitFaultReport(this.selectedHouse.house_id, this.faultDescription).subscribe();

        // Reset form and close dialog
        this.selectedHouse = null;
        this.faultDescription = '';
        this.faultReportVisible = false;
    }

    isTaskFormValid(): boolean {
        return !!this.selectedHouseForTask && 
               !!this.selectedTaskType && 
               !!this.taskDescription.trim();
    }

    submitExtraordinaryTask() {
        if (!this.isTaskFormValid()) return;

        console.log('Submitting extraordinary task:', {
            house: this.selectedHouseForTask,
            taskType: this.selectedTaskType,
            description: this.taskDescription
        });

        // Here you would typically call a service method to save the task
        // For example: this.dataService.createTask({...}).subscribe();

        // Reset form and close dialog
        this.selectedHouseForTask = null;
        this.selectedTaskType = null;
        this.taskDescription = '';
        this.extraordinaryTaskVisible = false;
    }
} 