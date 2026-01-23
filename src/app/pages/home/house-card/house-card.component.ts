import { Component, effect, Input, Signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { House, HouseAvailability, Task } from '../../../core/models/data.models';
import { HouseService } from '../../../core/services/house.service';
import { TaskService } from '../../../core/services/task.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-house-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
  ],
  template: `
    <div 
        class="house-card"
        [class.occupied]="isOccupied"
        [class.available]="isAvailable"
        [class.available-with-tasks]="isAvailableWithTasks"
        [class.available-with-arrival]="isAvailableWithArrival"
        [class.expanded]="expandedHouseId === house!.house_id"
        (click)="toggleExpand($event, house!.house_id)"
    >
        <div class="house-content">
            <div class="house-number">{{ house!.house_name }}</div>
            <div class="house-icons">
                @for (task of notCompletedTasks; track task.task_id) {
                    <i
                        [ngClass]="[
                            getTaskIcon(task),
                            taskService.isTaskInProgress(task)
                            ? (isUrgentIconVisibleMap[task.task_id] ? 'rotating' : 'rotating-wrench')
                            : ''
                        ]"
                        (click)="openTaskDetails($event, task)">
                    </i>
                }
            </div>
        </div>
        <div
            class="expanded-content"
            [class.expanded-occupied]="!isReservationSlotGap && isReservationSlotOccupied"
            [class.expanded-free]="isReservationSlotGap || !isReservationSlotOccupied"
            (click)="handleExpandedContentClick($event)"
        >
            <div class="date-range">
                <div class="date-nav">
                    <i class="fa fa-chevron-left" (click)="navigateReservation(house!.house_id, 'prev')"></i>
                    <span>{{ selectedReservationDate }}</span>
                    <i class="fa fa-chevron-right" (click)="navigateReservation(house!.house_id, 'next')"></i>
                </div>
                @if(!isReservationSlotGap){
                    <div class="numbers">
                        <div class="number-item">
                            <span>{{ adultsCount }}</span>
                            <i class="fa-solid fa-person"></i>
                        </div>
                        <span class="separator">|</span>
                        <div class="number-item">
                            <span>{{ dogsCount }}</span>
                            <i class="fa-solid fa-paw"></i>
                        </div>
                        <span class="separator">|</span>
                        <div class="number-item">
                            <span>{{ babiesCount }}</span>
                            <i class="fa-solid fa-baby"></i>
                        </div>
                        <span class="separator">|</span>
                        <div class="number-item">
                            <span>{{ babyCribsCount }}</span>
                            <i class="fa-solid fa-baby-carriage"></i>
                        </div>
                    </div>
                }
            </div>
        </div>
    </div>
  `,
  styles: `
    .house-card {
        background: var(--surface-card);
        border-radius: 6px;
        transition: all 0.2s ease;
        cursor: pointer;
        min-width: unset;
        position: relative;
        z-index: 1;
        max-width: 400px;
        height: 100%;
        backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
        -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow:
            var(--glass-shadow),
            inset 0 1px 1px rgba(255, 255, 255, 0.15);

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

        .rotating {
            animation: rotate 2s linear infinite;
        }

        .rotating-wrench {
            animation: rotate-180 2s linear infinite
        }

        @keyframes rotate-180 {
            from {
                transform: rotate(130deg);
            }
            to {
                transform: rotate(490deg);
            }
        }

        @keyframes rotate {
            from {
                transform: rotate(0deg);
            }
            to {
                transform: rotate(360deg);
            }
        }

        &.available {
            background: linear-gradient(
                135deg,
                rgba(34, 197, 94, 0.85),
                rgba(22, 163, 74, 0.75)
            );
            border-color: rgba(34, 197, 94, 0.4);

            .house-number,
            .house-icons i {
                color: white;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
            }
        }

        &.occupied {
            background: linear-gradient(
                135deg,
                rgba(220, 38, 38, 0.85),
                rgba(185, 28, 28, 0.75)
            );
            border-color: rgba(220, 38, 38, 0.4);

            .house-number,
            .house-icons i {
                color: white;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
            }
        }

        &.available-with-arrival {
            background: linear-gradient(
                135deg,
                rgba(248, 113, 113, 0.85),
                rgba(239, 68, 68, 0.75)
            );
            border-color: rgba(248, 113, 113, 0.4);

            .house-number,
            .house-icons i {
                color: white;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
            }
        }

        &.available-with-tasks {
            background: linear-gradient(
                135deg,
                rgba(250, 204, 21, 0.85),
                rgba(234, 179, 8, 0.75)
            );
            border-color: rgba(250, 204, 21, 0.4);

            .house-number,
            .house-icons i {
                color: white;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
            }
        }

        &:hover {
            box-shadow:
                var(--glass-shadow-elevated),
                inset 0 1px 2px rgba(255, 255, 255, 0.25);
            transform: translateY(-1px);
            border-color: rgba(255, 255, 255, 0.35);
        }

        .house-number {
            font-size: 1.25rem;
            font-weight: 700;
            padding-left: 0;
            padding-right: 10px;
        }

        .house-icons {
            padding-right: 0;
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 10px;

            i {
                font-size: 1.25rem;
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: center;
            }
        }
    }

     @media screen and (min-width: 768px) {
        .house-card {
            .house-content {
                padding: 0.75rem 1rem;
            }

            .house-number {
                font-size: 1.5rem;
            }

            .house-icons {
                display: flex;
                flex-direction: row;
                align-items: center;
                flex-wrap: wrap;
                gap: 5px;

                i {
                    font-size: 1.5rem;
                    width: 25px;
                    
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: center;
                }
            }
        }
    }
  `
})
export class HouseCardComponent {
    @Input() house?: House;
    @Input() houseAvailabilities!: Signal<HouseAvailability[]>;
    @Input() expandedHouseId: number | null = null;
    @Input() isUrgentIconVisibleMap: { [taskId: number]: boolean } = {};

    currentReservationIndex = new Map<number, number>();

    isOccupied = false;
    isAvailable = false;
    isAvailableWithTasks = false;
    isAvailableWithArrival = false;

    adultsCount = 0;
    dogsCount = 0;
    babiesCount = 0;
    babyCribsCount = 0;

    isReservationSlotGap = false;
    isReservationSlotOccupied = false;
    selectedReservationDate = '';

    notCompletedTasks: Task[] = [];

    private cachedSlots: { isGap: boolean; startDate: Date; endDate: Date | null; nextStartDate: Date | null }[] = [];

    constructor(
        public houseService: HouseService,
        public taskService: TaskService,
        private cd: ChangeDetectorRef,
    ) {
        effect(() => {
            const _ = this.houseAvailabilities();
            this.updateAllData();
            this.cd.markForCheck();
        });
    }

    private updateAllData(): void {
        if (!this.house) return;

        const houseId = this.house.house_id;

        this.isOccupied = this.houseService.isHouseOccupied(houseId);
        const hasScheduledTasks = this.houseService.hasScheduledNotCompletedTasks(houseId);
        const isReservedToday = this.houseService.isHouseReservedToday(houseId);

        this.isAvailable = !this.isOccupied && !hasScheduledTasks && !isReservedToday;
        this.isAvailableWithTasks = !this.isOccupied && hasScheduledTasks && !isReservedToday;
        this.isAvailableWithArrival = !this.isOccupied && !!isReservedToday;

        this.notCompletedTasks = this.houseService.getTasksForHouse(houseId)
            .filter(t => !this.taskService.isTaskCompleted(t) && !this.taskService.isTaskConfirmed(t));

        this.cachedSlots = this.buildSortedReservationsWithGaps(houseId);
        this.updateReservationData();
    }

    private updateReservationData(): void {
        if (!this.house) return;

        this.selectedReservationDate = this.getCurrentReservationDates(this.house.house_id);
        this.isReservationSlotGap = this.isCurrentSlotGap(this.house.house_id);
        this.isReservationSlotOccupied = this.isCurrentSlotOccupied(this.house.house_id);
        this.updateOccupantsCount();
    }

    private updateOccupantsCount(): void {
        if (!this.house) return;

        const houseId = this.house.house_id;
        const currentIndex = this.currentReservationIndex.get(houseId) ?? this.getCurrentReservationIndex(houseId);

        if (currentIndex === -1 || currentIndex >= this.cachedSlots.length || this.cachedSlots[currentIndex].isGap) {
            this.adultsCount = 0;
            this.dogsCount = 0;
            this.babiesCount = 0;
            this.babyCribsCount = 0;
            return;
        }

        const reservation = this.getReservationAtIndex(houseId, currentIndex);
        if (!reservation) {
            this.adultsCount = 0;
            this.dogsCount = 0;
            this.babiesCount = 0;
            this.babyCribsCount = 0;
            return;
        }

        this.adultsCount = reservation.adults || 0;
        this.babiesCount = reservation.babies || 0;
        this.dogsCount = (reservation.dogs_d || 0) + (reservation.dogs_s || 0) + (reservation.dogs_b || 0);
        this.babyCribsCount = reservation.cribs || 0;
    }

    private getReservationAtIndex(houseId: number, currentIndex: number): HouseAvailability | null {
        const nonGapCount = this.cachedSlots.slice(0, currentIndex + 1).filter(s => !s.isGap).length;
        const reservations = this.getSortedReservations(houseId);
        return reservations[nonGapCount - 1] || null;
    }

    private buildSortedReservationsWithGaps(houseId: number): { isGap: boolean; startDate: Date; endDate: Date | null; nextStartDate: Date | null }[] {
        const reservations = this.getSortedReservations(houseId);
        const result: { isGap: boolean; startDate: Date; endDate: Date | null; nextStartDate: Date | null }[] = [];

        if (reservations.length === 0) return result;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const firstStart = new Date(reservations[0].house_availability_start_date);
        firstStart.setHours(0, 0, 0, 0);

        if (firstStart.getTime() > today.getTime()) {
            result.push({ isGap: true, startDate: today, endDate: new Date(firstStart), nextStartDate: firstStart });
        }

        for (let i = 0; i < reservations.length; i++) {
            const current = reservations[i];
            const next = reservations[i + 1];

            result.push({
                isGap: false,
                startDate: new Date(current.house_availability_start_date),
                endDate: new Date(current.house_availability_end_date),
                nextStartDate: null
            });

            if (next) {
                const currentEnd = new Date(current.house_availability_end_date);
                const nextStart = new Date(next.house_availability_start_date);
                currentEnd.setDate(currentEnd.getDate() + 1);

                if (currentEnd.getTime() < nextStart.getTime()) {
                    result.push({ isGap: true, startDate: currentEnd, endDate: new Date(nextStart), nextStartDate: nextStart });
                }
            }
        }

        return result;
    }

    isCurrentSlotGap(houseId: number): boolean {
        const currentIndex = this.currentReservationIndex.get(houseId) ?? this.getCurrentReservationIndex(houseId);

        if (currentIndex === -1 || currentIndex >= this.cachedSlots.length) {
            return true;
        }

        const slot = this.cachedSlots[currentIndex];
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

    toggleExpand(event: Event, houseId: number): void {
        event.stopPropagation();
        this.expandedHouseId = this.expandedHouseId === houseId ? null : houseId;
        if (this.expandedHouseId === houseId) {
            this.currentReservationIndex.set(houseId, this.getCurrentReservationIndex(houseId));
        }
    }

    getTaskIcon(task: Task): string {
        if (this.isUrgentIconVisibleMap[task.task_id]) {
            return 'fa fa-exclamation-triangle';
        }
        return this.taskService.getTaskIcon(task.task_type_id);
    }

    openTaskDetails(event: Event, task: Task): void {
        event.stopPropagation();
        this.taskService.$taskModalData.next(task);
    }

    handleExpandedContentClick(event: Event): void {
        event.stopPropagation();
    }

    getCurrentReservationIndex(houseId: number): number {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return this.cachedSlots.findIndex((slot) => {
            if (slot.isGap) return false;
            const startDate = new Date(slot.startDate);
            const endDate = new Date(slot.endDate!);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            return (startDate.getTime() === today.getTime() || today > startDate) && today <= endDate;
        });
    }

    isCurrentSlotOccupied(houseId: number): boolean {
        const currentIndex = this.currentReservationIndex.get(houseId) ?? this.getCurrentReservationIndex(houseId);
        if (currentIndex === -1 || currentIndex >= this.cachedSlots.length || this.cachedSlots[currentIndex].isGap) {
            return false;
        }
        return true;
    }

    private getSortedReservations(houseId: number): HouseAvailability[] {
        return this.houseAvailabilities()
            .filter((availability) => availability.house_id === houseId)
            .sort((a, b) => new Date(a.house_availability_start_date).getTime() - new Date(b.house_availability_start_date).getTime());
    }

    navigateReservation(houseId: number, direction: 'prev' | 'next'): void {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let currentIndex = this.currentReservationIndex.get(houseId) ?? this.getCurrentReservationIndex(houseId);

        if (currentIndex === -1 && direction === 'next') {
            const nextIndex = this.cachedSlots.findIndex((slot) => slot.startDate > today);
            if (nextIndex !== -1) {
                this.currentReservationIndex.set(houseId, nextIndex);
            }
            this.updateReservationData();
            this.cd.markForCheck();
            return;
        } else if (currentIndex === -1 && direction === 'prev') {
            const slotsWithIndex = this.cachedSlots
                .map((slot, index) => ({ slot, index }))
                .filter(({ slot }) => slot.endDate && slot.endDate < today);

            const prevItem = slotsWithIndex.reduce<{ slot: { isGap: boolean; startDate: Date; endDate: Date | null; nextStartDate: Date | null }; index: number } | undefined>((prev, curr) => {
                if (!prev) return curr;
                return curr.slot.endDate! > prev.slot.endDate! ? curr : prev;
            }, undefined);

            const prevIndex = prevItem?.index;

            if (prevIndex !== undefined && prevIndex !== -1) {
                this.currentReservationIndex.set(houseId, prevIndex);
            }
            this.updateReservationData();
            this.cd.markForCheck();
            return;
        }

        if (direction === 'prev' && currentIndex > 0) {
            this.currentReservationIndex.set(houseId, currentIndex - 1);
        } else if (direction === 'next' && currentIndex < this.cachedSlots.length - 1) {
            this.currentReservationIndex.set(houseId, currentIndex + 1);
        }

        this.updateReservationData();
        this.cd.markForCheck();
    }

    getCurrentReservationDates(houseId: number): string {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const currentIndex = this.currentReservationIndex.get(houseId) ?? this.getCurrentReservationIndex(houseId);

        if (this.cachedSlots.length === 0) {
            return '----- - -----';
        }

        const formatDate = (date: Date) => `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.`;

        if (currentIndex === -1) {
            const nextSlot = this.cachedSlots.find((slot) => slot.startDate > today);

            const filteredSlots = this.cachedSlots.filter(slot => slot.endDate && slot.endDate < today);
            const prevSlot = filteredSlots.reduce<{ isGap: boolean; startDate: Date; endDate: Date | null; nextStartDate: Date | null } | undefined>((prev, curr) => {
                if (!prev) return curr;
                return curr.endDate! > prev.endDate! ? curr : prev;
            }, undefined);

            if (nextSlot) {
                if (nextSlot.isGap) {
                    const endDatePlusOne = new Date(nextSlot.endDate!);
                    endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
                    return `${formatDate(nextSlot.startDate)} - ${formatDate(endDatePlusOne)}`;
                } else {
                    if (prevSlot?.endDate) {
                        const prevEndPlusOne = new Date(prevSlot.endDate);
                        prevEndPlusOne.setDate(prevEndPlusOne.getDate() + 1);
                        return `${formatDate(prevEndPlusOne)} - ${formatDate(nextSlot.startDate)}`;
                    } else {
                        return `----- - ${formatDate(nextSlot.startDate)}`;
                    }
                }
            }
            return '----- - -----';
        }

        const slot = this.cachedSlots[currentIndex];

        if (!slot.endDate) {
            return `${formatDate(slot.startDate)} - -----`;
        }

        if (slot.isGap) {
            return `${formatDate(slot.startDate)} - ${formatDate(slot.endDate)}`;
        } else {
            const nextDay = new Date(slot.endDate);
            nextDay.setDate(nextDay.getDate() + 1);
            return `${formatDate(slot.startDate)} - ${formatDate(nextDay)}`;
        }
    }
}
