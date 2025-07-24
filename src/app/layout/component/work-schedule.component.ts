import { Component, effect, signal } from '@angular/core';
import { DataService, Profile, ProfileRole, ProfileWorkDay, ProfileWorkSchedule, ShiftType } from '../../pages/service/data.service';
import { combineLatest } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { WorkScheduleFormComponent } from './work-schedule-form.component';
import { ButtonModule } from 'primeng/button';
import { LayoutService } from '../service/layout.service';

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
  selector: 'app-work-schedule',
  imports: [
    CommonModule, 
    FormsModule, 
    TranslateModule, 
    WorkScheduleFormComponent, 
    ButtonModule
  ],
  template: `
      <!-- <div class="legend-container">
        <div class="legend-wrapper">
          <div class="legend-items">
            <div class="legend-item"><span class="legend-color legend-lightgreen"></span> {{ 'WORK-SCHEDULE.LEGEND.MORNING-SHIFT' | translate }}</div>
            <div class="legend-item"><span class="legend-color legend-lightyellow"></span> {{ 'WORK-SCHEDULE.LEGEND.AFTERNOON-SHIFT' | translate }}</div>
            <div class="legend-item"><span class="legend-color legend-lightblue"></span> {{ 'WORK-SCHEDULE.LEGEND.EVENING-SHIFT' | translate }}</div>
          </div>
        </div>
      </div> -->
      <div class="work-schedule-container">
        <div class="profile-buttons">
          <p-button [severity]="selectedDepartment == 'all' ? 'primary': 'secondary'" label="All" (click)="filterProfilesByDepartment('all')"></p-button>  
          <p-button [severity]="selectedDepartment == 'housekeeping' ? 'primary': 'secondary'" label="Housekeeping" (click)="filterProfilesByDepartment('housekeeping')"></p-button>  
          <p-button [severity]="selectedDepartment == 'technical' ? 'primary': 'secondary'" label="Technical" (click)="filterProfilesByDepartment('technical')"></p-button>  
          <p-button [severity]="selectedDepartment == 'reception' ? 'primary': 'secondary'" label="Reception" (click)="filterProfilesByDepartment('reception')"></p-button>  
          <p-button [severity]="selectedDepartment == 'management' ? 'primary': 'secondary'" label="Management" (click)="filterProfilesByDepartment('management')"></p-button>  
        </div>
        <div class="table-container">
          <table class="reservation-table">
            <thead>
              <tr>
                <th class="house-header corner-header">{{ 'WORK-SCHEDULE.EMPLOYEES' | translate }}</th>
                @for (day of days(); track day.getTime()) {
                  <th
                    class="day-header"
                    [ngClass]="{
                      'today-column': isToday(day),
                      'saturday-column-day': isSaturday(day) && !isNightMode,
                      'saturday-column-night': isSaturday(day) && isNightMode,
                      'sunday-column-day': isSunday(day) && !isNightMode,
                      'sunday-column-night': isSunday(day) && isNightMode,
                    }"
                    [title]="day.toLocaleDateString()"
                  >
                    <div>{{ day | date: 'EEE' }} - {{ day | date: 'dd.M.' }}</div>
                  </th>
                }
              </tr>
            </thead>
            <tbody>
              @for (profile of filteredProfiles; track profile.id; let i = $index) {
                <tr>
                  <th class="row-header" [ngClass]="{ 'active-row': selectedCellRowIndex() === i }">{{ profile.first_name }}</th>
                  @for (day of days(); track day.getTime(); let j = $index) {
                    <td
                      (mousedown)="onCellMouseDown($event, i, j)"
                      (mousemove)="onCellMouseMove($event, i, j)"
                      (mouseup)="onDocumentMouseUp($event, i, j)"
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
                        'border-bottom-important': gridMatrix()[i][j].isReservationStart || gridMatrix()[i][j].isReservationMiddle || gridMatrix()[i][j].isReservationEnd
                      }"
                      [style.background-color]="gridMatrix()[i][j].color"
                    >
                      {{gridMatrix()[i][j].displayText}}
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Reservation Form -->
        @if (showReservationForm) {
          <app-work-schedule-form
            [visible]="showReservationForm"
            [profileWorkSchedule]="editingReservation"
            [profileId]="selectedProfileId"
            [profile]="selectedProfile"
            [startDate]="selectedStartDate"
            [endDate]="selectedEndDate"
            [fullWorkSchedule]="fullWorkSchedule"
            [colors]="colors"
            (save)="handleProfileScheduleSave($event)"
            (delete)="handleDeleteReservation($event)"
            (visibleChange)="handleVisibilityChange($event)"
          >
          </app-work-schedule-form>
        }
      </div>
    `,
  styles: `
    .legend-container {
      margin-bottom: 1.2rem;
      padding: 0.8rem 1rem;
      background-color: var(--surface-card);
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

      .legend-wrapper {
        display: flex;
        flex-direction: column;
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

            .legend-lightgreen {
              background-color: #baffc9;
            }

            .legend-lightblue {
              background-color: #bae1ff;
            }

            .legend-lightyellow {
              background-color: #ffffba;
            }
          }
        }
      }
    }

    .work-schedule-container {
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

          th,td {
            border: 1px solid #ddd;
            padding: 5px;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 120px !important;
            min-width: 120px;
            max-width: 120px;
            height: 30px;
          }

          tbody tr:nth-child(even) {
            background-color: rgba(0, 0, 0, 0.01);
          }

          .house-header,
          .row-header {
            width: 80px !important;
          }

          .corner-header {
            background-color: #f0f0f0 !important;
            border: 1px solid #ccc !important;
            position: sticky !important;
            top: 0;
            left: 0;
            z-index: 15 !important;
            box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1) !important;
          }

          .row-header {
            height: 35px;
          }

          .house-header {
            background-color: var(--surface-card) !important;
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

            &.saturday-column-day,
            &.saturday-column-night,
            &.sunday-column-day,
            &.sunday-column-night,
            &.today-column {
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

            padding: 5px 2px;
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
      }
    }

    :host ::ng-deep .today-column {
      box-shadow: inset 0 0 0 1000px rgba(255, 255, 0, 0.15) !important;
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

    .day-header.today-column {
      background-color: #e3f2fd !important;
      font-weight: 900;
      color: #0277bd;
      box-shadow: none !important;
      border-top: 2px solid #2196f3 !important;
      border-bottom: 2px solid #2196f3 !important;
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
})
export class WorkScheduleComponent {
  days = signal<Date[]>(this.generateDays());

  fullWorkSchedule: ProfileWorkSchedule[] = [];
  profiles: Profile[] = [];
  shiftTypes: ShiftType[] = [];
  profileWorkDays: ProfileWorkDay[] = [];

  gridMatrix = signal<CellData[][]>([]);

  private reservationMap = new Map<string, ProfileWorkSchedule>();

  showReservationForm = false;
  selectedProfileId = '';
  selectedProfile: Profile | undefined = undefined;
  selectedStartDate: Date = new Date();
  selectedEndDate: Date = new Date();
  editingReservation: ProfileWorkSchedule | undefined = undefined;

  nextProfileScheduleDate: Date | null = null;

  selectedCellRowIndex = signal<number>(-1);
  selectedCellColIndex = signal<number>(-1);
  selectedStartColIndex = signal<number>(-1);
  selectedEndColIndex = signal<number>(-1);

  isSelecting = false;

  selectedReservationId: number | null = null;

  private isFirstLoad = true;

  colors = ['#BAFFC9', '#FFFFBA', '#BAE1FF', '#E8BAFF', '#FFB3BA', '#BAF2FF', '#FFC9BA', '#D4FFBA', '#FFBAEC'];

  managementRoles = ['Voditelj kampa', 'Savjetnik uprave', 'Uprava'];
  receptionRoles = ['Voditelj recepcije', 'Recepcija', 'Korisnicka sluzba', 'Nocna recepcija', 'Prodaja'];
  housekeepingRoles = ['Voditelj domacinstva', 'Sobarica', 'Terasar'];
  technicalRoles = ['Kucni majstor', 'Odrzavanje'];
  otherRoles: string[] = ['Ostalo'];
  profileRoles: ProfileRole[] = [];
  selectedDepartment = 'all';

  filteredProfiles: Profile[] = [];

  isNightMode: boolean | undefined = undefined;

  constructor(
    private dataService: DataService,
    private layoutService: LayoutService,
  ) {
    effect(() => {
      this.isNightMode = this.layoutService.layoutConfig().darkTheme;
    });
  }

  ngOnInit() {
    combineLatest([
      this.dataService.profiles$, 
      this.dataService.profileWorkSchedule$, 
      this.dataService.shiftTypes$,
      this.dataService.profileRoles$,
      this.dataService.profileWorkDays$,
    ]).subscribe(([profiles, schedule, shiftTypes, profileRoles, profileWorkDays]) => {
        this.profiles = profiles;
        this.fullWorkSchedule = schedule;
        this.shiftTypes = shiftTypes;
        this.profileRoles = profileRoles;
        this.profileWorkDays = profileWorkDays;

        this.filterProfilesByDepartment(this.selectedDepartment);
        this.updateGridMatrix();
      }
    );

    // Monitor initial render
    setTimeout(() => {
      if (this.isFirstLoad) {
        this.scrollToToday();
        this.isFirstLoad = false;
      }
    }, 300);
  }

  ngOnDestroy(): void {
    this.days.set([]);
    this.gridMatrix.set([]);
    this.reservationMap.clear();
  }

  filterProfilesByDepartment(department: string){
    this.selectedDepartment = department;
    let filteredRoles: ProfileRole[] = [];

    switch(department) {
      case 'all':
        filteredRoles = this.profileRoles;
        break;
      case 'housekeeping':
        filteredRoles = this.profileRoles.filter(role => this.housekeepingRoles.includes(role.name));
        break;
      case 'technical':
        filteredRoles = this.profileRoles.filter(role => this.technicalRoles.includes(role.name));
        break;
      case 'reception':
        filteredRoles = this.profileRoles.filter(role => this.receptionRoles.includes(role.name));
        break;
      case 'management':
        filteredRoles = this.profileRoles.filter(role => this.managementRoles.includes(role.name));
        break;
      default:
        filteredRoles = [];
    }

    this.filteredProfiles = this.profiles.filter(profile => filteredRoles.some(role => role.id == profile.role_id));
    this.updateGridMatrix();
  }

  private updateGridMatrix(): void {
    this.reservationMap.clear();
    const filteredWorkSchedule = this.fullWorkSchedule.filter(fws => this.filteredProfiles.some(fp => fp.id == fws.profile_id));

    filteredWorkSchedule.forEach((schedule) => {
      const startDate = new Date(schedule.start_date);
      const endDate = new Date(schedule.end_date);

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const key = this.getReservationKey(schedule.profile_id, d);
        this.reservationMap.set(key, schedule);
      }
    });

    const grid: CellData[][] = [];
    const days = this.days();

    for (const profile of this.filteredProfiles) {
      const row: CellData[] = [];

      for (const day of days) {
        const key = this.getReservationKey(profile.id, day);
        const reservation = this.reservationMap.get(key);

        row.push(this.createCellData(day, reservation));
      }

      grid.push(row);
    }

    this.gridMatrix.set(grid);

    let reservedCellCount = 0;
    grid.forEach((row) => {
      row.forEach((cell) => {
        if (cell.isReserved) reservedCellCount++;
      });
    });
  }

  private getReservationKey(profileId: string, date: Date): string {
    return `${profileId}-${date.getTime()}`;
  }

  private createCellData(day: Date, schedule?: ProfileWorkSchedule): CellData {
    let workDay;
    if(schedule){
      workDay = this.profileWorkDays.find(workDay =>
        workDay.profile_work_schedule_id == schedule.id &&
        workDay.profile_id == schedule?.profile_id &&
        workDay.day == day.toLocaleDateString('en-CA').split('T')[0]
      );
    }

    const cellData: CellData = {
      isReserved: false,
      color: '',
      displayText: workDay ? (workDay.start_time.slice(0, 5) + ' - ' + workDay.end_time.slice(0, 5)) : '',
      tooltip: '',
      identifier: '',
      isToday: this.isToday(day),
      isSaturday: this.isSaturday(day),
      isSunday: this.isSunday(day),
      isReservationStart: false,
      isReservationMiddle: false,
      isReservationEnd: false
    };

    if (schedule) {
      // Calculate color
      const baseColor = workDay?.color ?? 'lightgreen';
      const opacity = 0.7;
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(baseColor);

      if (result) {
        const r = parseInt(result[1], 16);
        const g = parseInt(result[2], 16);
        const b = parseInt(result[3], 16);
        cellData.color = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      } else {
        cellData.color = baseColor;
      }

      // Calculate display text - ensure single line
      const startDate = new Date(schedule.start_date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(schedule.end_date);
      endDate.setHours(0, 0, 0, 0);
      const checkDate = new Date(day);
      checkDate.setHours(0, 0, 0, 0);

      // Determine if this cell is the start, middle, or end of a reservation
      cellData.isReservationStart = checkDate.getTime() === startDate.getTime();
      cellData.isReservationEnd = checkDate.getTime() === endDate.getTime();
      cellData.isReservationMiddle = checkDate > startDate && checkDate < endDate;

      if (schedule.start_date == schedule.end_date) {
        // Single day reservation is both start and end
        cellData.isReservationStart = true;
        cellData.isReservationEnd = true;
        cellData.isReservationMiddle = false;
      } else {
        const secondDay = new Date(startDate);
        secondDay.setDate(secondDay.getDate() + 1);
        secondDay.setHours(0, 0, 0, 0);
      }

      // Calculate tooltip - include all details here
      const resStartDate = new Date(schedule.start_date);
      const resEndDate = new Date(schedule.end_date);
      cellData.tooltip += `\nFrom: ${resStartDate.toLocaleDateString()}`;
      cellData.tooltip += `\nTo: ${resEndDate.toLocaleDateString()}`;

      // Set identifier
      cellData.identifier = `res-${schedule.id}-${new Date(schedule.start_date).getTime()}`;
      cellData.isReserved = true;
    }

    return cellData;
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
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  }

  isSaturday(date: Date): boolean {
    return date.getDay() === 6;
  }

  isSunday(date: Date): boolean {
    return date.getDay() === 0;
  }

  handleEditProfileWorkSchedule(row: number, col: number): void {
    this.showReservationForm = false;
    const days = this.days();

    if (this.filteredProfiles.length > row && days.length > col) {
      const profile = this.filteredProfiles[row];
      const day = days[col];

      const key = this.getReservationKey(profile.id, day);
      const reservation = this.reservationMap.get(key);
      if (!reservation) return;

      this.selectedProfileId = profile.id;
      this.selectedProfile = this.filteredProfiles.find((profile) => profile.id == this.selectedProfileId);

      const startDate = new Date(reservation.start_date);
      const endDate = new Date(reservation.end_date);

      this.selectedStartDate = startDate;
      this.selectedEndDate = endDate;

      this.editingReservation = { ...reservation };

      this.updateNextProfileScheduleDate();

      setTimeout(() => {
        if (this.showReservationForm) {
          this.showReservationForm = false;
          setTimeout(() => {
            this.showReservationForm = true;
          }, 100);
        } else {
          this.showReservationForm = true;
        }
      }, 0);
    }
  }

  handleDeleteReservation(data: { scheduleId: number; profileId: string }): void {
    const schedule = this.fullWorkSchedule.find((schedule) => schedule.id == data.scheduleId);
    if (!schedule) return;

    this.dataService.deleteProfileWorkSchedule(data.scheduleId).subscribe();
  }

  private formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  handleProfileScheduleSave(data: {profileWorkDays: ProfileWorkDay[], profileWorkSchedule: Partial<ProfileWorkSchedule>[]}): void {
    let startDateStr = data.profileWorkSchedule[0].start_date;
    let endDateStr = data.profileWorkSchedule[0].end_date;

    const startDate = new Date(startDateStr!);
    const endDate = new Date(endDateStr!);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return;
    if (endDate < startDate) return;

    const isEditing = !!(data.profileWorkSchedule.length == 1 && data.profileWorkSchedule[0].id);

    const formattedStartDate = this.formatDateToYYYYMMDD(startDate);
    const formattedEndDate = this.formatDateToYYYYMMDD(endDate);

    data.profileWorkSchedule = data.profileWorkSchedule.map(pws => {
      return {
        ...pws, 
        start_date: formattedStartDate,
        end_date: formattedEndDate,
      }
    });

    this.showReservationForm = false;

    if (isEditing) {
      data.profileWorkSchedule.forEach(pws => {
        this.dataService.updateProfileWorkSchedule(pws).subscribe(res => {
          if(!res) return;
          
          this.dataService.updateProfileWorkDays(data.profileWorkDays).subscribe();
        });
      });
    } else {
      data.profileWorkSchedule.forEach(pws => {
        this.dataService.saveProfileWorkSchedule(pws).subscribe(res => {
          if(!res) return;
  
          const pwd = data.profileWorkDays.map(day => {
            return {
              ...day,
              profile_id: res.profile_id,
              profile_work_schedule_id: res.id,
            }
          });
  
          this.dataService.saveProfileWorkDays(pwd).subscribe();
        });
      });
    }
  }

  handleVisibilityChange(isVisible: boolean): void {
    this.showReservationForm = isVisible;

    if (!isVisible) {
      setTimeout(() => {
        this.editingReservation = undefined;
        this.selectedReservationId = null;
        this.selectedProfile = undefined;
        
        this.clearSelection();
      }, 100);
    } else if (isVisible) {
      this.updateNextProfileScheduleDate();
    }
  }

  private updateNextProfileScheduleDate(): void {
    const startDate = this.selectedStartDate;

    if (!this.selectedProfileId || !startDate) {
      this.nextProfileScheduleDate = null;
      return;
    }

    const nextProfileSchedule = this.findNextProfileSchedule(this.selectedProfileId, startDate);
    if (nextProfileSchedule) {
      const nextDate = new Date(nextProfileSchedule.start_date);
      this.nextProfileScheduleDate = nextDate;
    } else {
      this.nextProfileScheduleDate = null;
    }
  }

  private findNextProfileSchedule(profileId: string, afterDate: Date, excludeReservationId?: number): ProfileWorkSchedule | null {
    const schedule = this.fullWorkSchedule;
    const afterDateMs = new Date(afterDate).setHours(0, 0, 0, 0);

    const futureSchedule = schedule.filter((schedule) => {
      if (schedule.profile_id !== profileId) return false;
      if (excludeReservationId && schedule.id == excludeReservationId) return false;
      const startDateMs = new Date(schedule.start_date).setHours(0, 0, 0, 0);

      return startDateMs > afterDateMs;
    });

    if (futureSchedule.length > 0) {
      return futureSchedule.sort((a, b) => {
        const aDate = new Date(a.start_date).getTime();
        const bDate = new Date(b.end_date).getTime();
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

  scrollToToday(): void {
    setTimeout(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayIndex = this.days().findIndex((day) => {
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

            const scrollLeft = columnPosition - containerWidth / 2 + columnWidth / 2;
            tableContainer.scrollLeft = scrollLeft > 0 ? scrollLeft : 0;
          }
        }
      }
    }, 100);
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

  onCellMouseDown(event: MouseEvent, row: number, col: number): void {
    if (this.isCellInPast(col)) return;

    this.selectedCellRowIndex.set(row);
    this.selectedStartColIndex.set(col);
    this.selectedEndColIndex.set(col);
    this.isSelecting = true;

    event.preventDefault();
  }

  // Handle mouse move to update selection range
  onCellMouseMove(event: MouseEvent, row: number, col: number): void {
    if (this.isSelecting && row === this.selectedCellRowIndex()) {
      if (this.hasCellReservation(row, col)) return;
      if (this.isCellInPast(col)) return;

      const startCol = this.selectedStartColIndex();
      const minCol = Math.min(startCol, col);
      const maxCol = Math.max(startCol, col);

      // Check if any cells in the potential range have reservations or are in the past
      for (let checkCol = minCol; checkCol <= maxCol; checkCol++) {
        if (this.hasCellReservation(row, checkCol) || this.isCellInPast(checkCol)) {
          // If a reservation or past date is found in the range, limit the selection
          if (col > startCol) {
            // Moving right - limit to the column before the reservation/past date
            let lastValidCol = startCol;
            for (let c = startCol + 1; c < checkCol; c++) {
              if (!this.hasCellReservation(row, c) && !this.isCellInPast(c)) {
                lastValidCol = c;
              }
            }
            this.selectedEndColIndex.set(lastValidCol);
          } else {
            // Moving left - limit to the column after the reservation/past date
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

      // If no issues found in the range, update normally
      this.selectedEndColIndex.set(col);
    }
  }

  // Handle mouse up to end selection
  onDocumentMouseUp(event: any, row: number, col: number): void {
    setTimeout(() => {
      if (this.isSelecting) {
        this.isSelecting = false;

        const dateRange = this.getSelectedDateRange();
        if (dateRange && this.selectedCellRowIndex() >= 0) {
          const row = this.selectedCellRowIndex();

          if (this.filteredProfiles.length > row) {
            const profile = this.filteredProfiles[row];

            this.selectedProfileId = profile.id;
            this.selectedProfile = profile;

            let day = this.days()[col];
            if(day > dateRange.endDate){
              day = dateRange.endDate;
            } else if(day < dateRange.startDate){
              day = dateRange.startDate;
            }

            this.openReservationForm(profile, dateRange.startDate, dateRange.endDate, row, day);
          }
        }
      }
    });
  }

  private openReservationForm(profile: Profile, startDate: Date, endDate: Date, row: number, day: Date): void {
    this.editingReservation = undefined;

    const key = this.getReservationKey(profile.id, day);
    const schedule = this.reservationMap.get(key);

    if (schedule) {
      this.selectedReservationId = schedule.id!;
    }

    const formStartDate = new Date(startDate);
    const formEndDate = new Date(endDate);

    formStartDate.setHours(0, 0, 0, 0);
    formEndDate.setHours(0, 0, 0, 0);

    this.selectedStartDate = schedule ? new Date(schedule.start_date) : formStartDate;
    this.selectedEndDate = schedule ? new Date(schedule.end_date) : formEndDate;

    this.updateNextProfileScheduleDate();

    const nextProfileWorkSchedule = this.findNextProfileSchedule(profile.id, formStartDate);
    if (nextProfileWorkSchedule) {
      const nextStartDate = new Date(nextProfileWorkSchedule.start_date);
      nextStartDate.setHours(0, 0, 0, 0);

      if (formEndDate >= nextStartDate) {
        const adjustedEndDate = new Date(nextStartDate);
        adjustedEndDate.setDate(adjustedEndDate.getDate() - 1);
        this.selectedEndDate = adjustedEndDate;
      }
    }

    setTimeout(() => {
      this.editingReservation = {
        id: this.selectedReservationId ?? undefined,
        profile_id: profile.id,
        shift_type_id: schedule?.shift_type_id ?? this.shiftTypes.find((st) => st.name == 'morning')!.id,
        start_date: schedule?.start_date.split('T')[0] ?? this.formatDateToYYYYMMDD(formStartDate),
        end_date: schedule?.end_date.split('T')[0] ?? this.formatDateToYYYYMMDD(formEndDate)
      };

      if (this.showReservationForm) {
        this.showReservationForm = false;
        setTimeout(() => {
          this.showReservationForm = true;
        }, 100);
      } else {
        this.showReservationForm = true;
      }
    }, 0);

    this.clearSelection();
  }

  private clearSelection(): void {
    this.selectedCellRowIndex.set(-1);
    this.selectedStartColIndex.set(-1);
    this.selectedEndColIndex.set(-1);
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

  getSelectedDateRange(): { startDate: Date; endDate: Date } | null {
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
}
