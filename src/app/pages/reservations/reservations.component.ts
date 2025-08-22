import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, HostListener, effect } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { House, HouseAvailability, HouseType } from '../../core/models/data.models';
import { Subject, takeUntil, forkJoin, combineLatest, firstValueFrom } from 'rxjs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { LayoutService } from '../../layout/services/layout.service';
import { DataService } from '../../core/services/data.service';
import { TooltipModule } from 'primeng/tooltip';
import { ReservationFormComponent } from './reservation-form/reservation-form.component';
import { HouseService } from '../../core/services/house.service';

interface CellData {
    isReserved: boolean;
    color: string;
    displayText: string;
    tooltip: string;
    identifier: string;
    isToday: boolean;
    isSaturday: boolean;
    isSunday: boolean;
    isReservationStart: boolean;
    isReservationMiddle: boolean;
    isReservationEnd: boolean;
}

@Component({
    selector: 'app-reservations',
    template: `
        <div class="reservations-container">
            <div class="row">
                <div class="tabs">
                    <div class="house-type-tabs">
                        @for (type of houseTypes(); track type.house_type_id) {
                            <p-button 
                                [label]="type.house_type_name | titlecase" 
                                [severity]="selectedHouseTypeId() == type.house_type_id ? 'primary' : 'secondary'"
                                (click)="setSelectedHouseType(type.house_type_id)">
                            </p-button>  
                        }
                    </div>
                    <div class="density">
                        <p-button
                            class="density-button"
                            [severity]="cellHeightInPx == 40 ? 'primary': 'secondary'" 
                            (click)="changeCellHeight(40)"
                            [pTooltip]="'RESERVATIONS.HEADER.TOOLTIPS.ROW-HEIGHT-SPACIOUS' | translate" 
                            tooltipPosition="top"
                        >
                            <i class="pi pi-equals"></i>
                        </p-button>  
                        <p-button
                            class="density-button"
                            [severity]="cellHeightInPx == 30 ? 'primary': 'secondary'" 
                            (click)="changeCellHeight(30)"
                            [pTooltip]="'RESERVATIONS.HEADER.TOOLTIPS.ROW-HEIGHT-COMFORTABLE' | translate" 
                            tooltipPosition="top"
                        >
                            <i class="pi pi-bars"></i>
                        </p-button>  
                        <p-button
                            class="density-button"
                            [severity]="cellHeightInPx == 25 ? 'primary': 'secondary'" 
                            (click)="changeCellHeight(25)"
                            [pTooltip]="'RESERVATIONS.HEADER.TOOLTIPS.ROW-HEIGHT-COMPACT' | translate" 
                            tooltipPosition="top"
                        >
                            <i class="pi pi-align-justify"></i>
                        </p-button>  
                        @if(droppableSpots.length){
                            <p-button 
                                class="cancel-selection-button"
                                [label]="'BUTTONS.CANCEL-SELECTION' | translate" 
                                severity="danger"
                                (click)="clearAvailableSpaces()">
                            </p-button>  
                        }
                    </div>
                </div>
            </div>

            <div class="table-container">
                <table class="reservation-table">
                    <thead>
                        <tr>
                            <th class="house-header corner-header">{{ 'RESERVATIONS.HOUSE' | translate }}</th>
                            @for (day of days(); track day.getTime()) {
                                <th class="day-header" 
                                    [ngClass]="{
                                        'today-column': isToday(day),
                                        'saturday-column-day': isSaturday(day) && !isNightMode,
                                        'saturday-column-night': isSaturday(day) && isNightMode,
                                        'sunday-column-day': isSunday(day) && !isNightMode,
                                        'sunday-column-night': isSunday(day) && isNightMode,
                                    }"
                                    [title]="day.toLocaleDateString()"
                                    [ngStyle]="{'height': '30px'}"
                                >
                                    <div>{{ day | date: 'EEE' }} {{ day | date: 'dd.M.' }}</div>
                                </th>
                            }
                        </tr>
                    </thead>
                    <tbody>
                        @for (house of filteredHouses(); track house.house_id; let i = $index) {
                            <tr>
                                <th class="row-header" [ngClass]="{'active-row': selectedCellRowIndex() === i}">{{ house.house_name || house.house_number }}</th>
                                @for (day of days(); track day.getTime(); let j = $index) {
                                    <td 
                                        (dblclick)="onCellDoubleClick($event, i, j)"
                                        (mousedown)="onCellMouseDown($event, i, j)"
                                        (mousemove)="onCellMouseMove($event, i, j)"
                                        (click)="gridMatrix()[i][j].isReserved ? onReservationCellClick($event, i, j) : onCellClick($event, i, j)"
                                        [ngClass]="{
                                            'reserved-cell': gridMatrix()[i][j].isReserved,
                                            'selected-cell': isCellSelected(i, j),
                                            'selection-start': i === selectedCellRowIndex() && j === getStartColIndex(),
                                            'selection-end': i === selectedCellRowIndex() && j === getEndColIndex(),
                                            'past-date': isCellInPast(j),
                                            'today-column': isToday(days()[j]),
                                            'saturday-column-day': isSaturday(days()[j]) && !isNightMode,
                                            'saturday-column-night': isSaturday(days()[j]) && isNightMode,
                                            'sunday-column-day': isSunday(days()[j]) && !isNightMode,
                                            'sunday-column-night': isSunday(days()[j]) && isNightMode,
                                            'reservation-start': gridMatrix()[i][j].isReservationStart,
                                            'reservation-middle': gridMatrix()[i][j].isReservationMiddle,
                                            'reservation-end': gridMatrix()[i][j].isReservationEnd,
                                            'border-left-important': isToday(days()[j]) ? false : gridMatrix()[i][j].isReservationStart,
                                            'border-right-important': isToday(days()[j]) ? false : gridMatrix()[i][j].isReservationEnd,
                                            'border-top-important': gridMatrix()[i][j].isReservationStart || gridMatrix()[i][j].isReservationMiddle || gridMatrix()[i][j].isReservationEnd,
                                            'border-bottom-important': gridMatrix()[i][j].isReservationStart || gridMatrix()[i][j].isReservationMiddle || gridMatrix()[i][j].isReservationEnd,
                                            'free-column': isSpotAvailable(i, j),
                                            'height-25-important': cellHeightInPx == 25,
                                            'height-30-important': cellHeightInPx == 30,
                                            'height-40-important': cellHeightInPx == 40,
                                        }"
                                        [style.background-color]="gridMatrix()[i][j].color">
                                        @if (gridMatrix()[i][j].isReserved && gridMatrix()[i][j].isReservationStart) {
                                            <div class="reservation-item">
                                                <i class="pi pi-arrows-alt handle-icon" (click)="getDroppableSpotsForReservation($event, i, j)"></i>
                                                {{ gridMatrix()[i][j].displayText }}
                                            </div>
                                        } @else {
                                            @if (gridMatrix()[i][j].isReserved && gridMatrix()[i][j - 1].isReservationStart) {
                                                <div class="reservation-numbers">
                                                    @if (getNumberOfAdults(gridMatrix()[i][j])){
                                                        <div class="adults-count">
                                                            {{ getNumberOfAdults(gridMatrix()[i][j]) }} 
                                                            <i class="fa-solid fa-person"></i>
                                                        </div>
                                                    }
                                                    @if (getNumberOfPets(gridMatrix()[i][j])) {
                                                        <div class="pets-count">
                                                            {{ getNumberOfPets(gridMatrix()[i][j]) }} 
                                                            <i class="fa-solid fa-paw"></i>
                                                        </div>
                                                    } 
                                                    @if (getNumberOfBabies(gridMatrix()[i][j])) {
                                                        <div class="babies-count">
                                                            {{ getNumberOfBabies(gridMatrix()[i][j]) }}
                                                            <i class="fa-solid fa-baby"></i>
                                                        </div>
                                                    }
                                                    @if (getNumberOfCribs(gridMatrix()[i][j])) {
                                                        <div class="cribs-count">
                                                            {{ getNumberOfCribs(gridMatrix()[i][j]) }}
                                                            <i class="fa-solid fa-baby-carriage"></i>
                                                        </div>
                                                    }
                                                </div>
                                            }
                                        }
                                    </td>
                                }
                            </tr>
                        }
                    </tbody>
                </table>
            </div>

            @if(showReservationForm()){
                <app-reservation-form 
                    [houseId]="selectedHouseId()"
                    [startDate]="selectedStartDate()"
                    [endDate]="selectedEndDate()"
                    [reservation]="editingReservation()"
                    [visible]="showReservationForm()"
                    [colors]="colors"
                    (save)="handleReservationSave($event)"
                    (delete)="handleDeleteReservation($event)"
                    (cancel)="handleReservationCancel()"
                    (visibleChange)="handleVisibilityChange($event)">
                </app-reservation-form>
            }
        </div> 
    `,
    styles: 
    `
        .reservations-container{
            height: 88vh;
            width: 100%;
            background-color: var(--surface-card);
            border-radius: 10px;
            box-sizing: border-box;
            padding: 20px;
            overflow-y: hidden;
            position: relative;

            .profile-buttons{
                width: 100%;
                display: flex;
                flex-direction: row;
                gap: 10px;
                padding-bottom: 10px;
            }
        }

        .full-page-calendar {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            
            .handsontable-wrapper {
                flex: 1;
                overflow: auto;
                height: calc(100vh - 120px);
            }
            
            .htCenter {
                text-align: center;
            }
        }

        .reservation-2-container {
            display: none;
        }

        .handsontable td {
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            text-align: center;
            vertical-align: middle;
        }

        .house-type-tabs {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .house-type-tab {
            position: relative;
            padding: 5px 15px;
            font-weight: 500;
            cursor: pointer;
            border-radius: 6px;
            background-color: #f5f5f5;
            transition: all 0.2s ease;
            user-select: none;
            
            &:hover {
                background-color: #e9e9e9;
                transform: translateY(-2px);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            &.active {
                background-color: #007ad9;
                color: var(--surface-card);;
                font-weight: 600;
                
                &:after {
                    content: '';
                    position: absolute;
                    bottom: -6px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 8px solid transparent;
                    border-right: 8px solid transparent;
                    border-top: 8px solid #007ad9;
                }
            }
        }

        .house-type-filter {
            display: none;
        }

        .reservation-warning {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #fff3cd;
            color: #856404;
            border: 1px solid #ffeeba;
            border-radius: 4px;
            padding: 10px 15px;
            z-index: 1050;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            max-width: 400px;
            
            p {
                margin: 5px 0;
            }
        }

        .table-container {
            overflow-x: auto;
            overflow-y: auto;
            height: 94%;
            border: 1px solid #ddd;
            scroll-behavior: smooth;
            position: relative;
            width: 100%;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .reservation-table {
            border-collapse: separate;
            border-spacing: 0;
            width: auto;
            table-layout: fixed;
            margin: 0;

            box-shadow: none;
            
            & > thead > tr > th:first-child {
                z-index: 15 !important;
            }
            
            th, td {
                border: 1px solid #ddd;
                text-align: center;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                width: 120px !important;
                min-width: 120px;
                max-width: 120px;
            }

            .height-25-important{
                height: 25px !important;
            }

            .height-30-important{
                height: 30px !important;    
            }

            .height-40-important{
                height: 40px !important;
            }
            
            tbody tr:nth-child(even) {
                background-color: rgba(0, 0, 0, 0.01);
            }
            
            .house-header, .row-header {
                width: 80px !important;
                min-width: 80px;
                max-width: 80px;
            }
            
            .house-header {
                background-color: var(--surface-card);
                font-weight: bold;
                position: sticky;
                top: 0;
                left: 0;
                z-index: 10 !important;
                width: 80px !important;
                min-width: 80px;
                max-width: 80px;
                border: 1px solid #ddd;
                box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.05);
            }
            
            .day-header {
                background-color: var(--surface-card);
                font-weight: bold;
                position: sticky;
                top: 0;
                z-index: 5;
                border: 1px solid #ddd;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                
                &.today-column {
                    background-color: #e3f2fd !important;
                    font-weight: 900;
                    color: #0277bd;
                    box-shadow: 0 2px 4px rgba(33, 150, 243, 0.2);
                    border-top: 2px solid #2196f3 !important;
                    border-bottom: 2px solid #2196f3 !important;
                }
                
                &.saturday-column-day, &.saturday-column-night {
                    background-color: var(--surface-card);
                    font-style: italic;
                    color: var(--p-red-400);
                    font-size: 15px;
                }
                

                &.sunday-column-day, &.sunday-column-night {
                    background-color: var(--surface-card);
                    font-style: italic;
                    color: var(--p-red-500);
                    font-size: 15px;
                }
            }
            
            .row-header {
                background-color: var(--surface-card);
                font-weight: bold;
                position: sticky;
                left: 0;
                z-index: 5;
                border: 1px solid #ddd;
                box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
                
                &.active-row {
                    background-color: #e8f5e9;
                    color: #2e7d32;
                    border-left: 3px solid #4caf50;
                    font-weight: 900;
                }
            }
            
            .today-column {
                position: relative;
                
                &::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    width: 3px;
                    background-color: #2196f3;
                    left: 0;
                    opacity: 0.8;
                    z-index: 1;
                }
                
                &::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    width: 3px;
                    background-color: #2196f3;
                    right: 0;
                    opacity: 0.8;
                    z-index: 1;
                }
                
                box-shadow: inset 0 0 0 1000px rgba(33, 150, 243, 0.07) !important;
                border-top: 1px solid rgba(33, 150, 243, 0.4) !important;
                border-bottom: 1px solid rgba(33, 150, 243, 0.4) !important;
            }

            .free-column {
                background-color: greenyellow !important;

                &:hover{
                    cursor: pointer;
                }
            }

            .saturday-column-day {
                box-shadow: inset 0 0 0 1000px rgba(255, 240, 240, 0.3) !important;
            }

            .sunday-column-day {
                box-shadow: inset 0 0 0 1000px rgba(255, 238, 238, 0.3) !important;
            }

            .saturday-column-night {
                box-shadow: inset 0 0 0 1000px rgba(255, 240, 240, 0.09) !important;
            }

            .sunday-column-night {
                box-shadow: inset 0 0 0 1000px rgba(255, 238, 238, 0.09) !important;
            }
            
            .reserved-cell {
                color: #000;
                text-align: center;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                font-weight: bold;
                cursor: pointer;
                width: 120px;
                max-width: 120px;
                box-sizing: border-box;
                
                &.saturday-column-day,
                &.saturday-column-night,
                &.sunday-column-day,
                &.sunday-column-night,
                &.today-column {
                    background-color: inherit;
                }
                
                &.reservation-start {
                    position: relative;
                    z-index: 2;
                }
                
                &.reservation-middle {
                    position: relative;
                    z-index: 2;
                }
                
                &.reservation-end {
                    position: relative;
                    z-index: 2;
                }
            }
            user-select: none;
        }

        .custom-context-menu {
            position: fixed;
            background: var(--surface-card);
            border: 1px solid #ccc;
            box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            min-width: 200px;
            
            .context-menu-item {
                padding: 8px 12px;
                cursor: pointer;
                
                &:hover {
                    background-color: #f5f5f5;
                }
                
                i {
                    margin-right: 8px;
                }
            }
        }

        .selected-cell {
            position: relative;
            z-index: 5;
            outline: none !important;
            box-shadow: none !important;
            border-top: 2px solid #007bff !important;
            border-bottom: 2px solid #007bff !important;
            animation: none;
            
            &.selection-start:not(.selection-end) {
                border-left: 2px solid #007bff !important;
                border-right: none !important;
                border-top-left-radius: 4px;
                border-bottom-left-radius: 4px;
                animation: cell-selected-pulse 2s infinite;
            }
            
            &.selection-end:not(.selection-start) {
                border-right: 2px solid #007bff !important;
                border-left: none !important;
                border-top-right-radius: 4px;
                border-bottom-right-radius: 4px;
                animation: cell-selected-pulse 2s infinite;
            }
            
            &.selection-start.selection-end {
                border: 2px solid #007bff !important;
                border-radius: 4px;
                animation: cell-selected-pulse 2s infinite;
            }
            
            &:not(.selection-start):not(.selection-end) {
                border-left: none !important;
                border-right: none !important;
            }
            
            &.saturday-column, &.sunday-column, &.today-column {
                border-left: none !important;
                border-right: none !important;
                
                &.selection-start {
                    border-left: 2px solid #007bff !important;
                }
                
                &.selection-end {
                    border-right: 2px solid #007bff !important;
                }
                
                &.selection-start.selection-end {
                    border: 2px solid #007bff !important;
                }
            }
        }

        @keyframes cell-selected-pulse {
            0% {
                border-color: rgba(0, 123, 255, 1);
                background-color: rgba(0, 123, 255, 0.05);
            }
            50% {
                border-color: rgba(0, 123, 255, 0.7);
                background-color: rgba(0, 123, 255, 0.1);
            }
            100% {
                border-color: rgba(0, 123, 255, 1);
                background-color: rgba(0, 123, 255, 0.05);
            }
        }

        td.selected-reservation {
            background-color: rgba(0, 0, 0, 0.3) !important;
        }

        .today-indicator {
            font-size: 9px;
            line-height: 1;
            font-weight: bold;
            color: var(--surface-card);
            background-color: #2196f3;
            padding: 2px 4px;
            border-radius: 3px;
            margin-top: 2px;
            display: inline-block;
        }

        .day-header.today-column {
            background-color: #e3f2fd !important;
            font-weight: 900;
            color: #0277bd;
            box-shadow: none !important;
            border-top: 2px solid #2196f3 !important;
            border-bottom: 2px solid #2196f3 !important;
        }

        .corner-header {
            background-color: var(--surface-card);
            border: 1px solid #ccc !important;
            position: sticky !important;
            top: 0;
            left: 0;
            z-index: 15 !important; 
            box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1) !important;
        }

        .potential-drop-target,
        .valid-drop-target,
        .invalid-drop-target,
        .cdk-drag-preview,
        .cdk-drag-placeholder,
        .cdk-drag-animating,
        .cdk-drop-list-dragging,
        .reservation-preview {
            display: none;
        }

        .reservation-item {
            display: flex;
            align-items: center;
            
            .handle-icon {
                margin-right: 4px;
                opacity: 0.6;
                font-size: 12px;
                color: #333;
                padding: 2px;
                border-radius: 2px;
                
                &:hover {
                    opacity: 1;
                    background-color: rgba(0, 0, 0, 0.1);
                }
            }
            
            .reservation-text {
                flex: 1;
            }
        }

        .row{
            height: 45px;

            .tabs{
                display: flex;
                flex-direction: row;
                align-items: top;
                justify-content: space-between;

                .density{
                width: 500px;
                display: flex;
                flex-direction: row;
                align-items: top;
                justify-content: flex-end;
                gap: 10px;

                    .density-button{
                        max-height: 33px;

                        i{
                        font-size: 16px;
                        }
                    }
                }

                .cancel-selection-button{
                    margin-bottom: 8px;
                    padding-bottom: 5px;
                }
            }
        }

        .reservation-numbers{
            display: flex;
            flex-direction: row;
            width: 100%;
            justify-content: center;
            gap: 5px;
            box-sizing: border-box;
            padding: 0 10px 0 10px
        }

        .border-left-important {
            border-left: 1px solid black !important;
        }
        .border-right-important {
            border-right: 1px solid black !important;
        }
        .border-top-important {
            border-top: 1px solid black !important;
        }
        .border-bottom-important {
            border-bottom: 1px solid black !important;
        }
    `
    ,
    standalone: true,
    imports: [
        CommonModule, 
        ProgressSpinnerModule,
        ReservationFormComponent,
        TranslateModule,
        ButtonModule,
        TitleCasePipe,
        TooltipModule,
    ],
    providers: [DatePipe],
    changeDetection: ChangeDetectionStrategy.OnPush
}) 
export class Reservation2Component implements OnInit, OnDestroy {
    houses = signal<House[]>([]);
    houseAvailabilities = signal<HouseAvailability[]>([]);
    days = signal<Date[]>(this.generateDays());
    
    houseTypes = signal<HouseType[]>([]);
    selectedHouseTypeId = signal<number>(0);
    filteredHouses = computed(() => this.filterHousesByType());
    tempHouses: House[] = [];
    
    gridMatrix = signal<CellData[][]>([]);

    private reservationMap = new Map<string, HouseAvailability>();
    private houseIndexMap = new Map<number, number>();
    private dayIndexMap = new Map<number, number>();
    
    private destroy$ = new Subject<void>();
    
    private _previousHouseTypeId: number = 0;

    showReservationForm = signal<boolean>(false);
    selectedHouseId = signal<number>(0);
    selectedStartDate = signal<Date>(new Date());
    selectedEndDate = signal<Date>(new Date());
    editingReservation = signal<Partial<HouseAvailability>>({});
    
    nextReservationDate = signal<Date | null>(null);

    selectedCellRowIndex = signal<number>(-1);
    selectedCellColIndex = signal<number>(-1);

    selectedStartColIndex = signal<number>(-1);
    selectedEndColIndex = signal<number>(-1);
    isSelecting = signal<boolean>(false);

    selectedReservationId = signal<number | null>(null);

    droppableSpots: any = [];
    reservationToMove: any;

    private isFirstLoad = true;

    colors = ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFE4BA', '#E8BAFF', '#BAF2FF', '#FFC9BA', '#D4FFBA', '#FFBAEC'];

    isNightMode: boolean | undefined = undefined;

    cellHeightInPx: number = 30;

    constructor(
        private dataService: DataService,
        private houseService: HouseService,
        private messageService: MessageService,
        private translateService: TranslateService,
        private confirmationService: ConfirmationService,
        private datePipe: DatePipe,
        private layoutService: LayoutService,
    ) {

        effect(() => {
            this.isNightMode = this.layoutService.layoutConfig().darkTheme;
        });
    }

    ngOnInit(): void {
        this.dataService.loadHouses().pipe(takeUntil(this.destroy$)).subscribe();
        this.dataService.loadHouseAvailabilities().pipe(takeUntil(this.destroy$)).subscribe();
        this.dataService.getHouseTypes().pipe(takeUntil(this.destroy$)).subscribe(types => {
            this.houseTypes.set(types.filter(t => t.house_type_name != 'dodatno'));
            
            if (types && types.length > 0) {
                this.setSelectedHouseType(types[0].house_type_id);
            }
        });

        this.dataService.tempHouses$.subscribe(tempHouses => {
            this.tempHouses = tempHouses;
        });
        
        this.dataService.houses$
            .pipe(takeUntil(this.destroy$))
            .subscribe(houses => {
                this.houses.set(houses);
                this.updateGridMatrix();
                
                if (this.isFirstLoad && houses.length > 0) {
                    this.scrollToToday();
                }
            });

        forkJoin({
            temp: this.dataService.loadTempHouseAvailabilities(),
            main: this.dataService.loadHouseAvailabilities(),
        }).subscribe( ({temp, main}) => {
            const combined = [...main, ...temp];
            this.houseAvailabilities.set(combined);
            this.updateGridMatrix();
        });

        combineLatest([
            this.dataService.houseAvailabilities$,
            this.dataService.tempHouseAvailabilities$
        ]).subscribe({
            next: ([houseAvailabilities, tempHouseAvailabilities]) => {
                if(houseAvailabilities && tempHouseAvailabilities){
                    const combined = [...houseAvailabilities, ...tempHouseAvailabilities];
                    this.houseAvailabilities.set(combined);
                    this.updateGridMatrix();
                }
            },
            error: (error) => {
                console.error(error);
            }
        });
        
        this.dataService.$houseAvailabilitiesUpdate
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.dataService.loadHouseAvailabilities().pipe(takeUntil(this.destroy$)).subscribe();
            });
            
        this.loadCellHeight();

        setTimeout(() => {
            if (this.isFirstLoad) {
                this.scrollToToday();
                this.isFirstLoad = false;
            }
        }, 300);
    }
    
    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();

        this.houses.set([]);
        this.houseAvailabilities.set([]);
        this.days.set([]);
        this.gridMatrix.set([]);

        this.reservationMap.clear();
        this.houseIndexMap.clear();
        this.dayIndexMap.clear();
    }
    
    private updateGridMatrix(): void {
        const houses = this.filteredHouses();
        const days = this.days();
        const availabilities = this.houseAvailabilities();

        this.reservationMap.clear();
        this.houseIndexMap.clear();
        this.dayIndexMap.clear();

        houses.forEach((house, index) => {
            this.houseIndexMap.set(house.house_id, index);
        });

        days.forEach((day, index) => {
            this.dayIndexMap.set(day.getTime(), index);
        });

        availabilities.forEach(availability => {
            const startDate = new Date(availability.house_availability_start_date);
            const endDate = new Date(availability.house_availability_end_date);
            
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const key = this.getReservationKey(availability.house_id, d);
                this.reservationMap.set(key, availability);
            }
        });

        const grid: CellData[][] = [];
        for (const house of houses) {
            const row: CellData[] = [];
            
            for (const day of days) {
                const key = this.getReservationKey(house.house_id, day);
                const reservation = this.reservationMap.get(key);
                
                row.push(this.createCellData(day, reservation));
            }
            
            grid.push(row);
        }

        this.gridMatrix.set(grid);

        let reservedCellCount = 0;
        grid.forEach(row => {
            row.forEach(cell => {
                if (cell.isReserved) reservedCellCount++;
            });
        });
    }

    private getReservationKey(houseId: number, date: Date): string {
        return `${houseId}-${date.getTime()}`;
    }

    private createCellData(day: Date, reservation?: HouseAvailability): CellData {
        const cellData: CellData = {
            isReserved: false,
            color: '',
            displayText: '',
            tooltip: '',
            identifier: '',
            isToday: this.isToday(day),
            isSaturday: this.isSaturday(day),
            isSunday: this.isSunday(day),
            isReservationStart: false,
            isReservationMiddle: false,
            isReservationEnd: false
        };

        if (reservation) {
            const baseColor = this.colors[reservation.color_theme % this.colors.length];
            const opacity = 0.7 + (reservation.color_tint * 0.3);
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(baseColor);
            
            if (result) {
                const r = parseInt(result[1], 16);
                const g = parseInt(result[2], 16);
                const b = parseInt(result[3], 16);
                cellData.color = `rgba(${r}, ${g}, ${b}, ${opacity})`;
            } else {
                cellData.color = baseColor;
            }

            const startDate = new Date(reservation.house_availability_start_date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(reservation.house_availability_end_date);
            endDate.setHours(0, 0, 0, 0);
            const checkDate = new Date(day);
            checkDate.setHours(0, 0, 0, 0);
            
            cellData.isReservationStart = checkDate.getTime() === startDate.getTime();
            cellData.isReservationEnd = checkDate.getTime() === endDate.getTime();
            cellData.isReservationMiddle = checkDate > startDate && checkDate < endDate;
            
            if (reservation.house_availability_start_date === reservation.house_availability_end_date) {
                cellData.displayText = `${reservation.last_name} ${reservation.reservation_number}`;
                cellData.isReservationStart = true;
                cellData.isReservationEnd = true;
                cellData.isReservationMiddle = false;
            } else if (startDate.getTime() === checkDate.getTime()) {
                cellData.displayText = reservation.last_name || '';
            } else {
                const secondDay = new Date(startDate);
                secondDay.setDate(secondDay.getDate() + 1);
                secondDay.setHours(0, 0, 0, 0);
                if (checkDate.getTime() === secondDay.getTime()) {
                    cellData.displayText = reservation.reservation_number || '';
                }
            }

            const resStartDate = new Date(reservation.house_availability_start_date);
            const resEndDate = new Date(reservation.house_availability_end_date);
            cellData.tooltip = `Reservation: ${reservation.last_name || 'Unknown'}`;
            cellData.tooltip += `\nFrom: ${resStartDate.toLocaleDateString()}`;
            cellData.tooltip += `\nTo: ${resEndDate.toLocaleDateString()}`;
            if (reservation.reservation_number) cellData.tooltip += `\nRef: ${reservation.reservation_number}`;
            if (reservation.adults > 0) cellData.tooltip += `\nAdults: ${reservation.adults}`;
            if (reservation.babies > 0) cellData.tooltip += `\nBabies: ${reservation.babies}`;
            if (reservation.dogs_d > 0) cellData.tooltip += `\nPets: ${reservation.dogs_d}`;
            if (reservation.dogs_b > 0) cellData.tooltip += `\nBig pets: ${reservation.dogs_b}`;
            if (reservation.dogs_s > 0) cellData.tooltip += `\nSmall pets: ${reservation.dogs_s}`;
            if (reservation.cribs > 0) cellData.tooltip += `\nCribs: ${reservation.cribs}`;

            cellData.identifier = `res-${reservation.house_id}-${new Date(reservation.house_availability_start_date).getTime()}`;
            cellData.isReserved = true;
        }

        return cellData;
    }

    clearAvailableSpaces(){
        this.reservationToMove = undefined;
        this.droppableSpots = [];
    }

    getReservationByRowAndColumn(row: number, col: number){
        const houses = this.filteredHouses();
        const days = this.days();

        const house = houses[row];
        const day = days[col];
        
        const key = this.getReservationKey(house.house_id, day);
        const reservation = this.reservationMap.get(key);

        return reservation;
    }

    isSpotAvailable(row: number, col: number){
        if(!this.droppableSpots.length) return;

        const house = this.filteredHouses()[row];
        const day = this.days()[col];

        return this.droppableSpots.some((ds: any) => ds.house_id == house.house_id && ds.date.getTime() == day.getTime());
    }

    getDroppableSpotsForReservation(event: any, row: any, col: any){
        event.stopPropagation();
        this.droppableSpots = [];

        const reservation = this.getReservationByRowAndColumn(row, col);
        if(!reservation) return;

        if(this.reservationToMove && reservation.house_availability_id == this.reservationToMove.house_availability_id){
            this.clearAvailableSpaces();
            return;
        }

        this.reservationToMove = reservation;
        const houses = this.filteredHouses();
        const days = this.days();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const reservationLength = this.getSelectedReservationLength(this.reservationToMove);

        houses.forEach(house => {
            days.forEach(day => {
                if(day < today) return;

                const k = this.getReservationKey(house.house_id, day);
                const res = this.reservationMap.get(k);
                let isDroppable = false;

                if(!res){
                    isDroppable = this.isNumberOfDaysAvailableInTheFuture(day, house.house_id, reservationLength);
                } else if(res && res.house_availability_id == this.reservationToMove.house_availability_id){
                    isDroppable = this.isNumberOfDaysAvailableInTheFuture(day, house.house_id, reservationLength);
                } else if(res && res.house_availability_id != this.reservationToMove.house_availability_id){
                    return;
                }

                if(isDroppable){
                    this.droppableSpots.push({
                        house_id: house.house_id,
                        date: day,
                    });
                }
            });
        });
    }

    isNumberOfDaysAvailableInTheFuture(startDay: Date, houseId: number, numberOfDays: number): boolean{
        const house = this.filteredHouses().find(house => house.house_id == houseId);
        if(!house) return false;

        const days = this.days();
        let daysCount = 0;

        for(let day of days){
            if(day < startDay) continue;
    
            const k = this.getReservationKey(house.house_id, day);
            const res = this.reservationMap.get(k);
    
            if(res && res.house_availability_id != this.reservationToMove.house_availability_id) return false;
    
            daysCount++;
            
            if(daysCount >= numberOfDays) {
                return true;
            }
        }

        return false;
    }

    private getSelectedReservationLength(reservation: HouseAvailability){
        const start = new Date(reservation.house_availability_start_date);
        const end = new Date(reservation.house_availability_end_date);
        const timeDiff = end.getTime() - start.getTime();
        return Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;
    }

    private generateDays(): Date[] {
        const days: Date[] = [];
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear, 2, 31);
        const endDate = new Date(currentYear, 10, 15);
        
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            days.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return days;
    }

    isToday(date: Date): boolean {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    isSaturday(date: Date): boolean {
        return date.getDay() === 6;
    }

    isSunday(date: Date): boolean {
        return date.getDay() === 0;
    }
    
    getNumberOfAdults(grid: any){
        if(grid.tooltip){
            const match = grid.tooltip.match(/Adults:\s*(\d+)/);
            const adults = match ? parseInt(match[1], 10) : null;

            return adults;
        }

        return '';
    }

    getNumberOfCribs(grid: any){
        if(grid.tooltip){
            const cribs = grid.tooltip.match(/Cribs:\s*(\d+)/);

            if(!cribs){
                return '';
            }

            const cribsCount = cribs ? parseInt(cribs[1], 10) : 0;

            return cribsCount;
        }

        return '';
    }

    getNumberOfPets(grid: any){
        if(grid.tooltip){
            const pets = grid.tooltip.match(/Pets:\s*(\d+)/);
            const smallPets = grid.tooltip.match(/Small pets:\s*(\d+)/);
            const bigPets = grid.tooltip.match(/Big pets:\s*(\d+)/);

            if (!pets && !smallPets && !bigPets) {
                return '';
            }

            const petsCount = pets ? parseInt(pets[1], 10) : 0;
            const smallPetsCount = smallPets ? parseInt(smallPets[1], 10) : 0;
            const bigPetsCount = bigPets ? parseInt(bigPets[1], 10) : 0;

            return petsCount + smallPetsCount + bigPetsCount;
        }

        return '';
    }

    getNumberOfBabies(grid: any){
        if(grid.tooltip){ 
            const babies = grid.tooltip.match(/Babies:\s*(\d+)/);

            if(!babies){
                return '';
            }

            const babiesCount = babies ? parseInt(babies[1], 10) : 0;

            return babiesCount;
        }

        return '';
    }

    handleEditReservation(row: number, col: number): void {
        this.showReservationForm.set(false);
        
        const houses = this.filteredHouses();
        const days = this.days();
        
        if (houses.length > row && days.length > col) {
            const house = houses[row];
            const day = days[col];
            
            const key = this.getReservationKey(house.house_id, day);
            const reservation = this.reservationMap.get(key);
            
            if (!reservation) {
                return;
            }
            
            this.selectedHouseId.set(reservation.house_id);
            
            const startDate = new Date(reservation.house_availability_start_date);
            const endDate = new Date(reservation.house_availability_end_date);
            
            this.selectedStartDate.set(startDate);
            this.selectedEndDate.set(endDate);
            
            this.editingReservation.set({
                ...reservation
            });
            
            this.updateNextReservationDate();
            
            setTimeout(() => {
                if (this.showReservationForm()) {
                    this.showReservationForm.set(false);
                    setTimeout(() => {
                        this.showReservationForm.set(true);
                    }, 100);
                } else {
                    this.showReservationForm.set(true);
                }
            }, 0);
        }
    }

    handleDeleteReservation(data: { availabilityId: number; houseId: number }): void {
        const reservation = this.houseAvailabilities().find(
            avail => avail.house_availability_id === data.availabilityId
        );
        
        if (!reservation) return;
        
        this.updateGridMatrix();
        this.houseService.deleteHouseAvailability(data.availabilityId, data.houseId);
    }

    handleAddReservation(row: number, col: number): void {
        this.showReservationForm.set(false);
        
        const houses = this.filteredHouses();
        const days = this.days();
        
        if (houses.length > row && days.length > col) {
            const house = houses[row];
            
            let startDate: Date;
            let endDate: Date;
            
            if (this.selectedCellRowIndex() === row && 
                this.selectedStartColIndex() >= 0 && 
                this.selectedEndColIndex() >= 0 && 
                this.selectedStartColIndex() !== this.selectedEndColIndex()) {
                const startCol = Math.min(this.selectedStartColIndex(), this.selectedEndColIndex());
                const endCol = Math.max(this.selectedStartColIndex(), this.selectedEndColIndex());
                
                startDate = new Date(days[startCol]);
                endDate = new Date(days[endCol]);
            } else {
                startDate = new Date(days[col]);
                endDate = new Date(days[col]);
            }
            
            this.openReservationForm(house, startDate, endDate);
        }
    }

    private formatDateToYYYYMMDD(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    handleReservationSave(reservation: HouseAvailability): void {
        let startDateStr = reservation.house_availability_start_date;
        let endDateStr = reservation.house_availability_end_date;
        
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return;
        }
        
        if (endDate < startDate) {
            return;
        }
        
        const isEditing = reservation.house_availability_id && reservation.house_availability_id < 1000000;
        const currentReservationId = isEditing ? reservation.house_availability_id : undefined;
        
        const nextReservation = this.findNextReservation(reservation.house_id, startDate, currentReservationId);
        if (nextReservation) {
            const nextStartDate = new Date(nextReservation.house_availability_start_date);
            
            if (endDate >= nextStartDate) {
                return;
            }
        }
        
        const formattedStartDate = this.formatDateToYYYYMMDD(startDate);
        const formattedEndDate = this.formatDateToYYYYMMDD(endDate);
        
        if (isEditing) {
            const updatedReservation: HouseAvailability = {
                ...reservation,
                house_availability_start_date: formattedStartDate,
                house_availability_end_date: formattedEndDate,
                reservation_length: this.calculateDaysBetween(startDate, endDate) + 1,
            };
            
            this.showReservationForm.set(false);
            this.houseService.updateHouseAvailability(updatedReservation);
        } else {
            const newReservation: HouseAvailability = {
                ...reservation,
                house_availability_id: Math.floor(Math.random() * 100000) + 10000000,
                house_availability_start_date: formattedStartDate,
                house_availability_end_date: formattedEndDate,
                reservation_length: this.calculateDaysBetween(startDate, endDate) + 1
            };
            
            if (!newReservation.has_arrived) newReservation.has_arrived = false;
            if (!newReservation.has_departed) newReservation.has_departed = false;
            if (!newReservation.prev_connected) newReservation.prev_connected = false;
            if (!newReservation.next_connected) newReservation.next_connected = false;
            if (!newReservation.color_theme && newReservation.color_theme !== 0) newReservation.color_theme = Math.floor(Math.random() * 10);
            if (!newReservation.color_tint && newReservation.color_tint !== 0) newReservation.color_tint = 0.5;
            if (!newReservation.adults) newReservation.adults = 0;
            if (!newReservation.babies) newReservation.babies = 0;
            if (!newReservation.cribs) newReservation.cribs = 0;
            if (!newReservation.dogs_d) newReservation.dogs_d = 0;
            if (!newReservation.dogs_s) newReservation.dogs_s = 0;
            if (!newReservation.dogs_b) newReservation.dogs_b = 0;
            
            this.showReservationForm.set(false);
            this.houseService.createHouseAvailability(newReservation);
        }
    }
    
    handleReservationCancel(): void {
        this.showReservationForm.set(false);
        
        setTimeout(() => {
            this.editingReservation.set({});
        }, 100);
    }
    
    handleVisibilityChange(isVisible: boolean): void {
        this.showReservationForm.set(isVisible);
        
        if (!isVisible) {
            setTimeout(() => {
                this.editingReservation.set({});
                this.nextReservationDate.set(null);
            }, 100);
        } else if (isVisible) {
            this.updateNextReservationDate();
        }
    }

    private updateNextReservationDate(): void {
        const houseId = this.selectedHouseId();
        const startDate = this.selectedStartDate();
        
        if (!houseId || !startDate) {
            this.nextReservationDate.set(null);
            return;
        }
        
        const nextReservation = this.findNextReservation(houseId, startDate);
        if (nextReservation) {
            const nextDate = new Date(nextReservation.house_availability_start_date);
            this.nextReservationDate.set(nextDate);
        } else {
            this.nextReservationDate.set(null);
        }
    }
    
    private calculateDaysBetween(startDate: Date, endDate: Date): number {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        
        const diffInMs = end.getTime() - start.getTime();
        
        return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    }

    private findNextReservation(houseId: number, afterDate: Date, excludeReservationId?: number): HouseAvailability | null {
        const availabilities = this.houseAvailabilities();
        const afterDateMs = new Date(afterDate).setHours(0, 0, 0, 0);
        
        const futureReservations = availabilities.filter(avail => {
            if (avail.house_id !== houseId) return false;
            if (excludeReservationId && avail.house_availability_id === excludeReservationId) return false;
            
            const startDateMs = new Date(avail.house_availability_start_date).setHours(0, 0, 0, 0);
            
            return startDateMs > afterDateMs;
        });
        
        if (futureReservations.length > 0) {
            return futureReservations.sort((a, b) => {
                const aDate = new Date(a.house_availability_start_date).getTime();
                const bDate = new Date(b.house_availability_start_date).getTime();
                return aDate - bDate;
            })[0];
        }
        
        return null;
    }

    hasCellReservation(row: number, col: number): boolean {
        if (row < 0 || col < 0) return false;
        
        const grid = this.gridMatrix();
        if (!grid || grid.length === 0) return false;
        
        if (row >= grid.length) return false;
        
        const rowData = grid[row];
        if (!rowData || col >= rowData.length) return false;
        
        return rowData[col]?.isReserved === true;
    }

    private filterHousesByType(): House[] {
        const houses = this.houses();
        const selectedTypeId = this.selectedHouseTypeId();
        
        const filteredHouses = houses.filter(house => house.house_type_id === selectedTypeId);
        const dummyHouses = this.tempHouses.filter(th => th.house_type_id == selectedTypeId);
        
        for (let i = 0; i < dummyHouses.length; i++) {
            filteredHouses.push(dummyHouses[i]);
        }
        
        return filteredHouses;
    }

    scrollToToday(): void {
        setTimeout(() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const todayIndex = this.days().findIndex(day => {
                const d = new Date(day);
                d.setHours(0, 0, 0, 0);
                return d.getTime() === today.getTime();
            });
            
            if (todayIndex >= 0) {
                const dayHeaders = document.querySelectorAll('.day-header');
                if (dayHeaders.length > todayIndex) {
                    const todayHeader = dayHeaders[todayIndex] as HTMLElement;
                    
                    const tableContainer = document.querySelector('.table-container');
                    if (tableContainer) {
                        const containerWidth = tableContainer.clientWidth;
                        const columnPosition = todayHeader.offsetLeft;
                        const columnWidth = todayHeader.offsetWidth;
                        
                        const scrollLeft = columnPosition - (containerWidth / 2) + (columnWidth / 2);
                        tableContainer.scrollLeft = scrollLeft > 0 ? scrollLeft : 0;
                    }
                }
            }
        }, 100);
    }
    
    setSelectedHouseType(typeId: number): void {
        if (this._previousHouseTypeId !== typeId && typeId !== null) {
            this._previousHouseTypeId = typeId;
            this.selectedHouseTypeId.set(typeId);
            
            this.updateGridMatrix();
            
            if (this.isFirstLoad) {
                this.scrollToToday();
                this.isFirstLoad = false;
            }
        }
    }

    onCellDoubleClick(event: MouseEvent, row: number, col: number): void {
        const houses = this.filteredHouses();
        const days = this.days();
        
        if (houses.length > row && days.length > col) {
            const isReserved = this.hasCellReservation(row, col);
            
            if (isReserved) {
                this.handleEditReservation(row, col);
            } else {
                this.handleAddReservation(row, col);
            }
        }
    }

    isDateInPast(date: Date): boolean {
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0); 
        
        return checkDate < today;
    }

    isCellInPast(col: number): boolean {
        const days = this.days();
        if (col < 0 || col >= days.length) return false;
        
        return this.isDateInPast(days[col]);
    }

    moveReservation(row: number, col: number){
        if(!this.reservationToMove) return;

        const reservationLength = this.getSelectedReservationLength(this.reservationToMove);
        const selectedHouse = this.filteredHouses()[row];
        const selectedDay = this.days()[col];

        const endDate = new Date(selectedDay);
        endDate.setDate(endDate.getDate() + reservationLength - 1)

        const houseToMove = this.houses().find(house => house.house_id == this.reservationToMove.house_id);
        const dayToMove = this.reservationToMove.house_availability_start_date;

        this.confirmationService.confirm({
            header: this.translateService.instant('RESERVATIONS.MODAL.MOVE-RESERVATION'),
            message: this.translateService.instant('RESERVATIONS.MESSAGES.CONFIRM-MOVE-RESERVATION', {
                name: this.reservationToMove.last_name || 'Guest',
                old_house_number: houseToMove?.house_number || 'N/A',
                old_start_date: this.datePipe.transform(dayToMove, 'dd.MM'),
                new_house_number: selectedHouse?.house_number || 'N/A',
                new_start_date: this.datePipe.transform(selectedDay, 'dd.MM')
            }),
            icon: 'pi pi-exclamation-triangle',
            rejectLabel: 'Cancel',
            rejectButtonProps: {
                label: this.translateService.instant('BUTTONS.CANCEL'),
                severity: 'secondary',
                outlined: true
            },
            acceptButtonProps: {
                label: this.translateService.instant('BUTTONS.CONFIRM'),
                severity: 'danger'
            },
            accept: async () => {
                const reservationCopy = { 
                    ...this.reservationToMove,
                    house_id: selectedHouse.house_id,
                    house_availability_start_date: selectedDay.toLocaleDateString('en-CA').split('T')[0],
                    house_availability_end_date: endDate.toLocaleDateString('en-CA').split('T')[0],
                };

                //ne moze update jer mogu biti razlicite tablice, nekad temp_house_availability, a nekad house_availability, zato ide delete pa create novi
                try {
                    const deleted = await this.houseService.deleteHouseAvailability(
                        this.reservationToMove.house_availability_id,
                        this.reservationToMove.house_id
                    );

                    if (deleted) {
                        const saved = await this.houseService.createHouseAvailability(reservationCopy);

                        if (saved) {
                            this.clearAvailableSpaces();
                        }
                    }
                } catch (error) {
                    console.error('Error while moving reservation:', error);
                    this.clearAvailableSpaces();
                }
            },
            reject: () => {
                this.messageService.add({ severity: 'warn', summary: this.translateService.instant('APP-LAYOUT.TASK-DETAILS.MESSAGES.CANCELLED'), detail: this.translateService.instant('APP-LAYOUT.TASK-DETAILS.MESSAGES.REMOVE-IMAGE.CANCELLED') });
                this.clearAvailableSpaces();
            }
        });
    }

    onCellMouseDown(event: MouseEvent, row: number, col: number): void {
        if(this.isSpotAvailable(row, col)){
            this.moveReservation(row, col);
            return;
        }

        this.clearAvailableSpaces();

        if (this.hasCellReservation(row, col)) {
            return;
        }
        
        if (this.isCellInPast(col)) {
            return;
        }
        
        this.selectedCellRowIndex.set(row);
        this.selectedStartColIndex.set(col);
        this.selectedEndColIndex.set(col);
        this.isSelecting.set(true);
        
        event.preventDefault();
    }

    onCellMouseMove(event: MouseEvent, row: number, col: number): void {
        if (this.isSelecting() && row === this.selectedCellRowIndex()) {
            if (this.hasCellReservation(row, col)) {
                return;
            }
            
            if (this.isCellInPast(col)) {
                return;
            }
            
            const startCol = this.selectedStartColIndex();
            const minCol = Math.min(startCol, col);
            const maxCol = Math.max(startCol, col);
            
            for (let checkCol = minCol; checkCol <= maxCol; checkCol++) {
                if (this.hasCellReservation(row, checkCol) || this.isCellInPast(checkCol)) {
                    if (col > startCol) {
                        let lastValidCol = startCol;
                        for (let c = startCol + 1; c < checkCol; c++) {
                            if (!this.hasCellReservation(row, c) && !this.isCellInPast(c)) {
                                lastValidCol = c;
                            }
                        }
                        this.selectedEndColIndex.set(lastValidCol);
                    } else {
                        let lastValidCol = startCol;
                        for (let c = startCol - 1; c > checkCol; c--) {
                            if (!this.hasCellReservation(row, c) && !this.isCellInPast(c)) {
                                lastValidCol = c;
                            }
                        }
                        this.selectedEndColIndex.set(lastValidCol);
                    }
                    return;
                }
            }
            
            this.selectedEndColIndex.set(col);
        }
    }

    onCellClick(event: MouseEvent, row: number, col: number): void {
        if (this.hasCellReservation(row, col)) {
            return;
        }
        
        if (this.isCellInPast(col)) {
            return;
        }
        
        this.selectedCellRowIndex.set(row);
        this.selectedCellColIndex.set(col);
        
        this.selectedStartColIndex.set(col);
        this.selectedEndColIndex.set(col);
        this.isSelecting.set(true);
        
        event.stopPropagation();
    }

    @HostListener('document:mouseup')
    onDocumentMouseUp(): void {
        setTimeout(() => {
            if (this.isSelecting()) {
                this.isSelecting.set(false);

                const dateRange = this.getSelectedDateRange();
                if (dateRange && this.selectedCellRowIndex() >= 0) {
                    const houses = this.filteredHouses();
                    const row = this.selectedCellRowIndex();

                    if (houses.length > row) {
                        const house = houses[row];
                        this.openReservationForm(house, dateRange.startDate, dateRange.endDate);
                    }
                }
            }
        });
    }

    private openReservationForm(house: House, startDate: Date, endDate: Date): void {
        this.editingReservation.set({});
        
        const formStartDate = new Date(startDate);
        const formEndDate = new Date(endDate);
        
        formStartDate.setHours(0, 0, 0, 0);
        formEndDate.setHours(0, 0, 0, 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (formStartDate.getTime() === today.getTime()) {
            const todayCopy = new Date();
            todayCopy.setHours(0, 0, 0, 0);
            this.selectedStartDate.set(todayCopy);
        } else {
            this.selectedStartDate.set(formStartDate);
        }
        
        this.selectedHouseId.set(house.house_id);
        this.selectedEndDate.set(formEndDate);
        
        this.updateNextReservationDate();
        
        const startDateString = this.formatDateToYYYYMMDD(formStartDate);
        const endDateString = this.formatDateToYYYYMMDD(formEndDate);
        
        const nextReservation = this.findNextReservation(house.house_id, formStartDate);
        if (nextReservation) {
            const nextStartDate = new Date(nextReservation.house_availability_start_date);
            nextStartDate.setHours(0, 0, 0, 0);
            
            if (formEndDate >= nextStartDate) {
                const adjustedEndDate = new Date(nextStartDate);
                adjustedEndDate.setDate(adjustedEndDate.getDate() - 1);
                this.selectedEndDate.set(adjustedEndDate);
            }
        }
        
        setTimeout(() => {
            this.editingReservation.set({
                house_id: house.house_id,
                house_availability_start_date: startDateString,
                house_availability_end_date: endDateString,
                color_theme: Math.floor(Math.random() * 10),
                color_tint: 0.5,
                adults: 2,
                babies: 0,
                cribs: 0,
                has_arrived: false,
                has_departed: false,
                prev_connected: false,
                next_connected: false,
                dogs_b: 0,
                dogs_d: 0,
                dogs_s: 0,
            });
            
            if (this.showReservationForm()) {
                this.showReservationForm.set(false);
                setTimeout(() => {
                    this.showReservationForm.set(true);
                }, 100);
            } else {
                this.showReservationForm.set(true);
            }
        }, 0);
        
        this.clearSelection();
    }

    isCellSelected(row: number, col: number): boolean {
        if (row !== this.selectedCellRowIndex()) return false;
        
        const startCol = Math.min(this.selectedStartColIndex(), this.selectedEndColIndex());
        const endCol = Math.max(this.selectedStartColIndex(), this.selectedEndColIndex());
        
        return col >= startCol && col <= endCol;
    }

    getStartColIndex(): number {
        if (this.selectedStartColIndex() < 0 || this.selectedEndColIndex() < 0) return -1;
        return Math.min(this.selectedStartColIndex(), this.selectedEndColIndex());
    }

    getEndColIndex(): number {
        if (this.selectedStartColIndex() < 0 || this.selectedEndColIndex() < 0) return -1;
        return Math.max(this.selectedStartColIndex(), this.selectedEndColIndex());
    }

    getSelectedDateRange(): { startDate: Date, endDate: Date } | null {
        const row = this.selectedCellRowIndex();
        if (row < 0) return null;
        
        const startCol = Math.min(this.selectedStartColIndex(), this.selectedEndColIndex());
        const endCol = Math.max(this.selectedStartColIndex(), this.selectedEndColIndex());
        
        if (startCol < 0 || endCol < 0) return null;
        
        const days = this.days();
        if (startCol >= days.length || endCol >= days.length) return null;
        
        return {
            startDate: new Date(days[startCol]),
            endDate: new Date(days[endCol])
        };
    }

    @HostListener('document:click', ['$event'])
    clearSelectionOnOutsideClick(event: MouseEvent): void {
        const tableElement = (event.target as HTMLElement).closest('.reservation-table');
        if (!tableElement) {
            this.selectedCellRowIndex.set(-1);
            this.selectedStartColIndex.set(-1);
            this.selectedEndColIndex.set(-1);
        }
    }

    private clearSelection(): void {
        this.selectedCellRowIndex.set(-1);
        this.selectedStartColIndex.set(-1);
        this.selectedEndColIndex.set(-1);
    }

    onReservationCellClick(event: MouseEvent, row: number, col: number): void {
        event.stopPropagation();
        
        const grid = this.gridMatrix();
        if (!grid || grid.length <= row || !grid[row] || grid[row].length <= col) {
            return;
        }
        
        const cellData = grid[row][col];
        if (!cellData || !cellData.isReserved) {
            return;
        }
        
        const houses = this.filteredHouses();
        const days = this.days();
        
        if (houses.length > row && days.length > col) {
            const house = houses[row];
            const day = days[col];
            
            const key = this.getReservationKey(house.house_id, day);
            const reservation = this.reservationMap.get(key);
            
            if (reservation) {
                if (this.selectedReservationId() === reservation.house_availability_id) {
                    this.selectedReservationId.set(null);
                } else {
                    this.selectedReservationId.set(reservation.house_availability_id);
                }
                
                this.handleEditReservation(row, col);
            }
        }
    }

    changeCellHeight(cellHeightInPx: number){
        this.cellHeightInPx = cellHeightInPx;
        localStorage.setItem('portonReservationsCellHeight', JSON.stringify(cellHeightInPx));
    }

    loadCellHeight(){
        let cellHeight = localStorage.getItem('portonReservationsCellHeight');

        if(!cellHeight) {
            this.cellHeightInPx = 30;
        } else {
            this.cellHeightInPx = parseInt(cellHeight);
        }
    }
}