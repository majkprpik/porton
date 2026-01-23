import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { Task } from '../../core/models/data.models';
import { HouseService } from '../../core/services/house.service';
import { TaskService } from '../../core/services/task.service';
import { AddDaysPipe } from '../../shared/pipes/add-days.pipe';
import { ProfileService } from '../../core/services/profile.service';
import { StorageService, STORAGE_KEYS } from '../../core/services/storage.service';

@Component({
    selector: 'app-detailed-task-card',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        TranslateModule,
        AddDaysPipe,
    ],
    template: `
        <div class="task-card"
            [class.completed]="taskService.isTaskCompleted(task)"
            [class.confirmed]="taskService.isTaskConfirmed(task)"
            [class.assigned]="taskService.isTaskAssigned(task)"
            [class.not-assigned]="taskService.isTaskNotAssigned(task)"
            [class.in-progress]="taskService.isTaskInProgress(task) || taskService.isTaskPaused(task)"
            (click)="onCardClick()"
        >
            <div class="task-info">
                <div class="house-info">
                    <div class="house-number-and-icon">
                        <span class="house-number">{{houseService.getHouseName(task.house_id)}}</span>
                        @if(task.is_unscheduled){
                            @if(isUrgentIconVisible){
                                <div class="urgent-task-icon">
                                    <i class="fa fa-exclamation-triangle"></i>
                                </div>
                            } @else {
                                <div class="task-icon">
                                    <i [class]="taskService.getTaskIcon(task.task_type_id)"></i>
                                </div>
                            }
                        } @else {
                            <div class="task-icon">
                                <i [class]="taskService.getTaskIcon(task.task_type_id)"></i>
                            </div>
                        }
                    </div>
                    <div class="description">
                        {{task.description}}
                    </div>

                    <div class="next-reservation-date">
                        @if(
                            !houseService.isHouseOccupied(task.house_id) &&
                            !houseService.isHouseReservedToday(task.house_id) &&
                            houseService.getNextHouseAvailabilityForHouse(task.house_id)
                        ){
                            <span>
                                <b>Check IN</b>: {{ houseService.getNextHouseAvailabilityForHouse(task.house_id).house_availability_start_date | date: 'dd/MM/yyyy' }}
                            </span>
                            <span>
                                <b>Check OUT</b>: {{ houseService.getNextHouseAvailabilityForHouse(task.house_id).house_availability_end_date | addDays:1 | date: 'dd/MM/yyyy' }}
                            </span>
                        } @else if(houseService.getTodaysHouseAvailabilityForHouse(task.house_id).length == 1){
                            @if(houseService.hasArrivalForToday(task.house_id)){
                                <span>
                                    <b>Check IN</b>: {{ houseService.getTodaysHouseAvailabilityForHouse(task.house_id)[0].arrival_time.split(':').slice(0,2).join(':') }}
                                </span>
                                <span>
                                    <b>Check OUT</b>: {{ houseService.getTodaysHouseAvailabilityForHouse(task.house_id)[0].house_availability_end_date | addDays:1 | date: 'dd/MM/yyyy' }}
                                </span>
                            } @else if(houseService.hasDepartureForToday(task.house_id)){
                                <span>
                                    <b>Check OUT</b>: {{ houseService.getTodaysHouseAvailabilityForHouse(task.house_id)[0].departure_time.split(':').slice(0,2).join(':') }}
                                </span>
                                @if(houseService.getNextHouseAvailabilityForHouse(task.house_id)){
                                    <span>
                                        <b>Check IN</b>: {{ houseService.getNextHouseAvailabilityForHouse(task.house_id).house_availability_start_date | date: 'dd/MM/yyyy' }}
                                    </span>
                                }
                            } @else {
                                <span>
                                    <b>Check OUT</b>: {{ houseService.getTodaysHouseAvailabilityForHouse(task.house_id)[0].house_availability_end_date | addDays:1 | date: 'dd/MM/yyyy' }}
                                </span>
                                @if(houseService.getNextHouseAvailabilityForHouse(task.house_id)){
                                    <span>
                                        <b>Check IN</b>: {{ houseService.getNextHouseAvailabilityForHouse(task.house_id).house_availability_start_date | date: 'dd/MM/yyyy' }}
                                    </span>
                                }
                            }
                        } @else if(houseService.getTodaysHouseAvailabilityForHouse(task.house_id).length == 2){
                            @if(!houseService.getTodaysHouseAvailabilityForHouse(task.house_id)[0].has_departed){
                                <span>
                                    <b>Check OUT</b>: {{ houseService.getTodaysHouseAvailabilityForHouse(task.house_id)[0].departure_time.split(':').slice(0,2).join(':') }}
                                </span>
                                <span>
                                    <b>Check IN</b>: {{ houseService.getTodaysHouseAvailabilityForHouse(task.house_id)[1].arrival_time.split(':').slice(0,2).join(':') }}
                                </span>
                            } @else {
                                <span>
                                    <b>Check IN</b>: {{ houseService.getTodaysHouseAvailabilityForHouse(task.house_id)[1].arrival_time.split(':').slice(0,2).join(':') }}
                                </span>
                                <span>
                                    <b>Check OUT</b>: {{ houseService.getTodaysHouseAvailabilityForHouse(task.house_id)[1].house_availability_end_date | addDays:1 | date: 'dd/MM/yyyy' }}
                                </span>
                            }
                        }
                    </div>

                </div>
                <div class="task-status">
                    <i class="status-icon" [class]="taskService.getTaskStatusIcon(task)"></i>
                    <span>{{ 'TASK-PROGRESS-TYPES.' + taskService.getTaskProgressTypeById(task.task_progress_type_id)?.task_progress_type_name | translate }}</span>
                </div>
            </div>
            <div class="task-actions">
                <div class="reservation-numbers">
                    @if(houseService.getCurrentNumberOfAdults(task.house_id)){
                        <div class="adults-count">
                            <span>{{ houseService.getCurrentNumberOfAdults(task.house_id) }}</span>
                            <i class="fa-solid fa-person"></i>
                        </div>
                    }
                    @if(houseService.getCurrentNumberOfPets(task.house_id)){
                        <div class="pets-count">
                            <span>{{ houseService.getCurrentNumberOfPets(task.house_id) }}</span>
                            <i class="fa-solid fa-paw"></i>
                        </div>
                    }
                    @if(houseService.getCurrentNumberOfBabies(task.house_id)){
                        <div class="babies-count">
                            <span>{{ houseService.getCurrentNumberOfBabies(task.house_id) }}</span>
                            <i class="fa-solid fa-baby"></i>
                        </div>
                    }
                    @if(houseService.getCurrentNumberOfCribs(task.house_id)){
                        <div class="cribs-count">
                            <span>{{ houseService.getCurrentNumberOfCribs(task.house_id) }}</span>
                            <i class="fa-solid fa-baby-carriage"></i>
                        </div>
                    }
                </div>
                @if (!taskService.isTaskCompleted(task) && !taskService.isTaskConfirmed(task)) {
                    @if(
                        task.is_unscheduled ||
                        taskService.isRepairTask(task) ||
                        taskService.isSheetChangeTask(task) ||
                        taskService.isTowelChangeTask(task))
                    {
                        <div class="buttons">
                            @if (taskService.isHouseCleaningTask(task) && taskService.isTaskInProgress(task)) {
                                <p-button
                                    [label]="'BUTTONS.PAUSE' | translate"
                                    severity="warn"
                                    (onClick)="onTaskPause($event)"
                                ></p-button>
                            }

                            <p-button
                                [label]="'BUTTONS.' + getActionButtonLabel() | translate"
                                [severity]="getActionButtonSeverity()"
                                (onClick)="onTaskAction($event)"
                            ></p-button>
                        </div>
                    } @else if(houseService.isHouseOccupied(task.house_id)){
                        <span>{{ 'TEAMS.TEAM-DETAILS.HOUSE-OCCUPIED' | translate }}</span>
                    } @else {
                        <div class="buttons">
                            @if (taskService.isHouseCleaningTask(task) && taskService.isTaskInProgress(task)) {
                                <p-button
                                    [label]="'BUTTONS.PAUSE' | translate"
                                    severity="warn"
                                    (onClick)="onTaskPause($event)"
                                ></p-button>
                            }

                            <p-button
                                [label]="'BUTTONS.' + getActionButtonLabel() | translate"
                                [severity]="getActionButtonSeverity()"
                                (onClick)="onTaskAction($event)"
                            ></p-button>
                        </div>
                    }
                } @else if(isTaskCompletedForHouseholdManager()) {
                    <p-button
                        [label]="'BUTTONS.' + getActionButtonLabel() | translate"
                        [severity]="getActionButtonSeverity()"
                        (onClick)="onTaskAction($event)"
                    ></p-button>
                } @else if(taskService.isTaskConfirmed(task)) {
                    <span>{{ 'TEAMS.TEAM-DETAILS.TASK-CONFIRMED' | translate }}</span>
                } @else {
                    <span>{{ 'TEAMS.TEAM-DETAILS.TASK-FINISHED' | translate }}</span>
                }
            </div>
        </div>
    `,
    styles: `
        @media screen and (max-width: 800px){
            .task-card{
                width: 100% !important;
            }
        }

        .task-card {
            background: var(--surface-card);
            border-radius: 6px;
            padding: 1rem;
            height: 155px;
            width: 400px;

            cursor: pointer;
            transition: all 0.2s ease;
            box-sizing: border-box;

            backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
            -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow:
                var(--glass-shadow),
                inset 0 1px 1px rgba(255, 255, 255, 0.15);

            &:hover {
                transform: translateY(-4px);
                box-shadow:
                    var(--glass-shadow-elevated),
                    inset 0 1px 2px rgba(255, 255, 255, 0.25);
                border-color: rgba(255, 255, 255, 0.35);
            }

            &.completed {
                background: linear-gradient(
                    135deg,
                    rgba(248, 113, 113, 0.85),
                    rgba(239, 68, 68, 0.75)
                );
                border-color: rgba(248, 113, 113, 0.4);
                color: var(--p-surface-0);
            }

            &.confirmed {
                background: linear-gradient(
                    135deg,
                    rgba(248, 113, 113, 0.85),
                    rgba(239, 68, 68, 0.75)
                );
                border-color: rgba(248, 113, 113, 0.4);
                color: var(--p-surface-0);
            }

            &.in-progress {
                background: linear-gradient(
                    135deg,
                    rgba(250, 204, 21, 0.85),
                    rgba(234, 179, 8, 0.75)
                );
                border-color: rgba(250, 204, 21, 0.4);
                color: var(--p-surface-0);
            }

            &.assigned {
                background: linear-gradient(
                    135deg,
                    rgba(59, 130, 246, 0.85),
                    rgba(37, 99, 235, 0.75)
                );
                border-color: rgba(59, 130, 246, 0.4);
                color: var(--p-surface-0);
            }

            &.not-assigned {
                background: linear-gradient(
                    135deg,
                    rgba(34, 197, 94, 0.85),
                    rgba(22, 163, 74, 0.75)
                );
                border-color: rgba(34, 197, 94, 0.4);
                color: var(--p-surface-0);
            }

            .task-info {
                display: flex;
                align-items: flex-start;
                margin-bottom: 1rem;
            }

            .house-info {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
                width: 30%;
                flex-grow: 1;

                .house-number-and-icon {
                    display: flex;
                    gap: 5px;

                    .house-number {
                        font-size: 1.2rem;
                        font-weight: 600;
                    }

                    .task-icon {
                        font-size: 1.1rem;
                    }
                }

                .next-reservation-date {
                    height: 20px;
                    display: flex;
                    flex-direction: column;
                }

                .description {
                    width: 95%;
                    height: 20px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
            }

            .task-status {
                display: flex;
                align-items: center;
                gap: 0.5rem;

                .status-icon {
                    font-size: 1rem;
                }
            }

            .task-actions {
                display: flex;
                align-items: center;
                justify-content: space-between;
                height: 33px;

                .buttons {
                    display: flex;
                    gap: 10px;
                }

                .reservation-numbers {
                    display: flex;
                    align-items: center;
                    gap: 5px;

                    .adults-count,
                    .pets-count,
                    .babies-count,
                    .cribs-count {
                        display: flex;
                        gap: 5px;
                    }
                }
            }
        }

        .task-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 15px;

            i {
              font-size: 1rem;
            }

            .remove-icon {
                display: none;
                position: absolute;
                right: 0.5rem;
                color: var(--red-500);
                font-size: 1rem;
            }
        }

        .urgent-task-icon{
            display: flex;
            align-items: center;
            justify-content: center;
            width: 15px;

            i {
              color: red;
              font-size: 1rem;
              filter: drop-shadow(0 0 2px white);
            }
        }
    `
})
export class DetailedTaskCardComponent {
    STORAGE_KEYS = STORAGE_KEYS;

    @Input({ required: true }) task!: Task;
    @Input() isUrgentIconVisible = false;

    @Output() taskClicked = new EventEmitter<Task>();
    @Output() taskAction = new EventEmitter<{ event: Event; task: Task }>();
    @Output() taskPause = new EventEmitter<{ event: Event; task: Task }>();

    constructor(
        public houseService: HouseService,
        public taskService: TaskService,
        public profileService: ProfileService,
        public storageService: StorageService,
    ) {}

    onCardClick(): void {
        this.taskClicked.emit(this.task);
    }

    onTaskAction(event: Event): void {
        event.stopPropagation();
        this.taskAction.emit({ event, task: this.task });
    }

    onTaskPause(event: Event): void {
        event.stopPropagation();
        this.taskPause.emit({ event, task: this.task });
    }

    getActionButtonLabel(): string {
        if (this.taskService.isTaskInProgress(this.task)) {
            return 'FINISH';
        } else if (this.taskService.isTaskPaused(this.task)) {
            return 'CONTINUE';
        } else if (this.isTaskCompletedForHouseholdManager()) {
            return 'CONFIRM';
        }

        return 'START';
    }

    getActionButtonSeverity(): 'success' | 'info' | 'warn' | 'danger' | 'help' | 'primary' | 'secondary' | 'contrast' {
        if (this.taskService.isTaskInProgress(this.task)) return 'success';
        if (this.taskService.isTaskPaused(this.task)) return 'warn';
        return 'primary';
    }

    isTaskCompletedForHouseholdManager(){
        return this.profileService.isHouseholdManager(this.storageService.getString(STORAGE_KEYS.PROFILE_ID)) && this.taskService.isTaskCompleted(this.task);
    }
}
