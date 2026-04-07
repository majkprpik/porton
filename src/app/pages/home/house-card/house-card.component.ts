import { Component, effect, Input, Output, EventEmitter, Signal, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { House, HouseAvailability, Task, Season } from '../../../core/models/data.models';
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
        [class.inactive]="isInactive"
        [class.occupied]="isOccupied"
        [class.available]="isAvailable"
        [class.available-with-tasks]="isAvailableWithTasks"
        [class.available-with-arrival]="isAvailableWithArrival"
        (click)="onClick($event)"
    >
        <div class="house-content">
            <div class="house-number">
                {{ house!.house_name }}
                @if (showConfirmedCleaningBadge) {
                    <i class="fa-regular fa-circle-check confirm-icon"></i>
                }
            </div>
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
        @if (showDetailedView) {
            <div class="house-detail-strip" [class]="detailStripClass" (click)="$event.stopPropagation()">
                <div class="detail-date-row">
                    @if (canNavigatePrev) {
                        <i class="fa fa-chevron-left detail-nav-arrow" (click)="navigate('prev', $event)"></i>
                    } @else {
                        <i class="fa fa-chevron-left detail-nav-arrow invisible"></i>
                    }
                    <span class="detail-date" [class]="slideClass">{{ reservationDateDisplay }}</span>
                    @if (canNavigateNext) {
                        <i class="fa fa-chevron-right detail-nav-arrow" (click)="navigate('next', $event)"></i>
                    } @else {
                        <i class="fa fa-chevron-right detail-nav-arrow invisible"></i>
                    }
                </div>
                <div class="detail-occupancy" [class.hidden]="!showOccupancy" [class]="showOccupancy ? slideClass : 'hidden'">
                    @if (showOccupancy) {
                        @if (occupancy.adults) {
                            <div class="occ-item"><span>{{ occupancy.adults }}</span><i class="fa-solid fa-person"></i></div>
                        }
                        @if (occupancy.dogs) {
                            <div class="occ-item"><span>{{ occupancy.dogs }}</span><i class="fa-solid fa-paw"></i></div>
                        }
                        @if (occupancy.babies) {
                            <div class="occ-item"><span>{{ occupancy.babies }}</span><i class="fa-solid fa-baby"></i></div>
                        }
                        @if (occupancy.cribs) {
                            <div class="occ-item"><span>{{ occupancy.cribs }}</span><i class="fa-solid fa-baby-carriage"></i></div>
                        }
                    }
                </div>
                <div class="detail-note" [class.hidden]="!reservationNote" [class]="reservationNote ? slideClass : 'hidden'">
                    @if (reservationNote) {
                        {{ reservationNote }}
                    }
                </div>
            </div>
        }
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
        height: 100%;
        backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
        -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow:
            var(--glass-shadow),
            inset 0 1px 1px rgba(255, 255, 255, 0.15);
        display: flex;
        flex-direction: column;
        justify-content: space-between;

        .house-content {
            padding: 0.5rem;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            overflow: visible;
        }

        .house-detail-strip {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            padding: 0.35rem 0.5rem 0.55rem;
            margin-top: auto;
            margin-left: -1px;
            margin-right: -1px;
            margin-bottom: -1px;
            color: white;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
            min-height: 4.55rem;
            height: 4.55rem;
            justify-content: flex-start;
            border-top: 1px solid rgba(255, 255, 255, 0.28);
            border-bottom-left-radius: 6px;
            border-bottom-right-radius: 6px;
            width: calc(100% + 2px);
            box-sizing: border-box;
            overflow: hidden;
            background: linear-gradient(
                135deg,
                rgba(34, 197, 94, 0.92),
                rgba(22, 163, 74, 0.85)
            );

            &.occupied {
                background: linear-gradient(
                    135deg,
                    rgba(220, 38, 38, 0.92),
                    rgba(185, 28, 28, 0.85)
                );
            }

            &.arrival {
                background: linear-gradient(
                    135deg,
                    rgba(248, 113, 113, 0.92),
                    rgba(239, 68, 68, 0.85)
                );
            }

            &.with-tasks {
                background: linear-gradient(
                    135deg,
                    rgba(250, 204, 21, 0.92),
                    rgba(234, 179, 8, 0.85)
                );
            }

            &.available {
                background: linear-gradient(
                    135deg,
                    rgba(34, 197, 94, 0.92),
                    rgba(22, 163, 74, 0.85)
                );
            }

            .detail-date-row {
                display: flex;
                align-items: center;
                gap: 0.4rem;
                font-size: 0.95rem;
                font-weight: 700;
                overflow: hidden;
            }

            .detail-date {
                flex: 1;
                text-align: center;
                white-space: nowrap;
                display: inline-block;
            }

            .detail-nav-arrow {
                cursor: pointer;
                padding: 0.15rem 0.25rem;
                border-radius: 50%;

                &.invisible {
                    visibility: hidden;
                    pointer-events: none;
                }
            }

            .detail-occupancy {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.55rem;
                font-size: 0.95rem;
                font-weight: 700;
                min-height: 1.2rem;
                height: 1.2rem;
                line-height: 1;

                .occ-item {
                    display: flex;
                    align-items: center;
                    gap: 0.2rem;
                    line-height: 1;
                }

                .occ-item span,
                .occ-item i {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    line-height: 1;
                }

                &.hidden {
                    visibility: hidden;
                }
            }

            .detail-note {
                font-size: 12.25px;
                line-height: 1.15;
                text-align: center;
                opacity: 0.95;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                min-height: 0.95rem;
                height: 0.95rem;

                &.hidden {
                    visibility: hidden;
                }
            }

        }

        @keyframes slideFromRight {
            from { transform: translateX(16px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        @keyframes slideFromLeft {
            from { transform: translateX(-16px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        .slide-from-right {
            animation: slideFromRight 0.22s ease-out;
        }

        .slide-from-left {
            animation: slideFromLeft 0.22s ease-out;
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

        &.inactive {
            background: linear-gradient(
                135deg,
                rgba(100, 100, 100, 0.7),
                rgba(60, 60, 60, 0.6)
            );
            border-color: rgba(120, 120, 120, 0.35);
            cursor: default;

            .house-number {
                color: rgba(255, 255, 255, 0.55);
                text-shadow: none;
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

            .confirm-icon {
                font-size: 1.4rem;
                vertical-align: middle;
                margin-left: 0.15rem;
            }
        }

        .house-icons {
            padding-right: 0;
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            align-items: center;
            gap: 6px;
            overflow: visible;

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
    @Input() tasks: Signal<Task[]> = signal([]);
    @Input() currentSeason: Season | null = null;
    @Input() isUrgentIconVisibleMap: { [taskId: number]: boolean } = {};
    @Input() showDetailedView = false;

    @Output() houseClick: EventEmitter<House> = new EventEmitter<House>();

    isInactive = false;
    isOccupied = false;
    isAvailable = false;
    isAvailableWithTasks = false;
    isAvailableWithArrival = false;

    notCompletedTasks: Task[] = [];
    hasCompletedHouseCleaningTask = false;
    showConfirmedCleaningBadge = false;
    reservationDateDisplay = '----- - -----';
    occupancy = { adults: 0, dogs: 0, babies: 0, cribs: 0 };
    reservationNote = '';
    detailStripClass = 'available';
    slideClass = '';
    private currentIndex = -1;
    private cachedSlots: { isGap: boolean; startDate: Date; endDate: Date | null; reservation?: HouseAvailability }[] = [];
    private slideTimeout: any;

    constructor(
        public houseService: HouseService,
        public taskService: TaskService,
        private cd: ChangeDetectorRef,
    ) {
        effect(() => {
            const _ = this.houseAvailabilities();
            const __ = this.tasks();
            this.updateAllData();
            this.cd.markForCheck();
        });
    }

    private updateAllData(): void {
        if (!this.house) return;

        const houseId = this.house.house_id;

        this.isInactive = !this.house.is_active;
        if (this.isInactive) {
            this.isOccupied = false;
            this.isAvailable = false;
            this.isAvailableWithTasks = false;
            this.isAvailableWithArrival = false;
            this.hasCompletedHouseCleaningTask = false;
            this.showConfirmedCleaningBadge = false;
            this.notCompletedTasks = [];
            this.rebuildSlots();
            this.currentIndex = this.findInitialIndex();
            this.updateDisplayData();
            return;
        }

        this.isOccupied = this.houseService.isHouseOccupied(houseId);
        const hasScheduledTasks = this.houseService.hasScheduledNotCompletedTasks(houseId);
        const latestHouseCleaningTask = this.houseService.getLatestHouseCleaningTask(houseId);
        const hasPendingCleaningConfirmation = !!latestHouseCleaningTask && this.taskService.isTaskCompleted(latestHouseCleaningTask);
        const hasConfirmedCleaningTask = !!latestHouseCleaningTask && this.taskService.isTaskConfirmed(latestHouseCleaningTask);
        const isReservedToday = this.houseService.isHouseReservedToday(houseId);
        const hasBlockingTasks = hasScheduledTasks || hasPendingCleaningConfirmation;

        this.hasCompletedHouseCleaningTask = this.houseService.getTasksForHouse(houseId)
            .some(t => this.taskService.isTaskCompleted(t) && this.taskService.isHouseCleaningTask(t));

        const nextOrSameDayReservation = this.houseService.getNextOrSameDayHouseAvailabilityForHouse(houseId);
        const hasOutstandingTasks = this.houseService.getTasksForHouse(houseId)
            .some(t => !this.taskService.isTaskCompleted(t) && !this.taskService.isTaskConfirmed(t));
        const hideBadgeBeforeLongVacancyArrival = this.houseService.shouldHideConfirmedCleaningBadgeBeforeArrival(houseId, this.currentSeason);

        this.showConfirmedCleaningBadge =
            !hasOutstandingTasks &&
            !hasPendingCleaningConfirmation &&
            !hideBadgeBeforeLongVacancyArrival &&
            hasConfirmedCleaningTask &&
            (!nextOrSameDayReservation || !nextOrSameDayReservation.has_arrived);

        this.isAvailable = !this.isOccupied && !hasBlockingTasks && !isReservedToday;
        this.isAvailableWithTasks = !this.isOccupied && hasBlockingTasks;
        this.isAvailableWithArrival = !this.isOccupied && !!isReservedToday && !hasScheduledTasks;

        this.notCompletedTasks = this.houseService.getTasksForHouse(houseId)
            .filter(t => !this.taskService.isTaskCompleted(t) && !this.taskService.isTaskConfirmed(t));

        this.rebuildSlots();
        this.currentIndex = this.findInitialIndex();
        this.updateDisplayData();
    }

    onClick(event: Event): void {
        event.stopPropagation();
        if (this.house) {
            this.houseClick.emit(this.house);
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

    get showOccupancy(): boolean {
        return !!(this.occupancy.adults || this.occupancy.dogs || this.occupancy.babies || this.occupancy.cribs);
    }

    get canNavigatePrev(): boolean {
        if (this.currentIndex > 0) return true;
        if (this.currentIndex === -1) {
            const today = new Date();
            return this.cachedSlots.some(s => s.endDate && s.endDate < today);
        }
        return false;
    }

    get canNavigateNext(): boolean {
        if (this.currentIndex !== -1 && this.currentIndex < this.cachedSlots.length - 1) return true;
        if (this.currentIndex === -1) {
            const today = new Date();
            return this.cachedSlots.some(s => s.startDate > today);
        }
        return false;
    }

    navigate(direction: 'prev' | 'next', event: Event): void {
        event.stopPropagation();
        if (direction === 'prev' && this.currentIndex > 0) {
            this.currentIndex--;
        } else if (direction === 'next' && this.currentIndex < this.cachedSlots.length - 1) {
            this.currentIndex++;
        } else if (this.currentIndex === -1 && direction === 'next') {
            const nextIdx = this.cachedSlots.findIndex(s => s.startDate > new Date());
            if (nextIdx !== -1) this.currentIndex = nextIdx;
        } else if (this.currentIndex === -1 && direction === 'prev') {
            const today = new Date();
            const past = this.cachedSlots
                .map((s, i) => ({ s, i }))
                .filter(({ s }) => s.endDate && s.endDate < today);
            if (past.length) this.currentIndex = past[past.length - 1].i;
        }
        this.updateDisplayData();
        this.triggerSlide(direction);
        this.cd.markForCheck();
    }

    private triggerSlide(direction: 'prev' | 'next'): void {
        clearTimeout(this.slideTimeout);
        this.slideClass = direction === 'next' ? 'slide-from-right' : 'slide-from-left';
        this.slideTimeout = setTimeout(() => {
            this.slideClass = '';
            this.cd.markForCheck();
        }, 250);
    }

    private rebuildSlots(): void {
        if (!this.house) return;
        const seasonStart = this.currentSeason ? new Date(this.currentSeason.season_start_date) : null;
        const seasonEnd = this.currentSeason ? new Date(this.currentSeason.season_end_date) : null;

        const reservations = this.houseAvailabilities()
            .filter(a => {
                if (a.house_id !== this.house!.house_id) return false;
                if (!seasonStart || !seasonEnd) return true;
                const resStart = new Date(a.house_availability_start_date);
                return resStart >= seasonStart && resStart <= seasonEnd;
            })
            .sort((a, b) => new Date(a.house_availability_start_date).getTime() - new Date(b.house_availability_start_date).getTime());

        this.cachedSlots = [];
        if (!reservations.length) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const effectiveGapStart = seasonStart ? new Date(seasonStart) : new Date(today);
        effectiveGapStart.setHours(0, 0, 0, 0);
        const firstStart = new Date(reservations[0].house_availability_start_date);
        firstStart.setHours(0, 0, 0, 0);

        if (firstStart > effectiveGapStart) {
            this.cachedSlots.push({ isGap: true, startDate: effectiveGapStart, endDate: new Date(firstStart) });
        }

        for (let i = 0; i < reservations.length; i++) {
            const r = reservations[i];
            const next = reservations[i + 1];
            this.cachedSlots.push({
                isGap: false,
                startDate: new Date(r.house_availability_start_date),
                endDate: new Date(r.house_availability_end_date),
                reservation: r,
            });
            if (next) {
                const currentEnd = new Date(r.house_availability_end_date);
                currentEnd.setDate(currentEnd.getDate() + 1);
                const nextStart = new Date(next.house_availability_start_date);
                if (currentEnd < nextStart) {
                    this.cachedSlots.push({ isGap: true, startDate: currentEnd, endDate: new Date(nextStart) });
                }
            }
        }
    }

    private findCurrentSlotIndex(): number {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const reservationStartingTodayIndex = this.cachedSlots.findIndex(slot => {
            if (slot.isGap || !slot.reservation) return false;
            const start = new Date(slot.startDate);
            start.setHours(0, 0, 0, 0);
            return start.getTime() === today.getTime();
        });

        if (reservationStartingTodayIndex !== -1) {
            return reservationStartingTodayIndex;
        }

        return this.cachedSlots.findIndex(slot => {
            const start = new Date(slot.startDate); start.setHours(0, 0, 0, 0);
            const end = new Date(slot.endDate ?? slot.startDate);
            end.setHours(23, 59, 59, 999);
            return today >= start && today <= end;
        });
    }

    private findInitialIndex(): number {
        const currentSlotIndex = this.findCurrentSlotIndex();
        if (currentSlotIndex !== -1) return currentSlotIndex;
        if (!this.cachedSlots.length) return -1;

        const now = new Date();
        const nextIndex = this.cachedSlots.findIndex(slot => slot.startDate > now);
        if (nextIndex !== -1) return nextIndex;

        return this.cachedSlots.length - 1;
    }

    private updateDisplayData(): void {
        const fmt = (d: Date) => `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.`;

        if (this.cachedSlots.length === 0 || this.currentIndex === -1) {
            this.reservationDateDisplay = '----- - -----';
            this.occupancy = { adults: 0, dogs: 0, babies: 0, cribs: 0 };
            this.reservationNote = '';
            this.detailStripClass = 'available';
            return;
        }

        const slot = this.cachedSlots[this.currentIndex];
        if (slot.isGap) {
            this.reservationDateDisplay = `${fmt(slot.startDate)} - ${fmt(slot.endDate!)}`;
            this.occupancy = { adults: 0, dogs: 0, babies: 0, cribs: 0 };
            this.reservationNote = slot.reservation?.note ?? '';
            this.detailStripClass = this.getReservationDetailClass(slot);
            return;
        }

        const nextDay = new Date(slot.endDate!);
        nextDay.setDate(nextDay.getDate() + 1);
        this.reservationDateDisplay = `${fmt(slot.startDate)} - ${fmt(nextDay)}`;

        const res = slot.reservation;
        this.occupancy = {
            adults: res?.adults || 0,
            dogs: (res?.dogs_d || 0) + (res?.dogs_s || 0) + (res?.dogs_b || 0),
            babies: res?.babies || 0,
            cribs: res?.cribs || 0,
        };
        this.reservationNote = res?.note ?? '';
        this.detailStripClass = this.getReservationDetailClass(slot);
    }

    private getReservationDetailClass(slot: { isGap: boolean; startDate: Date; endDate: Date | null; reservation?: HouseAvailability }): string {
        if (!this.house) return 'available';
        if (slot.isGap || !slot.reservation) return 'available';

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const slotStart = new Date(slot.startDate);
        slotStart.setHours(0, 0, 0, 0);
        const slotEnd = new Date(slot.endDate!);
        slotEnd.setHours(23, 59, 59, 999);

        if (today < slotStart || today > slotEnd) {
            return 'arrival';
        }

        const id = this.house.house_id;
        if (this.houseService.isHouseReservedToday(id)) return 'arrival';
        if (this.houseService.hasScheduledNotCompletedTasks(id) || this.houseService.hasUnconfirmedCleaningTask(id)) return 'with-tasks';
        return 'occupied';
    }
}
