import { Component, Input, Output, EventEmitter, Signal, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { House, HouseAvailability, Task, TaskProgressTypeName, ProfileRoles, Season } from '../../core/models/data.models';
import { HouseService } from '../../core/services/house.service';
import { TaskService } from '../../core/services/task.service';
import { ProfileService } from '../../core/services/profile.service';
import { StorageService, STORAGE_KEYS } from '../../core/services/storage.service';
import { TaskCardComponent } from '../daily-sheet/task-card.component';

@Component({
    selector: 'app-house-detail-modal',
    standalone: true,
    imports: [CommonModule, ButtonModule, DialogModule, TranslateModule, TaskCardComponent],
    template: `
        <p-dialog
            [(visible)]="visible"
            (visibleChange)="visibleChange.emit($event)"
            [modal]="true"
            [closable]="false"
            [showHeader]="false"
            [draggable]="false"
            [resizable]="false"
            [style]="{'width': '500px', 'max-width': '95vw'}"
            [contentStyle]="{'padding': '0', 'border-radius': '10px', 'overflow': 'hidden'}"
        >
            <div class="modal-header" [ngClass]="headerClass">
                <button class="close-btn" (click)="close()">
                    <i class="pi pi-times"></i>
                </button>

                <div class="house-name-row">
                    <div class="house-name">{{ house?.house_name }}</div>
                    @if (house?.description) {
                        <div class="house-description-inline">{{ house?.description }}</div>
                    }
                </div>

                @if (house && !house.is_active) {
                    @if (isEmptyState) {
                        <div class="no-reservation">{{ 'HOME.HOUSE-DETAIL.NO-RESERVATIONS' | translate }}</div>
                    } @else {
                        <div class="date-nav">
                            @if (canNavigatePrev) {
                                <i class="fa fa-chevron-left nav-arrow" (click)="navigate('prev', $event)"></i>
                            } @else {
                                <i class="fa fa-chevron-left nav-arrow invisible"></i>
                            }
                            <span [class]="slideClass">{{ reservationDateDisplay }}</span>
                            @if (canNavigateNext) {
                                <i class="fa fa-chevron-right nav-arrow" (click)="navigate('next', $event)"></i>
                            } @else {
                                <i class="fa fa-chevron-right nav-arrow invisible"></i>
                            }
                        </div>
                    }

                    <div class="occupancy" [ngClass]="slideClass" [style.visibility]="showOccupancy ? 'visible' : 'hidden'">
                        @if (occupancy.adults) {
                            <div class="occ-item"><span>{{ occupancy.adults }}</span><i class="fa-solid fa-person"></i></div>
                        }
                        @if (occupancy.dogs) {
                            <span class="sep">|</span>
                            <div class="occ-item"><span>{{ occupancy.dogs }}</span><i class="fa-solid fa-paw"></i></div>
                        }
                        @if (occupancy.babies) {
                            <span class="sep">|</span>
                            <div class="occ-item"><span>{{ occupancy.babies }}</span><i class="fa-solid fa-baby"></i></div>
                        }
                        @if (occupancy.cribs) {
                            <span class="sep">|</span>
                            <div class="occ-item"><span>{{ occupancy.cribs }}</span><i class="fa-solid fa-baby-carriage"></i></div>
                        }
                    </div>

                    <div class="reservation-note" [ngClass]="reservationNote ? slideClass : 'hidden'">
                        @if (reservationNote) {
                            {{ reservationNote }}
                        }
                    </div>
                } @else {
                    @if (isEmptyState) {
                        <div class="no-reservation">{{ 'HOME.HOUSE-DETAIL.NO-RESERVATIONS' | translate }}</div>
                    } @else {
                        <div class="date-nav">
                            @if (canNavigatePrev) {
                                <i class="fa fa-chevron-left nav-arrow" (click)="navigate('prev', $event)"></i>
                            } @else {
                                <i class="fa fa-chevron-left nav-arrow invisible"></i>
                            }
                            <span [class]="slideClass">{{ reservationDateDisplay }}</span>
                            @if (canNavigateNext) {
                                <i class="fa fa-chevron-right nav-arrow" (click)="navigate('next', $event)"></i>
                            } @else {
                                <i class="fa fa-chevron-right nav-arrow invisible"></i>
                            }
                        </div>
                    }

                    <div class="occupancy" [ngClass]="slideClass" [style.visibility]="showOccupancy ? 'visible' : 'hidden'">
                        @if (occupancy.adults) {
                            <div class="occ-item"><span>{{ occupancy.adults }}</span><i class="fa-solid fa-person"></i></div>
                        }
                        @if (occupancy.dogs) {
                            <span class="sep">|</span>
                            <div class="occ-item"><span>{{ occupancy.dogs }}</span><i class="fa-solid fa-paw"></i></div>
                        }
                        @if (occupancy.babies) {
                            <span class="sep">|</span>
                            <div class="occ-item"><span>{{ occupancy.babies }}</span><i class="fa-solid fa-baby"></i></div>
                        }
                        @if (occupancy.cribs) {
                            <span class="sep">|</span>
                            <div class="occ-item"><span>{{ occupancy.cribs }}</span><i class="fa-solid fa-baby-carriage"></i></div>
                        }
                    </div>

                    <div class="reservation-note" [ngClass]="reservationNote ? slideClass : 'hidden'">
                        @if (reservationNote) {
                            {{ reservationNote }}
                        }
                    </div>
                }
            </div>

            <div class="modal-body">
                @if (confirmTasks.length > 0) {
                    <div class="section">
                        <div class="section-label">
                            <i class="fa-regular fa-circle-check"></i>
                            <span>{{ 'HOME.HOUSE-DETAIL.ZA-POTVRDU' | translate }}</span>
                        </div>
                        @for (task of confirmTasks; track task.task_id) {
                            <div class="confirm-card" (click)="openTaskDetails(task)">
                                <div class="confirm-card-left">
                                    <span class="house-num">{{ houseService.getHouseName(task.house_id) }}</span>
                                    <div class="task-icon">
                                        <i [class]="taskService.getTaskIcon(task.task_type_id)"></i>
                                    </div>
                                </div>
                                @if (canConfirmTasks) {
                                    <p-button
                                        [label]="'BUTTONS.CONFIRM' | translate"
                                        severity="success"
                                        size="small"
                                        (onClick)="confirmTask($event, task)"
                                    ></p-button>
                                }
                            </div>
                        }
                    </div>
                }

                @if (activeTasks.length > 0) {
                    <div class="section">
                        <div class="section-label">
                            <i class="pi pi-list"></i>
                            <span>{{ 'HOME.HOUSE-DETAIL.ZADACI' | translate }}</span>
                        </div>
                        <div class="tasks-list">
                            @for (task of activeTasks; track task.task_id) {
                                <app-task-card [task]="task"></app-task-card>
                            }
                        </div>
                    </div>
                }

                @if (confirmTasks.length === 0 && activeTasks.length === 0) {
                    <div class="empty-state">
                        <i class="pi pi-check-circle"></i>
                        <span>{{ 'HOME.HOUSE-DETAIL.NO-TASKS' | translate }}</span>
                    </div>
                }
            </div>
        </p-dialog>
    `,
    styles: `
        .modal-header {
            padding: 1.25rem 1rem 1rem;
            color: white;
            position: relative;

            &.occupied {
                background: linear-gradient(135deg, rgba(220, 38, 38, 0.92), rgba(185, 28, 28, 0.85));
            }
            &.arrival {
                background: linear-gradient(135deg, rgba(248, 113, 113, 0.92), rgba(239, 68, 68, 0.85));
            }
            &.with-tasks {
                background: linear-gradient(135deg, rgba(250, 204, 21, 0.92), rgba(234, 179, 8, 0.85));
            }
            &.inactive {
                background: linear-gradient(135deg, rgba(90, 90, 90, 0.92), rgba(55, 55, 55, 0.85));
            }
            &.available {
                background: linear-gradient(135deg, rgba(34, 197, 94, 0.92), rgba(22, 163, 74, 0.85));
            }

            .close-btn {
                position: absolute;
                top: 0.6rem;
                right: 0.6rem;
                background: rgba(255,255,255,0.2);
                border: none;
                border-radius: 50%;
                width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                color: white;
                transition: background 0.2s;

                &:hover {
                    background: rgba(255,255,255,0.35);
                }

                i {
                    font-size: 0.8rem;
                }
            }

            .house-name-row {
                display: flex;
                align-items: baseline;
                gap: 0.6rem;
                flex-wrap: wrap;
                margin-bottom: 0.4rem;
            }

            .house-name {
                font-size: 1.5rem;
                font-weight: 700;
                text-shadow: 0 1px 2px rgba(0,0,0,0.2);
            }

            .date-nav {
                display: flex;
                align-items: center;
                gap: 0.6rem;
                font-size: 1rem;
                margin-bottom: 0.4rem;
                overflow: hidden;

                span {
                    display: inline-block;
                }

                .nav-arrow {
                    cursor: pointer;
                    padding: 0.2rem 0.35rem;
                    border-radius: 50%;
                    transition: background 0.2s;

                    &:hover {
                        background: rgba(255,255,255,0.25);
                    }

                    &.invisible {
                        visibility: hidden;
                        pointer-events: none;
                    }
                }
            }

            .no-reservation {
                font-size: 1rem;
                margin-bottom: 0.4rem;
            }

            .house-description {
                font-size: 0.9rem;
                opacity: 0.85;
                line-height: 1.4;
                margin-top: 0.35rem;
            }

            .house-description-inline {
                font-size: 0.95rem;
                opacity: 0.9;
                line-height: 1.2;
            }

            @keyframes slideFromRight {
                from { transform: translateX(16px); opacity: 0; }
                to   { transform: translateX(0);    opacity: 1; }
            }

            @keyframes slideFromLeft {
                from { transform: translateX(-16px); opacity: 0; }
                to   { transform: translateX(0);     opacity: 1; }
            }

            .slide-from-right {
                animation: slideFromRight 0.22s ease-out;
            }

            .slide-from-left {
                animation: slideFromLeft 0.22s ease-out;
            }

            .occupancy {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 1rem;
                font-weight: 500;
                min-height: 1.5rem;
                line-height: 1;

                .occ-item {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    line-height: 1;
                    height: 1.1rem;
                }

                .occ-item span,
                .occ-item i {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    line-height: 1;
                    height: 1.1rem;
                }

                .sep {
                    opacity: 0.7;
                }
            }

            .reservation-note {
                margin-top: 0.35rem;
                font-size: 0.9rem;
                line-height: 1.25;
                opacity: 0.95;
                min-height: 1.15rem;
                height: 1.15rem;
                display: block;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;

                &.hidden {
                    visibility: hidden;
                }
            }
        }

        .modal-body {
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            max-height: 60vh;
            overflow-y: auto;

            .section {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;

                .section-label {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    font-weight: 600;
                    font-size: 0.95rem;
                    color: var(--text-color-secondary);
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    padding-bottom: 0.25rem;
                    border-bottom: 1px solid var(--glass-border);
                }

                .tasks-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.35rem;

                    ::ng-deep app-task-card .task-card {
                        width: 100%;
                        box-sizing: border-box;
                    }
                }
            }

            .confirm-card {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0.35rem 0.75rem;
                border-radius: 6px;
                min-height: 2.75rem;
                cursor: pointer;
                background: linear-gradient(135deg, rgba(248, 113, 113, 0.85), rgba(239, 68, 68, 0.75));
                border: 1px solid rgba(248, 113, 113, 0.4);
                box-shadow: var(--glass-shadow), inset 0 1px 1px rgba(255, 255, 255, 0.15);
                transition: all 0.2s ease;

                &:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--glass-shadow-elevated), inset 0 1px 2px rgba(255, 255, 255, 0.25);
                }

                .confirm-card-left {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .house-num {
                    font-weight: 600;
                    color: white;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
                }

                .task-icon i {
                    color: white;
                    font-size: 0.875rem;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
                }
            }

            .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 0.75rem;
                padding: 2rem;
                color: var(--text-color-secondary);

                i {
                    font-size: 2.5rem;
                    opacity: 0.4;
                }
            }
        }
    `
})
export class HouseDetailModalComponent implements OnChanges {
    @Input() house: House | null = null;
    @Input() houseAvailabilities!: Signal<HouseAvailability[]>;
    @Input() tasks!: Signal<Task[]>;
    @Input() isUrgentIconVisibleMap: { [taskId: number]: boolean } = {};
    @Input() currentSeason: Season | null = null;
    @Input() visible = false;
    @Output() visibleChange = new EventEmitter<boolean>();

    private currentIndex = -1;
    private cachedSlots: { isGap: boolean; startDate: Date; endDate: Date | null; reservation?: HouseAvailability }[] = [];

    isCurrentSlotGap = true;
    reservationDateDisplay = '';
    occupancy = { adults: 0, dogs: 0, babies: 0, cribs: 0 };
    reservationNote = '';
    slideClass = '';
    private slideTimeout: any;

    constructor(
        public houseService: HouseService,
        public taskService: TaskService,
        private profileService: ProfileService,
        private storageService: StorageService,
    ) {}

    get isEmptyState(): boolean {
        return this.cachedSlots.length === 0;
    }

    get showOccupancy(): boolean {
        return !this.isCurrentSlotGap && !!(occupancy => occupancy.adults || occupancy.dogs || occupancy.babies || occupancy.cribs)(this.occupancy);
    }

    get canConfirmTasks(): boolean {
        return this.profileService.isHouseholdManager(this.storageService.getString(STORAGE_KEYS.PROFILE_ID)) ||
               this.profileService.isVoditeljKampa(this.storageService.getString(STORAGE_KEYS.PROFILE_ID));
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!this.house || !this.visible) return;
        if (changes['house'] || changes['visible']) {
            this.rebuildSlots();
            this.currentIndex = this.findInitialIndex();
            this.updateDisplayData();
        }
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

    get headerClass(): string {
        if (this.house && !this.house.is_active) return 'inactive';
        if (this.isCurrentSlotGap) return 'available';
        if (!this.house) return 'available';

        const slot = this.cachedSlots[this.currentIndex];
        if (!slot || slot.isGap) return 'available';

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const slotStart = new Date(slot.startDate);
        slotStart.setHours(0, 0, 0, 0);
        const slotEnd = new Date(slot.endDate!);
        slotEnd.setHours(23, 59, 59, 999);

        if (today < slotStart || today > slotEnd) {
            // Viewing a past or future reservation — show as booking, not current occupancy
            return 'arrival';
        }

        const id = this.house.house_id;
        if (this.houseService.isHouseReservedToday(id)) return 'arrival';
        if (this.houseService.hasScheduledNotCompletedTasks(id) || this.houseService.hasUnconfirmedCleaningTask(id)) return 'with-tasks';
        return 'occupied';
    }

    get confirmTasks(): Task[] {
        if (!this.house) return [];
        return this.tasks().filter(t =>
            t.house_id === this.house!.house_id &&
            this.taskService.isTaskCompleted(t) &&
            this.taskService.isHouseCleaningTask(t)
        );
    }

    get activeTasks(): Task[] {
        if (!this.house) return [];
        return this.tasks().filter(t =>
            t.house_id === this.house!.house_id &&
            !this.taskService.isTaskCompleted(t) &&
            !this.taskService.isTaskConfirmed(t)
        );
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
    }

    private triggerSlide(direction: 'prev' | 'next'): void {
        clearTimeout(this.slideTimeout);
        this.slideClass = direction === 'next' ? 'slide-from-right' : 'slide-from-left';
        this.slideTimeout = setTimeout(() => { this.slideClass = ''; }, 250);
    }

    @HostListener('document:keydown.escape')
    onEscape(): void {
        if (this.visible) this.close();
    }

    @HostListener('document:click', ['$event.target'])
    onMaskClick(target: EventTarget | null): void {
        if (this.visible && target instanceof HTMLElement && target.classList.contains('p-dialog-mask')) {
            this.close();
        }
    }

    close(): void {
        this.visible = false;
        this.visibleChange.emit(false);
    }

    openTaskDetails(task: Task): void {
        this.taskService.$taskModalData.next(task);
    }

    confirmTask(event: Event, task: Task): void {
        event.stopPropagation();
        const confirmed = this.taskService.getTaskProgressTypeByName(TaskProgressTypeName.Confirmed);
        if (confirmed) {
            this.taskService.updateTaskProgressType(task, confirmed.task_progress_type_id);
        }
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
            const start = new Date(slot.startDate);
            start.setHours(0, 0, 0, 0);
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
        if (!this.house) return;
        const fmt = (d: Date) => `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.`;

        if (this.cachedSlots.length === 0 || this.currentIndex === -1) {
            this.reservationDateDisplay = '----- - -----';
            this.isCurrentSlotGap = true;
            this.occupancy = { adults: 0, dogs: 0, babies: 0, cribs: 0 };
            this.reservationNote = '';
            return;
        }

        const slot = this.cachedSlots[this.currentIndex];
        this.isCurrentSlotGap = slot.isGap;

        if (slot.isGap) {
            this.reservationDateDisplay = `${fmt(slot.startDate)} - ${fmt(slot.endDate!)}`;
            this.occupancy = { adults: 0, dogs: 0, babies: 0, cribs: 0 };
            this.reservationNote = '';
        } else {
            const nextDay = new Date(slot.endDate!);
            nextDay.setDate(nextDay.getDate() + 1);
            this.reservationDateDisplay = `${fmt(slot.startDate)} - ${fmt(nextDay)}`;

            const res = slot.reservation;
            if (res) {
                this.occupancy = {
                    adults: res.adults || 0,
                    dogs: (res.dogs_d || 0) + (res.dogs_s || 0) + (res.dogs_b || 0),
                    babies: res.babies || 0,
                    cribs: res.cribs || 0,
                };
                this.reservationNote = res.note || '';
            }
        }
    }
}
