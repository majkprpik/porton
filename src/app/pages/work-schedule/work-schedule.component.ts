import { WorkScheduleExportFormComponent } from './work-schedule-form/work-schedule-export-form.component';
import { Component, effect, signal } from '@angular/core';
import { Departments, Profile, ProfileRole, ProfileRoles, ProfileWorkDay, ProfileWorkSchedule, ScheduleCellData } from '../../core/models/data.models';
import { combineLatest, firstValueFrom, Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { WorkScheduleFormComponent } from './work-schedule-form/work-schedule-form.component';
import { ButtonModule } from 'primeng/button';
import { DataService } from '../../core/services/data.service';
import { TooltipModule } from 'primeng/tooltip';
import { LayoutService } from '../../layout/services/layout.service';
import { WorkScheduleService } from '../../core/services/work-schedule.service';

@Component({
  selector: 'app-work-schedule',
  imports: [
    CommonModule, 
    FormsModule, 
    TranslateModule, 
    WorkScheduleFormComponent, 
    ButtonModule,
    WorkScheduleExportFormComponent,
    TooltipModule,
  ],
  template: `
      <div class="work-schedule-container">
        <div class="top">
          <div class="profile-buttons">
            @for(department of departments; track $index){
              <p-button 
                [severity]="selectedDepartment == department ? 'primary': 'secondary'" 
                [label]="'WORK-SCHEDULE.HEADER.TABS.' + (department | uppercase) | translate" 
                (click)="filterProfilesByDepartment(department)"
              ></p-button>  
            }
          </div>
          <div class="schedule-buttons">
            <div 
              class="quick-delete"
              tooltipPosition="top"
            >
              @if(isDeleteMode){
                <span id="selected-schedules">Selected schedules: {{ schedulesToDelete.length }}</span>
                <p-button
                  [severity]="'danger'"
                  (click)="deleteSelectedSchedules()"
                  [raised]="true"
                >
                  <span>Delete</span>
                </p-button>
                <p-button
                  [severity]="'danger'"
                  (click)="cancelQuickDelete()"
                  styleClass="p-button-text"
                  [raised]="true"
                >
                  <span>Cancel</span>
                </p-button>
              } @else {
                <p-button
                  [severity]="'danger'"
                  (click)="onQuickDelete()"
                  [pTooltip]="'WORK-SCHEDULE.HEADER.TOOLTIPS.QUICK-DELETE' | translate"
                  tooltipPosition="top"
                >
                  <i class="pi pi-eraser"></i>
                </p-button>
              }
            </div>
            <div class="export"
              [pTooltip]="'WORK-SCHEDULE.HEADER.TOOLTIPS.EXPORT' | translate" 
              tooltipPosition="top"
            >
              <p-button
                [severity]="'info'"
                (click)="openExportSchedule()"
              >
                <i class="pi pi-file-export"></i>
              </p-button>
            </div>
            <div class="density-buttons">
              @for(densityButton of densityButtons; track $index){
                <p-button
                  class="density-button"
                  [severity]="cellHeightInPx == densityButton.cellHeightPx ? 'primary': 'secondary'" 
                  (click)="changeCellHeight(densityButton.cellHeightPx)"
                  [pTooltip]="'WORK-SCHEDULE.HEADER.TOOLTIPS.ROW-HEIGHT-' + (densityButton.name | uppercase) | translate" 
                  tooltipPosition="top"
                >
                  <i [class]="densityButton.icon"></i>
                </p-button>  
              }
            </div>
          </div>
        </div>
        @if(isDeletingOverlayVisible || isCreatingOverlayVisible){
          <div class="loading-overlay">
            <div class="loading-message">
              <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
              <b>
                @if(isDeletingOverlayVisible){
                  {{ 'WORK-SCHEDULE.OVERLAY.DELETING-MESSAGE' | translate }}
                } @else if(isCreatingOverlayVisible){
                  {{ 'WORK-SCHEDULE.OVERLAY.CREATING-MESSAGE' | translate }}
                }
              </b>
            </div>
          </div>
        }
        <div class="table-container">
          <table class="schedule-table">
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
                    [ngStyle]="{
                      'height': '30px',
                    }"
                  >
                    <div>{{ day | date: 'EEE' }} {{ day | date: 'dd.M.' }}</div>
                  </th>
                }
              </tr>
            </thead>
            <tbody>
              @for (profile of filteredProfiles; track profile.id; let i = $index) {
                <tr>
                  <th 
                    class="row-header" 
                    [ngClass]="{ 'active-row': selectedCellRowIndex() === i }"
                  >
                    {{ profile.first_name }}
                  </th>
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
                        'schedule-start': gridMatrix()[i][j].isScheduleStart,
                        'schedule-middle': gridMatrix()[i][j].isScheduleMiddle,
                        'schedule-end': gridMatrix()[i][j].isScheduleEnd,
                        'border-left-important': isToday(days()[j]) ? false : gridMatrix()[i][j].isScheduleStart,
                        'border-right-important': isToday(days()[j]) ? false : gridMatrix()[i][j].isScheduleEnd,
                        'border-top-important': gridMatrix()[i][j].isScheduleStart || gridMatrix()[i][j].isScheduleMiddle || gridMatrix()[i][j].isScheduleEnd,
                        'border-bottom-important': gridMatrix()[i][j].isScheduleStart || gridMatrix()[i][j].isScheduleMiddle || gridMatrix()[i][j].isScheduleEnd,
                        'height-25-important': cellHeightInPx == 25,
                        'height-30-important': cellHeightInPx == 30,
                        'height-40-important': cellHeightInPx == 40,
                      }"
                      [ngStyle]="{
                        'background-color': gridMatrix()[i][j].color,
                        'color': (isDeleteMode && gridMatrix()[i][j].isReserved) ? 
                          gridMatrix()[i][j].color == 'red' ? 'white' : 'red'
                          : '',
                      }"
                    >
                      {{ gridMatrix()[i][j].displayText }}
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (showScheduleForm) {
          <app-work-schedule-form
            [visible]="showScheduleForm"
            [profileWorkSchedule]="editingSchedule"
            [profileId]="selectedProfileId"
            [profile]="selectedProfile"
            [startDate]="selectedStartDate"
            [endDate]="selectedEndDate"
            [fullWorkSchedule]="fullWorkSchedule"
            [colors]="colors"
            (save)="handleProfileScheduleSave($event)"
            (delete)="handleDeleteSchedule($event)"
            (visibleChange)="handleVisibilityChange($event)"
          >
          </app-work-schedule-form>
        }

        @if(showExportScheduleForm) {
          <app-work-schedule-export-form
            [visible]="showExportScheduleForm"
            [filteredProfiles]="filteredProfiles"
            [gridMatrix]="exportMatrix"
            (visibleChange)="handleScheduleExportFormVisibilityChange($event)"
            (weekChange)="handleWeekChange($event)"
          >
          </app-work-schedule-export-form>
        }
      </div>
    `,
  styles: `
    .work-schedule-container {
      height: 88vh;
      width: 100%;
      background-color: var(--surface-card);
      border-radius: 10px;
      box-sizing: border-box;
      padding: 20px;
      overflow-y: hidden;
      position: relative;

      .top{
        width: 100%;
        display: flex;
        flex-direction: row;
        justify-content: space-between;

        .profile-buttons{
          width: 500px;
          display: flex;
          flex-direction: row;
          gap: 10px;
          padding-bottom: 10px;
        }

        .schedule-buttons{
          display: flex;
          flex-direction: row;
          gap: 15px;

          .quick-delete{
            display: flex;
            flex-direction: row;
            gap: 10px;

            #selected-schedules{
              font-weight: bold;
              padding-top: 8px;
            }
          }

          .export, .quick-delete{
            p-button{
              height: 33px;

              span{
                font-size: 13px;
              }
  
              i{
                font-size: 16px;
              }
            }
          }

          .density-buttons{
            display: flex;
            flex-direction: row;
            align-items: top;
            justify-content: flex-end;
            gap: 10px;
  
            .density-button{
              height: 33px;
  
              i{
                font-size: 16px;
              }
            }
          }
        }
      }

      .loading-overlay{
        position: absolute;
        inset: 0;
        background-color: white;
        opacity: 0.8;
        z-index: 20;
        pointer-events: all;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;

        .loading-message{
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
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

        .schedule-table {
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
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-weight: bold;
            width: 120px;
            max-width: 120px;
            box-sizing: border-box;

            &:hover{
              cursor: pointer;
            }

            &.saturday-column-day,
            &.saturday-column-night,
            &.sunday-column-day,
            &.sunday-column-night,
            &.today-column {
              background-color: inherit;
            }

            &.schedule-start {
              position: relative;
              z-index: 2;
            }

            &.schedule-middle {
              position: relative;
              z-index: 2;
            }

            &.schedule-end {
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
  profileWorkDays: ProfileWorkDay[] = [];

  gridMatrix = signal<ScheduleCellData[][]>([]);
  exportMatrix = signal<ScheduleCellData[][]>([]);

  private scheduleMap = new Map<string, ProfileWorkSchedule>();

  showScheduleForm = false;
  showExportScheduleForm = false;
  selectedProfileId = '';
  selectedProfile: Profile | undefined = undefined;
  selectedStartDate: Date = new Date();
  selectedEndDate: Date = new Date();
  editingSchedule: ProfileWorkSchedule | undefined = undefined;
  schedulesToDelete: ProfileWorkSchedule[] = [];

  nextProfileScheduleDate: Date | null = null;

  selectedCellRowIndex = signal<number>(-1);
  selectedCellColIndex = signal<number>(-1);
  selectedStartColIndex = signal<number>(-1);
  selectedEndColIndex = signal<number>(-1);

  isSelecting = false;
  isDeleteMode = false;

  isDeletingOverlayVisible = false;
  isCreatingOverlayVisible = false;

  selectedScheduleId: number | null = null;

  private isFirstLoad = true;

  colors = ['#BAFFC9', '#FFFFBA', '#BAE1FF', '#E8BAFF', '#FFB3BA', '#BAF2FF', '#FFC9BA', '#D4FFBA', '#FFBAEC'];

  managementRoles: string[] = [ProfileRoles.VoditeljKampa, ProfileRoles.SavjetnikUprave, ProfileRoles.Uprava];
  receptionRoles: string[] = [ProfileRoles.VoditeljRecepcije, ProfileRoles.Recepcija, ProfileRoles.KorisnickaSluzba, ProfileRoles.NocnaRecepcija, ProfileRoles.Prodaja];
  housekeepingRoles: string[] = [ProfileRoles.VoditeljDomacinstva, ProfileRoles.Sobarica, ProfileRoles.Terasar];
  technicalRoles: string[] = [ProfileRoles.KucniMajstor, ProfileRoles.Odrzavanje];
  otherRoles: string[] = ['Ostalo'];
  profileRoles: ProfileRole[] = [];
  selectedDepartment = 'All';
  departments = ['All', Departments.Housekeeping, Departments.Technical, Departments.Reception, Departments.Management];
  densityButtons = [
    { name: 'spacious', cellHeightPx: 40, icon: 'pi pi-equals' },
    { name: 'comfortable', cellHeightPx: 30, icon: 'pi pi-bars' },
    { name: 'compact', cellHeightPx: 25, icon: 'pi pi-align-justify' },
  ];

  filteredProfiles: Profile[] = [];

  isNightMode: boolean | undefined = undefined;

  cellHeightInPx: number = 30;
  
  private destroy$ = new Subject<void>();

  constructor(
    private dataService: DataService,
    private layoutService: LayoutService,
    private workScheduleService: WorkScheduleService,
  ) {
    effect(() => {
      this.isNightMode = this.layoutService.layoutConfig().darkTheme;
    });
  }

  ngOnInit() {
    this.subscribeToDataStreams();
    this.loadCellHeight();
    this.cancelQuickDelete();
    this.scrollToTodayIfFirstLoad();
  }

  private subscribeToDataStreams() {
    combineLatest([
      this.dataService.profiles$, 
      this.dataService.profileWorkSchedule$, 
      this.dataService.profileRoles$,
      this.dataService.profileWorkDays$,
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([profiles, schedule, profileRoles, profileWorkDays]) => {
          this.profiles = profiles.filter(p => !p.is_deleted || p.is_test_user);
          this.fullWorkSchedule = schedule;
          this.profileRoles = profileRoles;
          this.profileWorkDays = profileWorkDays;

          this.applyProfileFilters();
          this.updateGridMatrix();
        },
        error: (error) => {
          console.error('Error loading profile data:', error);
        }
      });
  }

  private applyProfileFilters() {
    this.filterProfilesByDepartment(this.selectedDepartment);
  }

  private scrollToTodayIfFirstLoad() {
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
    this.scheduleMap.clear();

    this.destroy$.next();
    this.destroy$.complete();
  }

  filterProfilesByDepartment(department: string){
    this.selectedDepartment = department;
    let filteredRoles: ProfileRole[] = [];

    switch(department) {
      case 'All':
        filteredRoles = this.profileRoles;
        break;
      case Departments.Housekeeping:
        filteredRoles = this.profileRoles.filter(role => this.housekeepingRoles.includes(role.name));
        break;
      case Departments.Technical:
        filteredRoles = this.profileRoles.filter(role => this.technicalRoles.includes(role.name));
        break;
      case Departments.Reception:
        filteredRoles = this.profileRoles.filter(role => this.receptionRoles.includes(role.name));
        break;
      case Departments.Management:
        filteredRoles = this.profileRoles.filter(role => this.managementRoles.includes(role.name));
        break;
      default:
        filteredRoles = [];
    }

    this.filteredProfiles = this.profiles.filter(profile => 
      filteredRoles.some(role => role.id == profile.role_id) &&
      !profile.is_test_user
    );

    this.updateGridMatrix();
  }

  private updateGridMatrix(): void {
    this.scheduleMap.clear();
    const filteredWorkSchedule = this.fullWorkSchedule.filter(fws => this.filteredProfiles.some(fp => fp.id == fws.profile_id));

    filteredWorkSchedule.forEach((schedule) => {
      const startDate = new Date(schedule.start_date);
      const endDate = new Date(schedule.end_date);

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const key = this.getScheduleKey(schedule.profile_id, d);
        this.scheduleMap.set(key, schedule);
      }
    });

    const grid: ScheduleCellData[][] = [];
    const days = this.days();

    for (const profile of this.filteredProfiles) {
      const row: ScheduleCellData[] = [];

      for (const day of days) {
        const key = this.getScheduleKey(profile.id, day);
        const schedule = this.scheduleMap.get(key);

        row.push(this.createScheduleCellData(day, schedule));
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

  private getExportMatrix(startDate: Date, endDate: Date): ScheduleCellData[][] {
    const days = this.days();
    const startIndex = days.findIndex(d => this.isSameDay(d, startDate));
    const endIndex = days.findIndex(d => this.isSameDay(d, endDate));

    if (startIndex === -1 || endIndex === -1) {
      throw new Error('Export range is outside current gridMatrix range');
    }

    // Slice columns in each row
    return this.gridMatrix()
      .map(row => row.slice(startIndex, endIndex + 1));
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
          a.getMonth() === b.getMonth() &&
          a.getDate() === b.getDate();
  }

  private getScheduleKey(profileId: string, date: Date): string {
    return `${profileId}-${date.getTime()}`;
  }

  private createColor(color: string){
    const baseColor = color ?? 'lightgreen';
    const opacity = 0.7;

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(baseColor);
    if(!result) return baseColor;

    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  private createTooltip(schedule: ProfileWorkSchedule){
    const resStartDate = new Date(schedule.start_date);
    const resEndDate = new Date(schedule.end_date);

    return `\nFrom: ${resStartDate.toLocaleDateString()}` + `\nTo: ${resEndDate.toLocaleDateString()}`;
  }

  private createScheduleCellData(day: Date, schedule?: ProfileWorkSchedule): ScheduleCellData {
    let workDay;
    if(schedule){
      workDay = this.profileWorkDays.find(workDay =>
        workDay.profile_work_schedule_id == schedule.id &&
        workDay.profile_id == schedule?.profile_id &&
        workDay.day == day.toLocaleDateString('en-CA').split('T')[0]
      );
    }

    const SchedulecellData: ScheduleCellData = {
      isReserved: false,
      color: '',
      displayText: workDay ? (workDay.start_time.slice(0, 5) + ' - ' + workDay.end_time.slice(0, 5)) : '',
      tooltip: '',
      identifier: '',
      isToday: this.isToday(day),
      isSaturday: this.isSaturday(day),
      isSunday: this.isSunday(day),
      isScheduleStart: false,
      isScheduleMiddle: false,
      isScheduleEnd: false,
      isForDelete: false,
    };

    if (schedule) {
      SchedulecellData.color = this.createColor(schedule.color);

      // Calculate display text - ensure single line
      const startDate = new Date(schedule.start_date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(schedule.end_date);
      endDate.setHours(0, 0, 0, 0);
      const checkDate = new Date(day);
      checkDate.setHours(0, 0, 0, 0);

      // Determine if this cell is the start, middle, or end of a schedule
      SchedulecellData.isScheduleStart = checkDate.getTime() === startDate.getTime();
      SchedulecellData.isScheduleEnd = checkDate.getTime() === endDate.getTime();
      SchedulecellData.isScheduleMiddle = checkDate > startDate && checkDate < endDate;

      if (schedule.start_date == schedule.end_date) {
        // Single day schedule is both start and end
        SchedulecellData.isScheduleStart = true;
        SchedulecellData.isScheduleEnd = true;
        SchedulecellData.isScheduleMiddle = false;
      } else {
        const secondDay = new Date(startDate);
        secondDay.setDate(secondDay.getDate() + 1);
        secondDay.setHours(0, 0, 0, 0);
      }

      SchedulecellData.tooltip = this.createTooltip(schedule);

      // Set identifier
      SchedulecellData.identifier = `res-${schedule.id}-${new Date(schedule.start_date).getTime()}`;
      SchedulecellData.isReserved = true;
    }

    return SchedulecellData;
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
    this.showScheduleForm = false;
    const days = this.days();

    if (this.filteredProfiles.length > row && days.length > col) {
      const profile = this.filteredProfiles[row];
      const day = days[col];

      const key = this.getScheduleKey(profile.id, day);
      const schedule = this.scheduleMap.get(key);
      if (!schedule) return;

      this.selectedProfileId = profile.id;
      this.selectedProfile = this.filteredProfiles.find((profile) => profile.id == this.selectedProfileId);

      const startDate = new Date(schedule.start_date);
      const endDate = new Date(schedule.end_date);

      this.selectedStartDate = startDate;
      this.selectedEndDate = endDate;

      this.editingSchedule = { ...schedule };

      this.updateNextProfileScheduleDate();

      setTimeout(() => {
        if (this.showScheduleForm) {
          this.showScheduleForm = false;
          setTimeout(() => {
            this.showScheduleForm = true;
          }, 100);
        } else {
          this.showScheduleForm = true;
        }
      }, 0);
    }
  }

  private formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async handleProfileScheduleSave(data: { profileWorkDays: ProfileWorkDay[], profileWorkSchedule: Partial<ProfileWorkSchedule>[] }) {
    this.isCreatingOverlayVisible = true;
    this.showScheduleForm = false;

    try {
      const isEditing = data.profileWorkSchedule.length === 1 && !!data.profileWorkSchedule[0].id;

      const scheduleResults = await Promise.all(
        data.profileWorkSchedule.map(pws => {
          if(isEditing){
            const updatedProfileWorkSchedule: ProfileWorkSchedule = {
              id: pws.id,
              color: pws.color!,
              end_date: pws.end_date!,
              profile_id: pws.profile_id!,
              start_date: pws.start_date!,
            }

            return this.workScheduleService.updateProfileWorkSchedule(updatedProfileWorkSchedule);
          } else {
            return this.workScheduleService.createProfileWorkSchedule(pws);
          }
        })
      );

      const allWorkDays = scheduleResults.flatMap(res => {
        if (!res) return [];
        const start = this.toLocalMidnight(res.start_date);
        const end = this.toLocalMidnight(res.end_date);

        return data.profileWorkDays
          .filter(day => {
            const d = this.toLocalMidnight(day.day);
            return d >= start && d <= end;
          })
          .map(day => ({
            ...day,
            profile_id: res.profile_id,
            profile_work_schedule_id: res.id,
          }));
      });

      if(isEditing) {
        const updatePromises = allWorkDays.map(workDay =>
          this.workScheduleService.updateProfileWorkDay(workDay).catch(err => {
            console.error('Error updating work day:', err);
            return null;
          })
        );

        await Promise.all(updatePromises);
      } else {
        await this.workScheduleService.createProfileWorkDays(allWorkDays);
      }
    } catch (err) {
      console.error('Error saving schedules/work days:', err);
    } finally {
      this.isCreatingOverlayVisible = false;
    }
  }

  toLocalMidnight(dateStr: string) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  handleVisibilityChange(isVisible: boolean): void {
    this.showScheduleForm = isVisible;

    if (!isVisible) {
      setTimeout(() => {
        this.editingSchedule = undefined;
        this.selectedScheduleId = null;
        this.selectedProfile = undefined;
        
        this.clearSelection();
      }, 100);
    } else if (isVisible) {
      this.updateNextProfileScheduleDate();
    }
  }

  handleScheduleExportFormVisibilityChange(isVisible: boolean){
    this.showExportScheduleForm = isVisible;
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

  private findNextProfileSchedule(profileId: string, afterDate: Date, excludeScheduleId?: number): ProfileWorkSchedule | null {
    const schedule = this.fullWorkSchedule;
    const afterDateMs = new Date(afterDate).setHours(0, 0, 0, 0);

    const futureSchedule = schedule.filter((schedule) => {
      if (schedule.profile_id !== profileId) return false;
      if (excludeScheduleId && schedule.id == excludeScheduleId) return false;
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

  hasCellSchedule(row: number, col: number): boolean {
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
    // if (this.isCellInPast(col)) return;

    this.selectedCellRowIndex.set(row);
    this.selectedStartColIndex.set(col);
    this.selectedEndColIndex.set(col);
    this.isSelecting = true;

    event.preventDefault();
  }

  // Handle mouse move to update selection range
  onCellMouseMove(event: MouseEvent, row: number, col: number): void {
    if (this.isSelecting && row === this.selectedCellRowIndex()) {
      if (this.hasCellSchedule(row, col)) return;
      // if (this.isCellInPast(col)) return;

      const startCol = this.selectedStartColIndex();
      const minCol = Math.min(startCol, col);
      const maxCol = Math.max(startCol, col);

      // Check if any cells in the potential range have reservations or are in the past
      for (let checkCol = minCol; checkCol <= maxCol; checkCol++) {
        if (this.hasCellSchedule(row, checkCol)) {
          // If a schedule or past date is found in the range, limit the selection
          if (col > startCol) {
            // Moving right - limit to the column before the schedule/past date
            let lastValidCol = startCol;
            for (let c = startCol + 1; c < checkCol; c++) {
              if (!this.hasCellSchedule(row, c)) {
                lastValidCol = c;
              }
            }
            this.selectedEndColIndex.set(lastValidCol);
          } else {
            // Moving left - limit to the column after the schedule/past date
            let lastValidCol = startCol;
            for (let c = startCol - 1; c > checkCol; c--) {
              if (!this.hasCellSchedule(row, c)) {
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
      if(!this.isSelecting) return;

      this.isSelecting = false;
      const dateRange = this.getSelectedDateRange();

      if(!dateRange || this.selectedCellRowIndex() < 0) return;

      const row = this.selectedCellRowIndex();

      if(this.filteredProfiles.length < row) return;

      const profile = this.filteredProfiles[row];
      this.selectedProfileId = profile.id;
      this.selectedProfile = profile;

      let day = this.days()[col];

      if(day > dateRange.endDate){
        day = dateRange.endDate;
      } else if(day < dateRange.startDate){
        day = dateRange.startDate;
      }

      if(this.isDeleteMode){
        this.toggleDeleteSchedule(row, col);
        this.clearSelection();

        return;
      }

      this.openScheduleForm(profile, dateRange.startDate, dateRange.endDate, row, day);
    });
  }

  private toggleDeleteSchedule(row: number, col: number): void {
    const grid = this.gridMatrix();
    const cell = grid[row][col];

    if (!cell.isReserved) return;

    const profile = this.filteredProfiles[row];
    const day = this.days()[col];
    const key = this.getScheduleKey(profile.id, day);
    const schedule = this.scheduleMap.get(key);

    if (!schedule?.id) return;

    const isAlreadyDeleted = this.schedulesToDelete.some(sch => sch.id === schedule.id);

    if (isAlreadyDeleted) {
      for (let j = 0; j < grid[row].length; j++) {
        const k = this.getScheduleKey(profile.id, this.days()[j]);
        if (this.scheduleMap.get(k)?.id === schedule.id) {
          grid[row][j].color = this.scheduleMap.get(k)?.color ?? 'lightblue';
        }
      }
      this.schedulesToDelete = this.schedulesToDelete.filter(sch => sch.id !== schedule.id);
    } else {
      for (let j = 0; j < grid[row].length; j++) {
        const k = this.getScheduleKey(profile.id, this.days()[j]);
        if (this.scheduleMap.get(k)?.id === schedule.id) {
          grid[row][j].color = 'red';
        }
      }
      this.schedulesToDelete.push({ ...schedule });
    }

    this.gridMatrix.set([...grid]);
  }

  handleDeleteSchedule(scheduleId: number): void {
    const schedule = this.fullWorkSchedule.find((schedule) => schedule.id == scheduleId);
    if (!schedule) return;

    this.workScheduleService.deleteProfileWorkSchedule(scheduleId);
  }

  async deleteSelectedSchedules(){
    if (!this.schedulesToDelete?.length) {
      this.cancelQuickDelete();
      return;
    }

    this.isDeletingOverlayVisible = true;

    const schedulesToDeleteIds: number[] = this.schedulesToDelete
      .map(std => std.id)       
      .filter((id): id is number => id !== undefined);  

    if (!schedulesToDeleteIds.length) {
      this.cancelQuickDelete();
      return;
    };

    try {
      await this.workScheduleService.deleteProfileWorkSchedules(schedulesToDeleteIds);
    } catch(err) {
      console.error('Error deleting schedules:', err);
    } finally {
      this.cancelQuickDelete();
      this.isDeletingOverlayVisible = false;
    }
  }

  cancelQuickDelete() {
    const grid = this.gridMatrix();

    for (const schedule of this.schedulesToDelete) {
      this.filteredProfiles.forEach((profile, row) => {
        this.days().forEach((day, col) => {
          const key = this.getScheduleKey(profile.id, day);
          if (this.scheduleMap.get(key)?.id === schedule.id) {
            grid[row][col].color = this.scheduleMap.get(key)?.color ?? 'lightblue';
          }
        });
      });
    }

    this.isDeleteMode = false;
    this.schedulesToDelete = [];

    this.gridMatrix.set([...grid]);
  }

  private openScheduleForm(profile: Profile, startDate: Date, endDate: Date, row: number, day: Date): void {
    this.editingSchedule = undefined;

    const key = this.getScheduleKey(profile.id, day);
    const schedule = this.scheduleMap.get(key);

    if (schedule) {
      this.selectedScheduleId = schedule.id!;
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
      this.editingSchedule = {
        id: this.selectedScheduleId ?? undefined,
        profile_id: profile.id,
        start_date: schedule?.start_date.split('T')[0] ?? this.formatDateToYYYYMMDD(formStartDate),
        end_date: schedule?.end_date.split('T')[0] ?? this.formatDateToYYYYMMDD(formEndDate),
        color: schedule?.color ?? 'lightblue',
      };

      if (this.showScheduleForm) {
        this.showScheduleForm = false;
        setTimeout(() => {
          this.showScheduleForm = true;
        }, 100);
      } else {
        this.showScheduleForm = true;
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

  changeCellHeight(heightInPx: number){
    this.cellHeightInPx = heightInPx;
    localStorage.setItem('portonScheduleCellHeight', JSON.stringify(heightInPx));
  }

  loadCellHeight(){
    let cellHeight = localStorage.getItem('portonScheduleCellHeight');

    if(!cellHeight) {
      this.cellHeightInPx = 30;
    } else {
      this.cellHeightInPx = parseInt(cellHeight);
    }
  }

  openExportSchedule(){
    const today = new Date();

    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1); // Monday
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6); // Sunday
    sunday.setHours(23, 59, 59, 999);
    
    this.exportMatrix.set(this.getExportMatrix(monday, sunday));
    this.showExportScheduleForm = true;
  }

  handleWeekChange(event: any){
    this.exportMatrix.set(this.getExportMatrix(event.monday, event.sunday));
  }

  onQuickDelete() {
    this.isDeleteMode = !this.isDeleteMode;
  }
}
