import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { House, HouseAvailability, Task, TaskType, HouseType } from '../service/data.models';
import { combineLatest, Subscription } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { MenuItem } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { signal } from '@angular/core';
import { TaskService } from '../service/task.service';
import { HouseService } from '../service/house.service';
import { InputTextModule } from 'primeng/inputtext';
import { TranslateModule } from '@ngx-translate/core';
import { LayoutService } from '../../layout/service/layout.service';
import { ChartComponent } from '../../layout/component/chart.component';
import { DataService } from '../service/data.service';

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
    ],
    template: `
        <div class="home-container" (click)="handleContainerClick($event)">
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
                                styleClass="p-button-sm">
                            </p-button>
                            <p-button 
                                [outlined]="sortType !== 'type'"
                                [raised]="sortType === 'type'"
                                icon="pi pi-sort-alpha-up" 
                                [label]="'HOME.SEARCH.BY-TYPE' | translate"
                                (onClick)="sortBy('type')"
                                styleClass="p-button-sm">
                            </p-button>
                            <p-button 
                                [outlined]="sortType !== 'status'"
                                [raised]="sortType === 'status'"
                                icon="pi pi-filter"
                                [label]="'HOME.SEARCH.BY-STATUS' | translate"
                                (onClick)="sortBy('status')"
                                styleClass="p-button-sm">
                            </p-button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="houses-container">
                <div class="house-grid">
                    @if (sortType == 'number' || !sortType) {
                        @for (house of filteredHouses(); track house.house_id) {
                            <div 
                                class="house-card" 
                                [class.occupied]="houseService.isHouseOccupied(house.house_id)" 
                                [class.available]="!houseService.isHouseOccupied(house.house_id) && !houseService.hasScheduledNotCompletedTasks(house.house_id)" 
                                [class.available-with-tasks]="!houseService.isHouseOccupied(house.house_id) && houseService.hasScheduledNotCompletedTasks(house.house_id)"
                                [class.available-with-arrival]="!houseService.isHouseOccupied(house.house_id) && houseService.isHouseReservedToday(house.house_id)"
                                [class.expanded]="expandedHouseId === house.house_id" 
                                (click)="toggleExpand($event, house.house_id)">
                                <div class="house-content">
                                    <div class="house-number">{{ house.house_name }}</div>
                                    <div class="house-icons">
                                        @if (houseService.hasNotCompletedTasks(house.house_id)) {
                                            @for (task of houseService.getTasksForHouse(house.house_id); track task.task_id) {
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
                                    [class.expanded-occupied]="!isCurrentSlotGap(house.house_id) && isCurrentSlotOccupied(house.house_id)"
                                    [class.expanded-free]="isCurrentSlotGap(house.house_id) || !isCurrentSlotOccupied(house.house_id)"
                                    (click)="handleExpandedContentClick($event)"
                                >
                                    <div class="date-range">
                                        <div class="date-nav">
                                            <i class="fa fa-chevron-left" (click)="navigateReservation(house.house_id, 'prev')"></i>
                                            <span>{{ getCurrentReservationDates(house.house_id) }}</span>
                                            <i class="fa fa-chevron-right" (click)="navigateReservation(house.house_id, 'next')"></i>
                                        </div>
                                         @if(!isCurrentSlotGap(house.house_id)){
                                            <div class="numbers">
                                                <div class="number-item">
                                                    <span>{{ getAdultsCount(house.house_id) }}</span>
                                                    <i class="fa-solid fa-person"></i>
                                                </div>
                                                <span class="separator">|</span>
                                                <div class="number-item">
                                                    <span>{{ getDogsCount(house.house_id) }}</span>
                                                    <i class="fa-solid fa-paw"></i>
                                                </div>
                                                <span class="separator">|</span>
                                                <div class="number-item">
                                                    <span>{{ getBabiesCount(house.house_id) }}</span>
                                                    <i class="fa-solid fa-baby"></i>
                                                </div>
                                                <span class="separator">|</span>
                                                <div class="number-item">
                                                    <span>{{ getBabyCribsCount(house.house_id) }}</span>
                                                    <i class="fa-solid fa-baby-carriage"></i>
                                                </div>
                                            </div>
                                        }
                                    </div>
                                </div>
                            </div>
                        }
                    } @else if (sortType == 'type') {
                        @for (group of groupedHouses(); track group.type.house_type_id) {
                            <div class="type-divider">{{ group.type.house_type_name }}</div>
                            @for (house of group.houses; track house.house_id) {
                                <div 
                                    class="house-card" 
                                    [class.occupied]="houseService.isHouseOccupied(house.house_id)" 
                                    [class.available]="!houseService.isHouseOccupied(house.house_id) && !houseService.hasScheduledNotCompletedTasks(house.house_id)" 
                                    [class.available-with-tasks]="!houseService.isHouseOccupied(house.house_id) && houseService.hasScheduledNotCompletedTasks(house.house_id)"
                                    [class.available-with-arrival]="!houseService.isHouseOccupied(house.house_id) && houseService.isHouseReservedToday(house.house_id)"
                                    [class.expanded]="expandedHouseId === house.house_id" 
                                    (click)="toggleExpand($event, house.house_id)">
                                    <div class="house-content">
                                        <div class="house-number">{{ house.house_name }}</div>
                                        <div class="house-icons">
                                            @if (houseService.hasNotCompletedTasks(house.house_id)) {
                                                @for (task of houseService.getTasksForHouse(house.house_id); track task.task_id) {
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
                                        [class.expanded-occupied]="!isCurrentSlotGap(house.house_id) && isCurrentSlotOccupied(house.house_id)"
                                        [class.expanded-free]="isCurrentSlotGap(house.house_id) || !isCurrentSlotOccupied(house.house_id)"
                                        (click)="handleExpandedContentClick($event)"
                                    >
                                        <div class="date-range">
                                            <div class="date-nav">
                                                <i class="fa fa-chevron-left" (click)="navigateReservation(house.house_id, 'prev')"></i>
                                                <span>{{ getCurrentReservationDates(house.house_id) }}</span>
                                                <i class="fa fa-chevron-right" (click)="navigateReservation(house.house_id, 'next')"></i>
                                            </div>
                                            <div class="numbers">
                                                <div class="number-item">
                                                    <i class="fa fa-user"></i>
                                                    <span>{{ getAdultsCount(house.house_id) }}</span>
                                                </div>
                                                <span class="separator">|</span>
                                                <div class="number-item">
                                                    <i class="fa fa-heart"></i>
                                                    <span>{{ getBabiesCount(house.house_id) }}</span>
                                                </div>
                                                <span class="separator">|</span>
                                                <div class="number-item">
                                                    <i class="fa fa-star"></i>
                                                    <span>{{ getDogsCount(house.house_id) }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
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
                                <div 
                                    class="house-card" 
                                    [class.occupied]="houseService.isHouseOccupied(house.house_id)" 
                                    [class.available]="!houseService.isHouseOccupied(house.house_id) && !houseService.hasScheduledNotCompletedTasks(house.house_id)" 
                                    [class.available-with-tasks]="!houseService.isHouseOccupied(house.house_id) && houseService.hasScheduledNotCompletedTasks(house.house_id)"
                                    [class.available-with-arrival]="!houseService.isHouseOccupied(house.house_id) && houseService.isHouseReservedToday(house.house_id)"
                                    [class.expanded]="expandedHouseId === house.house_id" 
                                    (click)="toggleExpand($event, house.house_id)">
                                    <div class="house-content">
                                        <div class="house-number">{{ house.house_name }}</div>
                                        <div class="house-icons">
                                            @if (houseService.hasNotCompletedTasks(house.house_id)) {
                                                @for (task of houseService.getTasksForHouse(house.house_id); track task.task_id) {
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
                                        [class.expanded-occupied]="!isCurrentSlotGap(house.house_id) && isCurrentSlotOccupied(house.house_id)"
                                        [class.expanded-free]="isCurrentSlotGap(house.house_id) || !isCurrentSlotOccupied(house.house_id)"
                                        (click)="handleExpandedContentClick($event)"
                                    >
                                        <div class="date-range">
                                            <div class="date-nav">
                                                <i class="fa fa-chevron-left" (click)="navigateReservation(house.house_id, 'prev')"></i>
                                                <span>{{ getCurrentReservationDates(house.house_id) }}</span>
                                                <i class="fa fa-chevron-right" (click)="navigateReservation(house.house_id, 'next')"></i>
                                            </div>
                                            <div class="numbers">
                                                <div class="number-item">
                                                    <i class="fa fa-user"></i>
                                                    <span>{{ getAdultsCount(house.house_id) }}</span>
                                                </div>
                                                <span class="separator">|</span>
                                                <div class="number-item">
                                                    <i class="fa fa-heart"></i>
                                                    <span>{{ getBabiesCount(house.house_id) }}</span>
                                                </div>
                                                <span class="separator">|</span>
                                                <div class="number-item">
                                                    <i class="fa fa-star"></i>
                                                    <span>{{ getDogsCount(house.house_id) }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            }
                        }
                    }
                </div>
            </div>

            @for(chart of pinnedCharts; track chart){
                <div class="pinned-container">
                    <app-chart
                        [title]="'Occupancy'"
                        [dataType]="'occupancy'"
                        [metrics]="occupancyMetrics"
                    ></app-chart>
                </div>
            }
        </div>
    `,
    styles: [
        `
            .pinned-container{
                height: 900px;
                background-color: white;
                border-radius: 6px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                box-sizing: border-box;
                padding: 20px;
                margin-bottom: 20px;
            }

            .legend-container {
                padding: 0.8rem 1rem;
                background-color: var(--surface-card);
                border-radius: 6px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .legend-wrapper {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            
            .legend-items {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 1rem;
            }
            
            .legend-item {
                display: flex;
                align-items: center;
                gap: 0.5em;
                font-size: 0.9em;
                white-space: nowrap;
            }
            
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
            
            .legend-desc {
                color: #555;
                font-size: 0.9em;
                margin-left: 0.2em;
            }
            
            .house-controls {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 1rem;
            }
            
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
            
            .sort-button, .sort-button:hover, .sort-button.active {
                display: none;
            }

            .urgent-task-icon{
                display: flex;
                align-items: center;
                justify-content: center;
                width: 15px;

                i {
                    color: red;
                    font-size: 0.875rem;
                }
            }
            
            @media screen and (min-width: 992px) {
                .legend-wrapper {
                    flex-direction: row;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .legend-items {
                    justify-content: flex-start;
                }
                
                .house-controls {
                    justify-content: flex-end;
                }
                
                .search-container {
                    max-width: 250px;
                }
            }
            
            @media screen and (max-width: 767px) {
                .legend-container {
                    padding: 0.6rem;
                }
                
                .legend-items {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 0.4rem;
                }
                
                .legend-item {
                    font-size: 0.85em;
                }
                
                .house-controls {
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .search-container {
                    max-width: none;
                }
                
                .sort-buttons {
                    justify-content: center;
                }
            }

            .home-container {
                display: flex;
                flex-direction: column;
                gap: 10px;
                position: relative;
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
                padding-bottom: 20px;
            }

            .houses-container {
                background-color: var(--surface-card);
                border-radius: 6px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                width: 100%;
                box-sizing: border-box;
                padding: 15px;
            }

            .house-card {
                background: var(--surface-card);
                border-radius: 6px;
                box-shadow:
                    0 2px 1px -1px rgba(0, 0, 0, 0.2),
                    0 1px 1px 0 rgba(0, 0, 0, 0.14),
                    0 1px 3px 0 rgba(0, 0, 0, 0.12);
                transition: all 0.2s ease;
                cursor: pointer;
                min-width: unset;
                position: relative;
                z-index: 1;
                max-width: 400px;

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

                &.available {
                    background: var(--p-green-600);

                    @media (prefers-color-scheme: dark) {
                        background: var(--p-green-600);
                        .house-number,
                        .house-icons i {
                            color: white;
                            text-shadow: 0 2px 3px rgba(0, 0, 0, 0.5);
                        }
                    }
                }

                &.occupied {
                    background: var(--p-red-600);

                    @media (prefers-color-scheme: dark) {
                        background: var(--p-red-600);
                        .house-number,
                        .house-icons i {
                            color: white;
                            text-shadow: 0 2px 3px rgba(0, 0, 0, 0.5);
                        }
                    }
                }

                &.available-with-arrival{
                    background: var(--p-red-400);

                    @media (prefers-color-scheme: dark) {
                        background: var(--p-red-400);
                        .house-number,
                        .house-icons i {
                            color: white;
                            text-shadow: 0 2px 3px rgba(0, 0, 0, 0.5);
                        }
                    }
                }

                &.occupied-without-arrival{
                    background: var(--p-green-400);

                    @media (prefers-color-scheme: dark) {
                        background: var(--p-green-400);
                        .house-number,
                        .house-icons i {
                            color: white;
                            text-shadow: 0 2px 3px rgba(0, 0, 0, 0.5);
                        }
                    }
                }

                &.available-with-tasks {
                    background: var(--p-yellow-400);

                    @media (prefers-color-scheme: dark) {
                        background: var(--p-yellow-400);
                        .house-number,
                        .house-icons i {
                            color: white;
                            text-shadow: 0 2px 3px rgba(0, 0, 0, 0.5);
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

            :host ::ng-deep .p-button.p-button-sm {
                font-size: 0.875rem;
                padding: 0.4rem 0.75rem;
            }
            
            :host ::ng-deep .p-button.p-button-sm .p-button-icon {
                font-size: 0.875rem;
            }

            .type-divider {
                grid-column: 1 / -1; /* Span all columns */
                margin: 0.75rem 0 0.25rem;
                padding: 0 0 0 0.25rem;
                font-weight: 700;
                font-size: 0.95rem;
                background-color: var(--surface-ground, #f8f9fa);
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
            
            @media (prefers-color-scheme: dark) {
                .type-divider {
                    background-color: var(--surface-ground, #1e1e1e);
                }
            }
            
            @media screen and (min-width: 768px) {
                .type-divider {
                    font-size: 1.05rem;
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
    private subscriptions: Subscription[] = [];
    expandedHouseId: number | null = null;
    currentReservationIndex = new Map<number, number>();
    
    searchTerm: string = '';
    sortType: 'number' | 'type' | 'status' | null = 'number';
    
    // Group houses by type for divider display
    groupedHouses = signal<{ type: HouseType; houses: House[] }[]>([]);
    groupedHousesByStatus = signal<{ status: string; houses: House[] }[]>([]);

    specialLocations: SpecialLocation[] = [
        { name: 'Zgrada', type: 'building' },
        { name: 'Parcela', type: 'parcel' }
    ];

    locationOptions: (House | SpecialLocation)[] = [];

    isOccupancyChartVisible: boolean = false; 
    occupancyMetrics = [
        { name: 'Occupancy', value: 'occupancy' },
    ]

    // Form fields
    selectedLocation: House | SpecialLocation | null = null;
    selectedHouse: House | null = null;
    faultDescription: string = '';
    locationType: string = 'house';

    // Form fields for Unscheduled task
    selectedLocationForTask: House | SpecialLocation | null = null;
    selectedHouseForTask: House | null = null;
    locationTypeForTask: string = 'house';
    selectedTaskType: TaskType | null = null;
    taskDescription: string = '';
    tasks: Task[] = [];

    isUrgentIconVisibleMap: { [taskId: number]: boolean } = {};

    pinnedCharts: string[] = [];

    constructor(
        private dataService: DataService,
        public taskService: TaskService,
        public houseService: HouseService,
        private layoutService: LayoutService,
    ) {}

    ngOnInit(): void {
        this.layoutService.$chartToRemove.subscribe(chartToRemove => {
            this.pinnedCharts = this.pinnedCharts.filter(pinnedChart => pinnedChart != chartToRemove);
        });

        this.loadPinnedCharts();

        this.subscriptions.push(
            combineLatest([
                this.dataService.tasks$,
                this.taskService.isUrgentIconVisible$
            ]).subscribe(([tasks, visible]) => {
                this.tasks = tasks;
                this.isUrgentIconVisibleMap = {};
                this.setUrgentIconsMap(visible);
            })
        );

        this.subscriptions.push(
            combineLatest([
                this.dataService.houseAvailabilities$,
                this.dataService.houseTypes$,
                this.dataService.houses$
            ]).subscribe(([availabilities, houseTypes, houses]) => {
                this.houseAvailabilities.set(availabilities);
                this.houseTypes.set(houseTypes);
            
                const filteredHouses = houses.filter(h => h.house_number > 0);
                this.houses.set(filteredHouses);
                this.filteredHouses.set(filteredHouses);
            
                this.updateLocationOptions();
                this.applyFilters();
            })
        );
    }

    setUrgentIconsMap(visible: boolean){
        this.tasks.forEach(task => {
            if (task.is_unscheduled) {
                this.isUrgentIconVisibleMap[task.task_id] = visible;
            }
        });
    }

    loadPinnedCharts(){
        this.pinnedCharts = this.layoutService.loadPinnedCharts();
    }

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

    // Handle location change in fault report dialog
    onLocationChange(event: any) {
        const selection = event.value;
        if (selection && 'type' in selection) {
            // This is a special location
            this.locationType = selection.type;
            this.selectedHouse = null;
        } else {
            // This is a house
            this.locationType = 'house';
            this.selectedHouse = selection;
        }
    }

    // Handle location change in Unscheduled task dialog
    onLocationChangeForTask(event: any) {
        const selection = event.value;
        if (selection && 'type' in selection) {
            // This is a special location
            this.locationTypeForTask = selection.type;
            this.selectedHouseForTask = null;
        } else {
            // This is a house
            this.locationTypeForTask = 'house';
            this.selectedHouseForTask = selection;
        }
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

            // If today is the start date or within the reservation period
            return (startDate.getTime() === today.getTime() || today > startDate) && today <= endDate;
        });

        return index;
    }

    getSortedReservations(houseId: number): HouseAvailability[] {
        return this.houseAvailabilities()
            .filter((availability) => availability.house_id === houseId)
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

        if (allSlots.length === 0) {
            return '----- - -----';
        }

        // If showing initial empty state (index is -1)
        if (currentIndex === -1) {
            // Find the next upcoming reservation or gap
            const nextSlot = allSlots.find((slot) => {
                if (slot.isGap) {
                    return slot.startDate > today;
                }
                return slot.startDate > today;
            });

            const prevSlot = allSlots
                .filter(slot => slot.endDate && slot.endDate < today) // slots that ended before today
                .reduce((prev, curr) => {
                    if (!prev) return curr; // first candidate
                    // pick the one with the latest endDate before today
                    return curr.endDate! > prev.endDate! ? curr : prev;
                }, undefined as typeof allSlots[0] | undefined);

            if (nextSlot) {
                const formatDate = (date: Date) => `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.`;
                if (nextSlot.isGap) {
                    // For gaps, also add one day to end date
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
            const nextIndex = allSlots.findIndex((slot) => {
                if (slot.isGap) {
                    return slot.startDate > today;
                }
                return slot.startDate > today;
            });
            if (nextIndex !== -1) {
                this.currentReservationIndex.set(houseId, nextIndex);
            }
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
            return;
        }

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

        const reservation = this.getSortedReservations(houseId)[allSlots.slice(0, currentIndex + 1).filter((s) => !s.isGap).length - 1];
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

        const reservation = this.getSortedReservations(houseId)[allSlots.slice(0, currentIndex + 1).filter((s) => !s.isGap).length - 1];
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

        const reservation = this.getSortedReservations(houseId)[allSlots.slice(0, currentIndex + 1).filter((s) => !s.isGap).length - 1];
        if (!reservation) return 0;
        return (reservation.dogs_d || 0) + (reservation.dogs_s || 0) + (reservation.dogs_b || 0);
    }

    getBabyCribsCount(houseId: number): number {
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

    isCurrentSlotOccupied(houseId: number): boolean {
        const allSlots = this.getSortedReservationsWithGaps(houseId);
        const currentIndex = this.currentReservationIndex.get(houseId) ?? this.getCurrentReservationIndex(houseId);

        // If we don't have a valid index or we're looking at a gap, the slot is not occupied
        if (currentIndex === -1 || currentIndex >= allSlots.length || allSlots[currentIndex].isGap) {
            return false;
        }

        // If we're looking at a reservation slot, it's occupied
        return true;
    }

    updateLocationOptions() {
        this.locationOptions = [...this.specialLocations, ...this.houses()];
    }

    isFormValid(): boolean {
        return !!this.selectedLocation;
    }

    isTaskFormValid(): boolean {
        return !!this.selectedLocationForTask && !!this.selectedTaskType;
    }

    openTaskDetails(event: Event, task: any) {
        event.stopPropagation();
        this.taskService.$taskModalData.next(task);
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
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
        } else if (this.sortType == 'status'){
            const statusOrder = ['OCCUPIED', 'ARRIVAL-DAY', 'NOT-CLEANED', 'FREE'];
            
            result.sort((a, b) => {
                const statusA = this.houseService.getHouseStatus(a);
                const statusB = this.houseService.getHouseStatus(b);
                const orderDiff = statusOrder.indexOf(statusA) - statusOrder.indexOf(statusB);
                if (orderDiff !== 0) return orderDiff;
                return a.house_number - b.house_number;
            });

            const grouped = statusOrder.map(status => {
                return {
                    status,
                    houses: result.filter(h => this.houseService.getHouseStatus(h) === status)
                };
            }).filter(group => group.houses.length > 0);

            this.groupedHousesByStatus.set(grouped);
            this.filteredHouses.set(result);
        } else {
            this.filteredHouses.set(result);
            this.groupedHouses.set([]);
        }
    }
    
    sortBy(type: 'number' | 'type' | 'status') {
        this.sortType = this.sortType === type ? null : type;
        
        if (this.sortType !== 'type') {
            this.groupedHouses.set([]);
        }
        
        this.applyFilters();
    }

    getTaskIcon(task: Task): string {
        if (this.isUrgentIconVisibleMap[task.task_id]) {
            return 'fa fa-exclamation-triangle';
        }

        return this.taskService.getTaskIcon(task.task_type_id);
    }
}