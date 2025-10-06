import { Component, effect, Input, Signal } from '@angular/core';
import { House, HouseAvailability, Task } from '../../../core/models/data.models';
import { HouseService } from '../../../core/services/house.service';
import { TaskService } from '../../../core/services/task.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-house-card',
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
                @if (hasNotCompletedTasks) {
                    @for (task of houseService.getTasksForHouse(house!.house_id); track task.task_id) {
                        @if (!taskService.isTaskCompleted(task)){
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
                    }
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
                @if(!isCurrentSlotGap(house!.house_id)){
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
            background: var(--p-green-600);

            .house-number,
            .house-icons i {
                color: white;
            }
            
            @media (prefers-color-scheme: dark) {
                background: var(--p-green-600);
            }
        }

        &.occupied {
            background: var(--p-red-600);

            .house-number,
            .house-icons i {
                color: white;

            }

            @media (prefers-color-scheme: dark) {
                background: var(--p-red-600);
            }
        }

        &.available-with-arrival{
            background: var(--p-red-400);

            .house-number,
            .house-icons i {
                color: white;
            }

            @media (prefers-color-scheme: dark) {
                background: var(--p-red-400);
            }
        }

        &.available-with-tasks {
            background: var(--p-yellow-400);

            .house-number,
            .house-icons i {
                color: white;
            }

            @media (prefers-color-scheme: dark) {
                background: var(--p-yellow-400);
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

    isOccupied: boolean = false;
    hasTasks: boolean = false;
    isAvailable: boolean = false;
    isAvailableWithTasks: boolean = false;
    isAvailableWithArrival: boolean = false;

    adultsCount: number = 0;
    dogsCount: number = 0;
    babiesCount: number = 0;
    babyCribsCount: number = 0;

    hasNotCompletedTasks: boolean = false;

    isReservationSlotGap: boolean = false;
    isReservationSlotOccupied: boolean = false;
    selectedReservationDate: string = ''

    private updateBooleans() {
        if (!this.house) return;

        this.isOccupied = this.houseService.isHouseOccupied(this.house.house_id);
        this.isAvailable = !this.houseService.isHouseOccupied(this.house.house_id) && !this.houseService.hasScheduledNotCompletedTasks(this.house.house_id);
        this.isAvailableWithTasks = !this.houseService.isHouseOccupied(this.house.house_id) && this.houseService.hasScheduledNotCompletedTasks(this.house.house_id);
        this.isAvailableWithArrival = !this.houseService.isHouseOccupied(this.house.house_id) && !!this.houseService.isHouseReservedToday(this.house.house_id);

        this.getHouseData();
        this.getReservationData();
        this.getOccupantsCount();
    }

    private getHouseData(){
        if(!this.house) return;

        this.hasNotCompletedTasks = this.houseService.hasNotCompletedTasks(this.house.house_id);
    }

    private getReservationData(){
        if(!this.house) return;

        this.selectedReservationDate = this.getCurrentReservationDates(this.house.house_id);
        this.isReservationSlotGap = this.isCurrentSlotGap(this.house.house_id);
        this.isReservationSlotOccupied = this.isCurrentSlotOccupied(this.house.house_id);
        this.getOccupantsCount();
    }

    private getOccupantsCount(){
        if(!this.house) return;

        this.adultsCount = this.getAdultsCount(this.house.house_id);
        this.dogsCount = this.getDogsCount(this.house.house_id);
        this.babiesCount = this.getBabiesCount(this.house.house_id);
        this.babyCribsCount = this.getBabyCribsCount(this.house.house_id);
    }

    constructor(
        public houseService: HouseService,
        public taskService: TaskService,
    ) {
        effect(() => {
            const _ = this.houseAvailabilities(); 
            this.updateBooleans();
        });
    }

    private getAdultsCount(houseId: number): number {
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

    private getBabiesCount(houseId: number): number {
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

    private getDogsCount(houseId: number): number {
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

    private getBabyCribsCount(houseId: number): number {
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

    toggleExpand(event: Event, houseId: number) {
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
  
    openTaskDetails(event: Event, task: any) {
        event.stopPropagation();
        this.taskService.$taskModalData.next(task);
    }

    handleExpandedContentClick(event: Event) {
        event.stopPropagation();
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

            return (startDate.getTime() === today.getTime() || today > startDate) && today <= endDate;
        });

        return index;
    }
    
    isCurrentSlotOccupied(houseId: number): boolean {
        const allSlots = this.getSortedReservationsWithGaps(houseId);
        const currentIndex = this.currentReservationIndex.get(houseId) ?? this.getCurrentReservationIndex(houseId);

        if (currentIndex === -1 || currentIndex >= allSlots.length || allSlots[currentIndex].isGap) {
            return false;
        }

        return true;
    }

    getSortedReservationsWithGaps(houseId: number): { isGap: boolean; startDate: Date; endDate: Date | null; nextStartDate: Date | null }[] {
        const reservations = this.getSortedReservations(houseId);
        const result: { isGap: boolean; startDate: Date; endDate: Date | null; nextStartDate: Date | null }[] = [];

        if (reservations.length === 0) {
            return result;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const firstReservation = reservations[0];
        const firstStart = new Date(firstReservation.house_availability_start_date);
        firstStart.setHours(0, 0, 0, 0);

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

    private getSortedReservations(houseId: number): HouseAvailability[] {
        return this.houseAvailabilities()
            .filter((availability) => availability.house_id === houseId)
            .sort((a, b) => new Date(a.house_availability_start_date).getTime() - new Date(b.house_availability_start_date).getTime());
    }

    navigateReservation(houseId: number, direction: 'prev' | 'next') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const allSlots = this.getSortedReservationsWithGaps(houseId);
        let currentIndex = this.currentReservationIndex.get(houseId);

        if (currentIndex === undefined) {
            currentIndex = this.getCurrentReservationIndex(houseId);
        }

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

            this.getReservationData();
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

            this.getReservationData();
            return;
        }

        if (direction === 'prev' && currentIndex > -1) {
            this.currentReservationIndex.set(houseId, currentIndex - 1);
        } else if (direction === 'next' && currentIndex < allSlots.length - 1) {
            this.currentReservationIndex.set(houseId, currentIndex + 1);
        }

        this.getReservationData();
    }

    getCurrentReservationDates(houseId: number): string {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const allSlots = this.getSortedReservationsWithGaps(houseId);
        const currentIndex = this.currentReservationIndex.get(houseId) ?? this.getCurrentReservationIndex(houseId);

        if (allSlots.length === 0) {
            return '----- - -----';
        }

        if (currentIndex === -1) {
            const nextSlot = allSlots.find((slot) => {
                if (slot.isGap) {
                    return slot.startDate > today;
                }
                return slot.startDate > today;
            });

            const prevSlot = allSlots
                .filter(slot => slot.endDate && slot.endDate < today) 
                .reduce((prev, curr) => {
                    if (!prev) return curr;
                    return curr.endDate! > prev.endDate! ? curr : prev;
                }, undefined as typeof allSlots[0] | undefined);

            if (nextSlot) {
                const formatDate = (date: Date) => `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.`;
                if (nextSlot.isGap) {
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
}
