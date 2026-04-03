import { Component, effect, Input, Output, EventEmitter, Signal, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
                @if (hasCompletedHouseCleaningTask) {
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

        .house-content {
            padding: 0.5rem;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            overflow: visible;
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
    @Input() isUrgentIconVisibleMap: { [taskId: number]: boolean } = {};

    @Output() houseClick: EventEmitter<House> = new EventEmitter<House>();

    isInactive = false;
    isOccupied = false;
    isAvailable = false;
    isAvailableWithTasks = false;
    isAvailableWithArrival = false;

    notCompletedTasks: Task[] = [];
    hasCompletedHouseCleaningTask = false;

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
            this.notCompletedTasks = [];
            return;
        }

        this.isOccupied = this.houseService.isHouseOccupied(houseId);
        const hasScheduledTasks = this.houseService.hasScheduledNotCompletedTasks(houseId);
        const isReservedToday = this.houseService.isHouseReservedToday(houseId);

        this.hasCompletedHouseCleaningTask = this.houseService.getTasksForHouse(houseId)
            .some(t => this.taskService.isTaskCompleted(t) && this.taskService.isHouseCleaningTask(t));

        this.isAvailable = !this.isOccupied && !hasScheduledTasks && !isReservedToday && !this.hasCompletedHouseCleaningTask;
        this.isAvailableWithTasks = !this.isOccupied && (hasScheduledTasks || this.hasCompletedHouseCleaningTask) && !isReservedToday;
        this.isAvailableWithArrival = !this.isOccupied && !!isReservedToday;

        this.notCompletedTasks = this.houseService.getTasksForHouse(houseId)
            .filter(t => !this.taskService.isTaskCompleted(t) && !this.taskService.isTaskConfirmed(t));
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
}
