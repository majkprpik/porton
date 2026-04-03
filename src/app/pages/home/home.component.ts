import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { House, HouseAvailability, Task, TaskType, HouseType } from '../../core/models/data.models';
import { combineLatest, Subject, takeUntil } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { signal } from '@angular/core';
import { TaskService } from '../../core/services/task.service';
import { HouseService } from '../../core/services/house.service';
import { InputTextModule } from 'primeng/inputtext';
import { TranslateModule } from '@ngx-translate/core';
import { ChartComponent } from '../statistics/chart.component';
import { DataService } from '../../core/services/data.service';
import { nonNull } from '../../shared/rxjs-operators/non-null';
import { StatisticsService } from '../../core/services/statistics.service';
import { HouseCardComponent } from './house-card/house-card.component';
import { HouseDetailModalComponent } from './house-detail-modal.component';
import { AuthService } from '../../core/services/auth.service';

// Define the special location option interface
interface SpecialLocation {
    name: string;
    type: string;
}

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [
        CommonModule, 
        CardModule, 
        ButtonModule, 
        DialogModule, 
        DropdownModule, 
        FormsModule,
        InputTextModule,
        TranslateModule,
        ChartComponent,
        HouseCardComponent,
        HouseDetailModalComponent,
    ],
    template: `
        <div class="home-container">
            <div class="legend-container">
                <div class="legend-wrapper">
                    <div class="legend-items">
                        <div class="legend-item"><span class="legend-color legend-green"></span> {{ 'HOME.HOUSE-STATUS.FREE' | translate }} ({{ 'HOME.HOUSE-STATUS.CLEANED' | translate }}) </div>
                        <div class="legend-item"><span class="legend-color legend-yellow"></span> {{ 'HOME.HOUSE-STATUS.FREE' | translate }} ({{ 'HOME.HOUSE-STATUS.NOT-CLEANED' | translate }}) </div>
                        <div class="legend-item"><span class="legend-color legend-red"></span> {{ 'HOME.HOUSE-STATUS.OCCUPIED' | translate }} </div>
                        <div class="legend-item"><span class="legend-color legend-lightred"></span> {{ 'HOME.HOUSE-STATUS.ARRIVAL-DAY' | translate }} ({{ 'HOME.HOUSE-STATUS.CLEANED' | translate }}) </div>
                    </div>
                    <div class="house-controls">
                        <div class="search-container">
                            <input 
                                type="text" 
                                pInputText 
                                class="w-full"
                                [placeholder]="'HOME.SEARCH.SEARCH-HOUSES' | translate" 
                                [(ngModel)]="searchTerm"
                                (input)="applyFilters()">
                        </div>
                        <div class="sort-buttons">
                            <p-button
                                [outlined]="sortType !== 'number'"
                                [raised]="sortType === 'number'"
                                icon="pi pi-sort-numeric-up"
                                [label]="'HOME.SEARCH.BY-NUMBER' | translate"
                                (onClick)="sortBy('number')"
                                styleClass="p-button-sm sort-btn">
                            </p-button>
                            <p-button
                                [outlined]="sortType !== 'type'"
                                [raised]="sortType === 'type'"
                                icon="pi pi-sort-alpha-up"
                                [label]="'HOME.SEARCH.BY-TYPE' | translate"
                                (onClick)="sortBy('type')"
                                styleClass="p-button-sm sort-btn">
                            </p-button>
                            <p-button
                                [outlined]="sortType !== 'status'"
                                [raised]="sortType === 'status'"
                                icon="pi pi-filter"
                                [label]="'HOME.SEARCH.BY-STATUS' | translate"
                                (onClick)="sortBy('status')"
                                styleClass="p-button-sm sort-btn">
                            </p-button>
                            <p-button
                                [outlined]="!showNeedsConfirmation"
                                [raised]="showNeedsConfirmation"
                                severity="warn"
                                icon="pi pi-check-circle"
                                [label]="'HOME.SEARCH.NEEDS-CONFIRMATION' | translate"
                                (onClick)="toggleNeedsConfirmation()"
                                styleClass="p-button-sm sort-btn">
                            </p-button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="houses-container">
                <div class="house-grid">
                    @if (sortType == 'number' || !sortType) {
                        @for (house of filteredHouses(); track house.house_id) {
                            <app-house-card
                                [house]="house"
                                [houseAvailabilities]="houseAvailabilities"
                                [tasks]="tasks"
                                [isUrgentIconVisibleMap]="isUrgentIconVisibleMap"
                                (houseClick)="openHouseModal($event)"
                            ></app-house-card>
                        }
                    } @else if (sortType == 'type') {
                        @for (group of groupedHouses(); track group.type.house_type_id) {
                            <div class="type-divider">{{ group.type.house_type_name }}</div>
                            @for (house of group.houses; track house.house_id) {
                                <app-house-card
                                    [house]="house"
                                    [houseAvailabilities]="houseAvailabilities"
                                    [tasks]="tasks"
                                    [isUrgentIconVisibleMap]="isUrgentIconVisibleMap"
                                    (houseClick)="openHouseModal($event)"
                                ></app-house-card>
                            }
                        }
                    } @else if(sortType == 'status'){
                        @for (group of groupedHousesByStatus(); track group.status) {
                            <div class="type-divider">
                                {{ ('HOME.HOUSE-STATUS.' + group.status) | translate }}
                                <span class="houses-count">
                                    {{group.houses.length}}
                                </span>
                            </div>
                            @for (house of group.houses; track house.house_id) {
                                <app-house-card
                                    [house]="house"
                                    [houseAvailabilities]="houseAvailabilities"
                                    [tasks]="tasks"
                                    [isUrgentIconVisibleMap]="isUrgentIconVisibleMap"
                                    (houseClick)="openHouseModal($event)"
                                ></app-house-card>
                            }
                        }
                    }
                </div>
            </div>

            <div class="statistics-container">
                <div class="chart-row">
                    @for(chart of pinnedCharts; track chart){
                        <div class="pinned-container">
                            <app-chart
                                [title]="chart.title"
                                [dataType]="chart.dataType"
                                [canSelectDiagramType]="chart.canSelectDiagramType"
                                [periods]="chart.periods"
                                [metrics]="chart.metrics"
                                [metricFields]="chart.metricFields"
                                [isPinnableToHome]="chart.isPinnableToHome"
                                [chartTypes]="chart.chartTypes"
                            ></app-chart>
                        </div>
                    }
                </div>
            </div>
        </div>

        <app-house-detail-modal
            [house]="selectedHouse"
            [houseAvailabilities]="houseAvailabilities"
            [tasks]="tasks"
            [isUrgentIconVisibleMap]="isUrgentIconVisibleMap"
            [(visible)]="showHouseModal"
        ></app-house-detail-modal>
    `,
    styles: [
        `
            :host ::ng-deep .sort-buttons .p-button {
                height: 30px !important;
            }

            @media screen and (max-width: 991px) {
                :host ::ng-deep .sort-btn .p-button-label {
                    display: none !important;
                }
                :host ::ng-deep .sort-btn .p-button {
                    padding: 0.4rem !important;
                }

                .home-container {
                    gap: 6px !important;
                    padding: 6px !important;
                    box-sizing: border-box;
                }

                .home-container .legend-container {
                    padding: 0.5rem 0.6rem;
                }

                .home-container .legend-wrapper {
                    flex-direction: column !important;
                    gap: 0.5rem !important;
                }

                .home-container .legend-items {
                    display: grid !important;
                    grid-template-columns: 1fr 1fr !important;
                    gap: 0.25rem 0.5rem !important;
                }

                .home-container .legend-item {
                    font-size: 0.8em !important;
                }

                .home-container .house-controls {
                    flex-direction: row !important;
                    flex-wrap: nowrap !important;
                    gap: 0.4rem !important;
                    align-items: center !important;
                }

                .home-container .search-container {
                    flex: 1 !important;
                    min-width: 0 !important;
                    max-width: none !important;
                }

                .home-container .sort-buttons {
                    flex-shrink: 0 !important;
                    gap: 0.25rem !important;
                }

                .home-container .houses-container {
                    padding: 8px !important;
                }

                .home-container .house-grid {
                    grid-template-columns: repeat(2, 1fr) !important;
                    gap: 0.35rem !important;
                }

                .home-container .statistics-container .chart-row {
                    grid-template-columns: 1fr !important;
                }
            }

            .home-container {
                display: flex;
                flex-direction: column;
                gap: 10px;
                position: relative;

                .legend-container {
                    padding: 0.8rem 1rem;
                    background: var(--glass-bg);
                    backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
                    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
                    border: 1px solid var(--glass-border);
                    border-radius: 6px;
                    box-shadow: var(--glass-shadow);
    
                    .legend-wrapper {
                        display: flex;
                        flex-direction: row;
                        gap: 1rem;
    
                        .legend-items {
                            display: flex;
                            flex-wrap: wrap;
                            justify-content: center;
                            gap: 1rem;
    
                            .legend-item {
                                display: flex;
                                align-items: center;
                                gap: 0.5em;
                                font-size: 0.9em;
                                white-space: nowrap;
    
                                .legend-color {
                                    display: inline-block;
                                    width: 16px;
                                    height: 16px;
                                    border-radius: 4px;
                                    margin-right: 0.3em;
                                    border: 1px solid #bbb;
                                }
                                
                                .legend-green { background: var(--p-green-600, #22c55e); }
                                .legend-yellow { background: var(--p-yellow-400, #fde047); }
                                .legend-red { background: var(--p-red-600, #ef4444); }
                                .legend-lightred { background: var(--p-red-400, #f87171); }
                            }
                        }
    
                        .house-controls {
                            display: flex;
                            flex-direction: row;
                            flex-wrap: wrap;
                            justify-content: center;
                            gap: 1rem;

                            .search-container {
                                flex: 1;
                                min-width: 200px;
                                max-width: 300px;
                                display: flex;
                            }
                            
                            .sort-buttons {
                                display: flex;
                                gap: 0.5rem;
                                align-items: center;
                            }
                        }
                    }
                }
                
                .houses-container {
                    background: var(--glass-bg);
                    backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
                    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
                    border: 1px solid var(--glass-border);
                    border-radius: 6px;
                    box-shadow: var(--glass-shadow);
                    width: 100%;
                    box-sizing: border-box;
                    padding: 15px;
    
                    .house-grid {
                        display: grid;
                        grid-template-columns: repeat(6, 1fr);
                        gap: 0.5rem;
                        padding: 0;
                        position: relative;
                        padding-bottom: 20px;

                        .type-divider {
                            grid-column: 1 / -1;
                            margin: 0.75rem 0 0.25rem;
                            padding: 0 0 0 0.25rem;
                            font-weight: 700;
                            font-size: 0.95rem;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
            
                            .houses-count{
                                display: inline-flex;
                                align-items: center;
                                justify-content: center;
                                width: 22px;
                                height: 22px;
                                background: var(--primary-color);
                                color: var(--primary-color-text);
                                border-radius: 50px;
                                font-size: 12px;
                                font-weight: 700;
                            }
                        }
                    }
                }
                
                .statistics-container{
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    background-color: transparent;
                    align-items: start;
                    gap: 10px;
                    margin-bottom: 20px;
    
                    .chart-row {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr); 
                        gap: 10px;
                        width: 100%;
    
                        .pinned-container {
                            height: 900px;
                            background: var(--glass-bg);
                            backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
                            -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
                            border: 1px solid var(--glass-border);
                            border-radius: 10px;
                            padding: 20px;
                            box-sizing: border-box;
                            box-shadow: var(--glass-shadow);
                            overflow: hidden;
                        }
                    }
                                        
                    .chart-row .pinned-container:last-child:nth-child(odd) {
                        grid-column: 1;
                    }
                }

                @media screen and (max-width: 1700px){
                    .statistics-container {
                        .chart-row {
                            flex-direction: column;
                        }
                    }
                }

                @media screen and (max-width: 1200px) {
                }

                @media screen and (min-width: 992px) {
                    .legend-wrapper {
                        flex-direction: row;
                        justify-content: space-between;
                        align-items: center;

                        .legend-items {
                            justify-content: flex-start;
                        }
                    }
                    
                    .house-controls {
                        justify-content: flex-end;

                        .search-container {
                            max-width: 250px;
                        }
                    }
                    
                }
                
                :host ::ng-deep .p-button.p-button-sm {
                    font-size: 0.875rem;
                    padding: 0.4rem 0.75rem;
                }
                
                :host ::ng-deep .p-button.p-button-sm .p-button-icon {
                    font-size: 0.875rem;
                }
            }
        `
    ]
})
export class Home implements OnInit, OnDestroy {
    houses = signal<House[]>([]);
    filteredHouses = signal<House[]>([]);
    houseAvailabilities = signal<HouseAvailability[]>([]);
    houseTypes = signal<HouseType[]>([]);
    tasks = signal<Task[]>([]);

    selectedHouse: House | null = null;
    showHouseModal = false;

    searchTerm: string = '';
    sortType: 'number' | 'type' | 'status' | null = 'number';
    showNeedsConfirmation: boolean = false;

    // Group houses by type for divider display
    groupedHouses = signal<{ type: HouseType; houses: House[] }[]>([]);
    groupedHousesByStatus = signal<{ status: string; houses: House[] }[]>([]);

    urgentIconTasks: Task[] = [];
    isUrgentIconVisibleMap: { [taskId: number]: boolean } = {};
    pinnedCharts: any[] = [];

    private destroy$ = new Subject<void>();

    constructor(
        private dataService: DataService,
        public taskService: TaskService,
        public houseService: HouseService,
        private authService: AuthService,
        private statisticsService: StatisticsService,
    ) {}

    ngOnInit(): void {
        this.monitorTasksAndUrgentIcons();
        this.subscribeToDataStreams();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private monitorTasksAndUrgentIcons() {
        combineLatest([
            this.dataService.tasks$.pipe(nonNull()),
            this.taskService.isUrgentIconVisible$
        ])
        .pipe(takeUntil(this.destroy$))
        .subscribe(([tasks, visible]) => {
            this.urgentIconTasks = tasks;
            this.isUrgentIconVisibleMap = {};
            this.setUrgentIconsMap(visible);
        });
    }

    private subscribeToDataStreams() {
        combineLatest([
            this.dataService.houseAvailabilities$.pipe(nonNull()),
            this.dataService.houseTypes$.pipe(nonNull()),
            this.dataService.houses$.pipe(nonNull()),
            this.dataService.tasks$.pipe(nonNull()),
            this.dataService.workGroupTasks$.pipe(nonNull()),
            this.dataService.workGroupProfiles$.pipe(nonNull()),
            this.dataService.workGroups$.pipe(nonNull()),
            this.dataService.tempHouseAvailabilities$.pipe(nonNull()),
        ])
        .pipe(takeUntil(this.destroy$))
        .subscribe(([availabilities, houseTypes, houses, tasks]) => {
            this.houseAvailabilities.set(availabilities);
            this.houseTypes.set(houseTypes);
            this.tasks.set(tasks);

            const filteredHouses = houses.filter(h => h.house_number > 0);
            this.houses.set(filteredHouses);
            this.filteredHouses.set(filteredHouses);

            this.applyFilters();
        });

        this.dataService.pinnedCharts$.pipe(nonNull(), takeUntil(this.destroy$))
        .subscribe(pinnedCharts => {
            this.pinnedCharts = this.statisticsService.charts.filter(c =>
                pinnedCharts.some(pc =>
                    pc.chart_name === c.dataType &&
                    pc.profile_id === this.authService.getStoredUserId()
                )
            );
        });
    }

    setUrgentIconsMap(visible: boolean){
        this.urgentIconTasks.forEach(task => {
            if (task.is_unscheduled) {
                this.isUrgentIconVisibleMap[task.task_id] = visible;
            }
        });
    }

    openHouseModal(house: House): void {
        this.selectedHouse = house;
        this.showHouseModal = true;
    }

    applyFilters() {
        let result = [...this.houses()];

        if (this.searchTerm && this.searchTerm.trim() !== '') {
            const searchLower = this.searchTerm.toLowerCase();
            result = result.filter(house =>
                house.house_name.toString().toLowerCase().includes(searchLower) ||
                house.house_number.toString().toLowerCase().includes(searchLower)
            );
        }

        if (this.showNeedsConfirmation) {
            result = result.filter(house => this.houseService.hasUnconfirmedCleaningTask(house.house_id));
        }
        
        if (this.sortType == 'number') {
            result.sort((a, b) => a.house_number - b.house_number);
            this.filteredHouses.set(result);
            this.groupedHouses.set([]);
        } else if (this.sortType == 'type') {
            result.sort((a, b) => {
                if (a.house_type_id !== b.house_type_id) {
                    return a.house_type_id - b.house_type_id;
                }
                return a.house_number - b.house_number;
            });
            
            const types = this.houseTypes();
            const grouped = types.map(type => {
                return {
                    type,
                    houses: result.filter(house => house.house_type_id === type.house_type_id)
                };
            }).filter(group => group.houses.length > 0); 
            
            this.groupedHouses.set(grouped);
            this.filteredHouses.set(result);
        } else if (this.sortType == 'status') {
            const statusOrder = ['OCCUPIED', 'ARRIVAL-DAY', 'NOT-CLEANED', 'FREE'];
            const statusCache = new Map<number, string>();
            result.forEach(house => {
                statusCache.set(house.house_id, this.houseService.getHouseStatus(house));
            });

            result.sort((a, b) => {
                const statusA = statusCache.get(a.house_id)!;
                const statusB = statusCache.get(b.house_id)!;
                const orderDiff = statusOrder.indexOf(statusA) - statusOrder.indexOf(statusB);
                if (orderDiff !== 0) return orderDiff;
                return a.house_number - b.house_number;
            });

            const grouped = statusOrder.map(status => ({
                status,
                houses: result.filter(h => statusCache.get(h.house_id) === status)
            })).filter(group => group.houses.length > 0);

            this.groupedHousesByStatus.set(grouped);
            this.filteredHouses.set(result);
        } else {
            this.filteredHouses.set(result);
            this.groupedHouses.set([]);
        }
    }
    
    toggleNeedsConfirmation() {
        this.showNeedsConfirmation = !this.showNeedsConfirmation;
        this.applyFilters();
    }

    sortBy(type: 'number' | 'type' | 'status') {
        this.sortType = this.sortType === type ? null : type;

        if (this.sortType !== 'type') {
            this.groupedHouses.set([]);
        }

        this.applyFilters();
    }
}