import { Component, Input, Output, EventEmitter, Signal, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { House, HouseAvailability, Task, TaskProgressTypeName, ProfileRoles } from '../../core/models/data.models';
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

                <div class="house-name">{{ house?.house_name }}</div>

                <div class="date-nav">
                    <i class="fa fa-chevron-left nav-arrow" (click)="navigate('prev', $event)"></i>
                    <span>{{ reservationDateDisplay }}</span>
                    <i class="fa fa-chevron-right nav-arrow" (click)="navigate('next', $event)"></i>
                </div>

                @if (!isCurrentSlotGap && (occupancy.adults || occupancy.dogs || occupancy.babies || occupancy.cribs)) {
                    <div class="occupancy">
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

            .house-name {
                font-size: 1.5rem;
                font-weight: 700;
                text-shadow: 0 1px 2px rgba(0,0,0,0.2);
                margin-bottom: 0.4rem;
            }

            .date-nav {
                display: flex;
                align-items: center;
                gap: 0.6rem;
                font-size: 1rem;
                margin-bottom: 0.4rem;

                .nav-arrow {
                    cursor: pointer;
                    padding: 0.2rem 0.35rem;
                    border-radius: 50%;
                    transition: background 0.2s;

                    &:hover {
                        background: rgba(255,255,255,0.25);
                    }
                }
            }

            .occupancy {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 1rem;
                font-weight: 500;

                .occ-item {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                }

                .sep {
                    opacity: 0.7;
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
    @Input() visible = false;
    @Output() visibleChange = new EventEmitter<boolean>();

    private currentIndex = -1;
    private cachedSlots: { isGap: boolean; startDate: Date; endDate: Date | null }[] = [];

    isCurrentSlotGap = true;
    reservationDateDisplay = '';
    occupancy = { adults: 0, dogs: 0, babies: 0, cribs: 0 };

    constructor(
        public houseService: HouseService,
        public taskService: TaskService,
        private profileService: ProfileService,
        private storageService: StorageService,
    ) {}

    get canConfirmTasks(): boolean {
        return this.profileService.isHouseholdManager(this.storageService.getString(STORAGE_KEYS.PROFILE_ID)) ||
               this.profileService.isVoditeljKampa(this.storageService.getString(STORAGE_KEYS.PROFILE_ID));
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!this.house || !this.visible) return;
        if (changes['house'] || changes['visible']) {
            this.rebuildSlots();
            this.currentIndex = this.findTodayIndex();
            this.updateDisplayData();
        }
    }

    get headerClass(): string {
        if (this.isCurrentSlotGap) return 'available';
        if (!this.house) return 'available';
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
    }

    @HostListener('document:keydown.escape')
    onEscape(): void {
        if (this.visible) this.close();
    }

    @HostListener('document:click', ['$event.target'])
    onMaskClick(target: HTMLElement): void {
        if (this.visible && target?.classList?.contains('p-dialog-mask')) {
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
        const reservations = this.houseAvailabilities()
            .filter(a => a.house_id === this.house!.house_id)
            .sort((a, b) => new Date(a.house_availability_start_date).getTime() - new Date(b.house_availability_start_date).getTime());

        this.cachedSlots = [];
        if (!reservations.length) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const firstStart = new Date(reservations[0].house_availability_start_date);
        firstStart.setHours(0, 0, 0, 0);

        if (firstStart > today) {
            this.cachedSlots.push({ isGap: true, startDate: today, endDate: new Date(firstStart) });
        }

        for (let i = 0; i < reservations.length; i++) {
            const r = reservations[i];
            const next = reservations[i + 1];
            this.cachedSlots.push({
                isGap: false,
                startDate: new Date(r.house_availability_start_date),
                endDate: new Date(r.house_availability_end_date),
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

    private findTodayIndex(): number {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return this.cachedSlots.findIndex(slot => {
            if (slot.isGap) return false;
            const start = new Date(slot.startDate); start.setHours(0, 0, 0, 0);
            const end = new Date(slot.endDate!); end.setHours(23, 59, 59, 999);
            return today >= start && today <= end;
        });
    }

    private updateDisplayData(): void {
        if (!this.house) return;
        const fmt = (d: Date) => `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.`;

        if (this.cachedSlots.length === 0 || this.currentIndex === -1) {
            this.reservationDateDisplay = '----- - -----';
            this.isCurrentSlotGap = true;
            this.occupancy = { adults: 0, dogs: 0, babies: 0, cribs: 0 };
            return;
        }

        const slot = this.cachedSlots[this.currentIndex];
        this.isCurrentSlotGap = slot.isGap;

        if (slot.isGap) {
            this.reservationDateDisplay = `${fmt(slot.startDate)} - ${fmt(slot.endDate!)}`;
            this.occupancy = { adults: 0, dogs: 0, babies: 0, cribs: 0 };
        } else {
            const nextDay = new Date(slot.endDate!);
            nextDay.setDate(nextDay.getDate() + 1);
            this.reservationDateDisplay = `${fmt(slot.startDate)} - ${fmt(nextDay)}`;

            const nonGapsBefore = this.cachedSlots.slice(0, this.currentIndex + 1).filter(s => !s.isGap).length;
            const reservations = this.houseAvailabilities()
                .filter(a => a.house_id === this.house!.house_id)
                .sort((a, b) => new Date(a.house_availability_start_date).getTime() - new Date(b.house_availability_start_date).getTime());
            const res = reservations[nonGapsBefore - 1];
            if (res) {
                this.occupancy = {
                    adults: res.adults || 0,
                    dogs: (res.dogs_d || 0) + (res.dogs_s || 0) + (res.dogs_b || 0),
                    babies: res.babies || 0,
                    cribs: res.cribs || 0,
                };
            }
        }
    }
}
