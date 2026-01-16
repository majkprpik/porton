import { ChangeDetectorRef, ChangeDetectionStrategy, Component, effect, inject, Input, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { MultiSelect } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { CommonModule, isPlatformBrowser, TitleCasePipe } from '@angular/common';
import { ChartType, House, HouseAvailability, Profile, Season, Task } from '../../core/models/data.models';
import { TaskService } from '../../core/services/task.service';
import { combineLatest, take } from 'rxjs';
import { LayoutService } from '../../layout/services/layout.service';
import { DataService } from '../../core/services/data.service';
import { nonNull } from '../../shared/rxjs-operators/non-null';
import { StatisticsService } from '../../core/services/statistics.service';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;
const SEASON_MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November'] as const;
const CHART_COLORS = [
  '--p-cyan-500',
  '--p-orange-500',
  '--p-green-500',
  '--p-pink-500',
  '--p-purple-500',
  '--p-yellow-500',
  '--p-red-500',
  '--p-blue-500',
  '--p-teal-500',
  '--p-indigo-500',
  '--p-lime-500'
] as const;
const EXCLUDED_HOUSE_NAMES = ['Zgrada', 'Parcele'] as const;
const ALL_HOUSES = 'All';
const PERIOD_MONTH = 'month';
const PERIOD_YEAR = 'year';
const PERIOD_SEASON = 'season';
const DATA_TYPE_STAFF = 'staff';
const DATA_TYPE_GENERAL = 'general';
const DATA_TYPE_OCCUPANCY = 'occupancy';

interface Metric {
  name: string;
  value: string;
}

interface ChartData {
  textColor: string;
  textColorSecondary: string;
  surfaceBorder: string;
  maxDataValue: number;
  hasOccupancy: boolean;
  datasets: any[];
}

@Component({
  selector: 'app-chart',
  imports: [
    ChartModule,
    SelectModule,
    FormsModule,
    TranslateModule,
    ButtonModule,
    MultiSelect,
    TitleCasePipe,
    CommonModule,
  ],
  template: `
    <div class="chart-container">
      <div class="header">
        <div class="left-side">
          <h1>{{ 'STATISTICS.TITLES.' + dataType | uppercase | translate }}</h1>
        </div>

        <div class="right-side">
          @if(canSelectDiagramType){
            <div class="field">
              <label for="chartType" class="font-bold block mb-2">{{ 'STATISTICS.SELECT.TITLE.CHART-TYPE' | translate }}</label>
              <p-select 
                id="chartType" 
                [options]="chartTypes" 
                [(ngModel)]="chartType" 
                [style]="{ width: '150px' }" 
                (onChange)="onChartSelect()"
              >
                <ng-template let-item pTemplate="item">
                  <span>{{ item | titlecase }}</span>
                </ng-template>
                <ng-template let-item pTemplate="selectedItem">
                  <span>{{ item | titlecase }}</span>
                </ng-template>
              </p-select>
            </div>
          }
  
          @if(isPinnableToHome){ 
            @if(isChartPinnedToHome(dataType)){
              <p-button
                [label]="'BUTTONS.REMOVE-FROM-HOME' | translate" 
                [severity]="'danger'"
                (click)="removeChartFromHome(dataType)"
              />
            } @else {
              <p-button
                [label]="'BUTTONS.ADD-TO-HOME' | translate" 
                [severity]="'primary'"
                (click)="pinChartToHome(dataType)"
              />
            }
          }
        </div>

      </div>

      <div class="buttons">
        @for(period of periods; track trackByPeriod($index, period)){
          <p-button
            [label]="('BUTTONS.' + period | uppercase) | translate" 
            [severity]="timePeriod == period ? 'primary': 'secondary'"
            (click)="displayPeriod(period)"
          />
        }
      </div>

      <div class="fields">
        <div class="field">
          <label for="year" class="font-bold block mb-2">{{ 'STATISTICS.SELECT.TITLE.YEAR' | translate }}</label>
          <p-select
            id="year"
            [options]="availableYears"
            [(ngModel)]="selectedYear"
            [placeholder]="'STATISTICS.SELECT.DATA.SELECT-YEAR' | translate"
            [style]="{ width: '100%' }"
            (onChange)="onYearSelect()"
          >
            <ng-template let-item pTemplate="item">
              <span>{{ item }}</span>
            </ng-template>
            <ng-template let-item pTemplate="selectedItem">
              <span>{{ item }}</span>
            </ng-template>
          </p-select>
        </div>
        @for(metricField of metricFields; track $index){
          @if(metricField == 'month' && timePeriod == 'month'){
            <div class="field">
              <label for="month" class="font-bold block mb-2">{{ 'STATISTICS.SELECT.TITLE.MONTH' | translate }}</label>
              <p-select 
                id="month" 
                [options]="months" 
                [(ngModel)]="month" 
                [placeholder]="'STATISTICS.SELECT.DATA.SELECT-MONTH' | translate" 
                [style]="{ width: '100%' }" 
                (onChange)="onMonthSelect()"
              >
                <ng-template let-item pTemplate="item">
                  <span>{{ item }}</span>
                </ng-template>
                <ng-template let-item pTemplate="selectedItem">
                  <span>{{ item }}</span>
                </ng-template>
              </p-select>
            </div>
          } @else if(metricField == 'location'){
            <div class="field">
              <label for="location" class="font-bold block mb-2">{{ 'STATISTICS.SELECT.TITLE.LOCATION' | translate }}</label>
              <p-select 
                id="location" 
                [options]="houseNumbers" 
                [(ngModel)]="selectedHouseNumber" 
                [placeholder]="'STATISTICS.SELECT.DATA.SELECT-LOCATION' | translate" 
                [style]="{ width: '100%' }" 
                (onChange)="onHouseNumberChange()"
              >
                <ng-template let-item pTemplate="item">
                  <span>{{ item }}</span>
                </ng-template>
                <ng-template let-item pTemplate="selectedItem">
                  <span>{{ item }}</span>
                </ng-template>
              </p-select>
            </div>
          } @else if(metricField == 'metrics'){
            <div class="field">
              <label for="metric" class="font-bold block mb-2">{{ 'STATISTICS.SELECT.TITLE.METRIC' | translate }}</label>
              <p-multiselect 
                id="metric"
                [options]="metrics" 
                [(ngModel)]="selectedMetrics"
                optionLabel="name" 
                optionValue="value" 
                [placeholder]="'STATISTICS.SELECT.DATA.SELECT-METRIC' | translate" 
                [style]="{ width: '100%' }" 
                (onChange)="onMetricsSelect()"
              >
                <ng-template let-item pTemplate="item">
                  <span>{{ item.name }}</span>
                </ng-template>
              </p-multiselect>
            </div>
          }
        }
      </div>

      @if(chartType == 'pie' || chartType == 'doughnut'){
        <div class="pie-card">
          <p-chart 
            id="chart"
            [type]="chartType" 
            [data]="data" 
            [options]="options"
          />
        </div>
      } @else {
        <div class="card">
          <p-chart 
            id="chart"
            [type]="chartType" 
            [data]="data" 
            [options]="options"
          />
        </div>
      }

      @if(selectedMetrics.length && selectedHouseNumber){
        <div class="total-monthly-data">
          @for(metric of selectedMetrics; track trackByMetric($index, metric)){
            <span>
              {{getMetricName(metric)}}: {{totalMonthlyData[metric]}}
              @if(metric == 'occupancy') {
                %
              }
            </span>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    ::ng-deep .pie-card p-chart canvas {
      width: 100% !important;
      height: 100% !important;
    }

    .pie-card {
      width: 100%;
      max-width: 500px;
      padding: 50px 0 50px 0;
      box-sizing: border-box;
    }

    .chart-container{
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;

      .header{
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 0 15px 0 15px;

        .right-side{
          display: flex;
          flex-direction: row;
          align-items: end;
          justify-content: flex-end;
          gap: 10px;
          width: 50%;
        }
      }

      .buttons{
        width: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 50px;
        padding: 10px 0 10px 0;
  
        p-button{
  
          &:hover{
            cursor: pointer;
          }
        }
      }
  
      .fields{
        display: flex;
        flex-direction: row;
        width: 100%;
  
        .field{
          box-sizing: border-box;
          padding: 15px;
          width: 100%;
        }
      }

      .card{
        width: 100%;
        height: 100%;
      }
  
      .total-monthly-data{
        width: 100%;
        height: 20px;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 20px;
  
        span{
          font-size: 22px;
        }
      }
    }
  `
})
export class ChartComponent {

  @Input() title: string = '';
  @Input() dataType: string = '';
  @Input() canSelectDiagramType: boolean = false;
  @Input() periods: string[] = [];
  @Input() metrics: Metric[] = [];
  @Input() metricFields: string[] = [];
  @Input() isPinnableToHome: boolean = false;
  @Input() chartTypes: ChartType[] = [];
  
  platformId = inject(PLATFORM_ID);
  houseAvailabilities: HouseAvailability[] = [];
  houseAvailabilitiesForSelectedMonth: HouseAvailability[] = [];
  houses: House[] = [];
  houseNumbers: string[] = [ALL_HOUSES];
  tasks: Task[] = [];
  profiles: Profile[] = [];
  seasons: Season[] = [];
  availableYears: number[] = [];
  selectedYear: number = new Date().getFullYear();

  data: any;
  options: any;
  xLabels: string[] = [];
  selectedMonth: Date = new Date();
  selectedHouseNumber: string = ALL_HOUSES;
  selectedHouseId: number = -1;
  totalMonthlyData: { [metric: string]: number } = {};
  dataToDisplay: { [metric: string]: number[] } = {};
  month: string = '';
  timePeriod: string = PERIOD_MONTH;
  profileTaskMap: { [profileName: string]: number } = {};
  
  readonly months = [...MONTHS];
  readonly season = [...SEASON_MONTHS];
  staff: string[] = [];

  selectedMetric: string = '';
  selectedMetrics: string[] = [];

  isOccupancyChartAddedToHome: boolean = false;

  chartType?: ChartType;

  constructor(
    private cd: ChangeDetectorRef,
    private dataService: DataService,
    private taskService: TaskService,
    private layoutService: LayoutService,
    private statisticsService: StatisticsService,
  ) {
    effect(() => {
      const isDark = this.layoutService.layoutConfig().darkTheme;
      console.log('Dark mode changed:', isDark);

      if (this.isPieChartType()) {
        this.initPieChart();
      } else {
        this.initChart();
      }
    });
  }

  ngOnInit() {
    this.initializeChartType();

    combineLatest([
      this.dataService.houseAvailabilities$.pipe(nonNull()),
      this.dataService.houses$.pipe(nonNull()),
      this.dataService.tasks$.pipe(nonNull()),
      this.dataService.profiles$.pipe(nonNull()),
      this.dataService.seasons$.pipe(nonNull()),
    ])
    .pipe(take(1))
    .subscribe(([houseAvailabilities, houses, tasks, profiles, seasons]) => {
      this.houseAvailabilities = houseAvailabilities;
      this.houses = houses;
      this.tasks = tasks;
      this.profiles = profiles
        .filter(p => !p.is_test_user);
      this.staff = profiles
        .filter(p => !p.is_test_user)
        .map(profile => profile.first_name ?? 'Staff');
      this.seasons = seasons;

      this.initializeAvailableYears();
      this.selectedMonth = new Date(this.selectedYear, this.selectedMonth.getMonth(), 1);
      this.initializeHouseNumbers();
      this.loadAvailabilities();
      this.displayPeriod(PERIOD_MONTH);
    });
  }

  setDataForYear() {
    this.xLabels = this.dataType === DATA_TYPE_STAFF ? this.staff : this.months;
    this.generateYearlyDataset();
  }

  setDataForSeason() {
    this.xLabels = this.dataType === DATA_TYPE_STAFF ? this.staff : this.season;
    this.generateYearlyDataset();
  }

  getMetricName(name: string): string {
    const metricObj = this.metrics.find((m: Metric) => m.value === name);
    return metricObj ? metricObj.name : name;
  }

  trackByPeriod(index: number, period: string): string {
    return period;
  }

  trackByMetric(index: number, metric: string): string {
    return metric;
  }

  private initializeChartType(): void {
    switch (this.dataType) {
      case DATA_TYPE_OCCUPANCY:
        this.chartType = 'line';
        this.selectedMetrics = ['occupancy'];
        break;
      case DATA_TYPE_GENERAL:
        this.chartType = 'line';
        this.selectedMetrics = ['adults'];
        break;
      case DATA_TYPE_STAFF:
        this.chartType = 'bar';
        this.selectedMetrics = ['totalCompletedTasks'];
        break;
    }
  }

  private initializeHouseNumbers(): void {
    const validHouses = this.houses.filter(house =>
      !EXCLUDED_HOUSE_NAMES.includes(house.house_name as typeof EXCLUDED_HOUSE_NAMES[number]) &&
      !this.houseNumbers.includes(house.house_number.toString())
    );

    validHouses.forEach(house => {
      this.houseNumbers.push(house.house_number.toString());
    });

    this.houseNumbers.sort((a, b) => parseInt(a) - parseInt(b));
  }

  private initializeAvailableYears(): void {
    const currentYear = new Date().getFullYear();

    this.availableYears = this.seasons
      .map(season => season.year)
      .sort((a, b) => b - a);

    if (this.availableYears.includes(currentYear)) {
      this.selectedYear = currentYear;
    } else if (this.availableYears.length > 0) {
      this.selectedYear = this.availableYears[0];
    }
  }

  onYearSelect(): void {
    this.selectedMonth = new Date(this.selectedYear, this.selectedMonth.getMonth(), 1);

    if (this.timePeriod === PERIOD_YEAR) {
      this.setDataForYear();
    } else if (this.timePeriod === PERIOD_SEASON) {
      this.setDataForSeason();
    } else if (this.timePeriod === PERIOD_MONTH) {
      this.setDataForMonth();
    }
    this.cd.markForCheck();
  }

  private isPieChartType(): boolean {
    return this.chartType === 'pie' || this.chartType === 'doughnut';
  }

  private getYearMonthString(year: number, month: number): string {
    return `${year}-${(month + 1).toString().padStart(2, '0')}`;
  }

  private sumArray(arr: number[]): number {
    return arr.reduce((sum, val) => sum + val, 0);
  }

  onHouseNumberChange() {
    const house = this.houses.find(h => h.house_name === this.selectedHouseNumber);
    this.selectedHouseId = house?.house_id ?? -1;

    if (this.timePeriod === PERIOD_MONTH) {
      this.generateDataset();
    } else if (this.timePeriod === PERIOD_YEAR || this.timePeriod === PERIOD_SEASON) {
      this.generateYearlyDataset();
    }
    this.cd.markForCheck();
  }

  loadAvailabilities() {
    const selectedYear = this.selectedMonth.getFullYear();
    const selectedMonthIndex = this.selectedMonth.getMonth();

    const startOfMonth = new Date(selectedYear, selectedMonthIndex, 1);
    const endOfMonth = new Date(selectedYear, selectedMonthIndex + 1, 0, 23, 59, 59);

    this.houseAvailabilitiesForSelectedMonth = this.houseAvailabilities.filter(h => {
      const isSameHouse = h.house_id === this.selectedHouseId;
      const start = new Date(h.house_availability_start_date);
      const end = new Date(h.house_availability_end_date);

      return isSameHouse && this.datesOverlap(start, end, startOfMonth, endOfMonth);
    });
  }

  private datesOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return (start1 >= start2 && start1 <= end2) ||
           (end1 >= start2 && end1 <= end2) ||
           (start1 <= start2 && end1 >= end2);
  }

  onChartSelect() {
    this.onMetricsSelect();
  }

  onMonthSelect() {
    const monthIndex = this.months.indexOf(this.month as typeof MONTHS[number]);
    this.selectedMonth = new Date(this.selectedYear, monthIndex, 1);
    this.displayPeriod(PERIOD_MONTH);
  }

  onMetricsSelect() {
    if (this.timePeriod === PERIOD_MONTH) {
      this.generateDataset();
    } else if (this.timePeriod === PERIOD_YEAR || this.timePeriod === PERIOD_SEASON) {
      this.generateYearlyDataset();
    }
    this.cd.markForCheck();
  }

  setDataForMonth() {
    const currentDate = this.selectedMonth;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = this.getDaysInMonth(year, month);
    
    this.month = this.months[month];
    this.xLabels = this.dataType === DATA_TYPE_STAFF 
      ? this.staff 
      : Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());

    this.generateDataset(); 
  }

  private getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  resetTotalMonthlyData() {
    this.totalMonthlyData = {};
    this.dataToDisplay = {};
  }

  initEmptyMetrics(metric: string){
    this.totalMonthlyData[metric] = 0;
    this.dataToDisplay[metric] = [];
  }

  initMonthlyData(): number[] {
    if (this.timePeriod === PERIOD_YEAR) {
      return Array(this.months.length).fill(0); 
    } else if (this.timePeriod === PERIOD_SEASON) {
      if (this.dataType === DATA_TYPE_STAFF) {
        return Array(this.profiles.length).fill(0);
      } else {
        return Array(this.season.length).fill(0);
      }
    }

    return [];
  }

  getMonthIndex(index: number): number {
    if (this.timePeriod === PERIOD_SEASON) {
      const monthName = this.season[index];
      return this.months.indexOf(monthName);
    }
    return index;
  }

  getOccupancyDataForMonth(year: number, month: number): number[] {
    const monthIndex = this.getMonthIndex(month);
    const daysInMonth = this.getDaysInMonth(year, monthIndex);
    const data = Array(daysInMonth).fill(0);
    const houseCount = this.getValidHouseCount();
    const houseAvailabilitiesForSelectedHouse = this.getFilteredHouseAvailabilities();

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = new Date(year, monthIndex, day);
      data[day - 1] = this.calculateOccupancyForDay(
        currentDay, 
        houseAvailabilitiesForSelectedHouse, 
        houseCount
      );
    }

    return data;
  }

  private getValidHouseCount(): number {
    return this.houses.filter(house => 
      !EXCLUDED_HOUSE_NAMES.includes(house.house_name as typeof EXCLUDED_HOUSE_NAMES[number])
    ).length;
  }

  private getFilteredHouseAvailabilities(): HouseAvailability[] {
    if (this.selectedHouseNumber === ALL_HOUSES) {
      return this.houseAvailabilities;
    }
    return this.houseAvailabilities.filter(ha => ha.house_id === this.selectedHouseId);
  }

  private calculateOccupancyForDay(
    currentDay: Date, 
    availabilities: HouseAvailability[], 
    houseCount: number
  ): number {
    if (this.selectedHouseNumber === ALL_HOUSES) {
      const houseAvailabilitiesForToday = availabilities.filter(availability => {
        const start = new Date(availability.house_availability_start_date);
        const end = new Date(availability.house_availability_end_date);
        return currentDay >= start && currentDay <= end;
      });
      return (houseAvailabilitiesForToday.length / houseCount) * 100;
    } else {
      const isOccupied = availabilities.some(availability => {
        const start = new Date(availability.house_availability_start_date);
        const end = new Date(availability.house_availability_end_date);
        return currentDay >= start && currentDay <= end;
      });
      return isOccupied ? 100 : 0;
    }
  }

  getTaskDataForMonth(metric: string, year: number, month: number){
    const tasks = this.filterTasksForMetric(metric, year, month);
    const wantedDate = this.getYearMonthString(year, month);

    let data; 

      if (this.dataType === DATA_TYPE_STAFF) {
      const numberOfProfiles = this.staff.length;
      data = Array(numberOfProfiles).fill(0);
      this.profileTaskMap = {};

      for (let profileIndex = 0; profileIndex <= numberOfProfiles - 1; profileIndex++) {
        const profile = this.profiles[profileIndex];
        let completedTasksByProfileCount;

        if (this.selectedHouseNumber === ALL_HOUSES) {
          completedTasksByProfileCount = this.tasks.filter(t =>
            t.completed_by == profile.id && 
            t.end_time?.split('T')[0].substring(0, 7) == wantedDate
          ).length;

          data[profileIndex] = completedTasksByProfileCount;
        } else {
          const house = this.houses.find(h => h.house_name == this.selectedHouseNumber)

          completedTasksByProfileCount = this.tasks.filter(t => 
            t.completed_by == profile.id && 
            t.house_id == house?.house_id && 
            t.end_time?.split('T')[0].substring(0, 7) == wantedDate
          ).length;

          data[profileIndex] = completedTasksByProfileCount;
        }

        this.profileTaskMap[profile.first_name!] = completedTasksByProfileCount;
      }
    } else {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      data = Array(daysInMonth).fill(0)
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dayString = `${wantedDate}-${day.toString().padStart(2, '0')}`;
        const countForDay = tasks.filter(task => task.created_at.startsWith(dayString)).length;
  
        data[day - 1] = countForDay;
      }
    }  

    return data;
  }

  calculateOccupancyMetric(metric: string, year: number, monthlyData: number[]): number[] {
    const monthCount = this.timePeriod === PERIOD_SEASON ? this.season.length : this.months.length;

    for (let month = 0; month < monthCount; month++) {
      const monthIndex = this.getMonthIndex(month);
      const daysInMonth = this.getDaysInMonth(year, monthIndex);
      const data = this.getOccupancyDataForMonth(year, month);

      let occupancyPercent: number;
      if (this.selectedHouseNumber === ALL_HOUSES) {
        const monthlyPercentages = this.sumArray(data);
        occupancyPercent = Number((monthlyPercentages / daysInMonth).toFixed(2));
      } else {
        const daysOccupied = data.reduce((count, val) => count + (val ? 1 : 0), 0);
        occupancyPercent = Number(((daysOccupied / daysInMonth) * 100).toFixed(2));
      }

      monthlyData[month] = occupancyPercent;
    }

    return monthlyData;
  }

  filterTasksForMetric(metric: string, year: number, month: number){
    let tasks;
    const wantedDate = this.getYearMonthString(year, month);

    if(metric == 'totalCompletedTasks'){
      if (this.selectedHouseNumber === ALL_HOUSES) {
        tasks = this.tasks.filter(task => 
          task.completed_by && 
          task.end_time?.split('T')[0].substring(0, 7) == wantedDate
        );
      } else {
        tasks = this.tasks.filter(task => 
          task.completed_by && 
          task.house_id == this.selectedHouseId &&
          task.end_time?.split('T')[0].substring(0, 7) == wantedDate
        );
      }
    } else {
      if (this.selectedHouseNumber === ALL_HOUSES) {
        tasks = this.tasks.filter(task => 
          task.created_at.startsWith(wantedDate)
        );
      } else {
        tasks = this.tasks.filter(task => 
          task.house_id == this.selectedHouseId &&
          task.created_at.startsWith(wantedDate)
        );
      }
    
      if(metric.includes('Total') || metric.includes('total')) return tasks;
  
      if(metric.includes('Repair')){
        tasks = tasks.filter(task => this.taskService.isRepairTask(task));
      } else if(metric.includes('House')){
        tasks = tasks.filter(task => this.taskService.isHouseCleaningTask(task));
      } else if(metric.includes('Deck')){
        tasks = tasks.filter(task => this.taskService.isDeckCleaningTask(task));
      } else if(metric.includes('Unscheduled')){
        tasks = tasks.filter(task => task.is_unscheduled);
      } else if(metric.includes('Towel')){
        tasks = tasks.filter(task => this.taskService.isTowelChangeTask(task));
      } else if(metric.includes('Sheet')){
        tasks = tasks.filter(task => this.taskService.isSheetChangeTask(task));
      }
    }

    return tasks;
  }

  calculateTaskMetric(metric: string, year: number, monthlyData: number[]): number[] {
    const monthCount = this.timePeriod === PERIOD_SEASON ? this.season.length : this.months.length;

    if (this.timePeriod === PERIOD_SEASON && metric === 'totalCompletedTasks') {
      this.profileTaskMap = {};
      const completedTasksInSeason: Task[] = [];

      for (let month = 0; month < monthCount; month++) {
        const tasks = this.filterTasksForMetric(metric, year, this.getMonthIndex(month));
        completedTasksInSeason.push(...tasks);
      }

      this.profiles.forEach((profile, profileIndex) => {
        const completedTasksForProfile = completedTasksInSeason.filter(t => t.completed_by === profile.id);
        monthlyData[profileIndex] += completedTasksForProfile.length;
        this.profileTaskMap[profile.first_name!] = completedTasksForProfile.length;
      });
    } else {
      for (let month = 0; month < monthCount; month++) {
        const monthIndex = this.timePeriod === PERIOD_SEASON ? this.getMonthIndex(month) : month;
        const tasks = this.filterTasksForMetric(metric, year, monthIndex);
        monthlyData[month] += tasks.length;
      }
    }

    return monthlyData;
  }

  calculateAvailabilityMetric(metric: string, year: number, monthlyData: number[]): number[] {
    const filteredAvailabilities = this.getFilteredHouseAvailabilities();

    for (let month = 0; month < this.months.length; month++) {
      const wantedDate = this.getYearMonthString(year, month);

      filteredAvailabilities.forEach((availability: any) => {
        if (availability.house_availability_start_date.startsWith(wantedDate) || availability.house_availability_end_date.startsWith(wantedDate)) {
          monthlyData[month] += availability[metric] || 0;
        }
      });
    }

    return monthlyData;
  }

  getAvailabilityDataForMonth(metric: string, year: number, month: number){
    const daysInMonth = this.getDaysInMonth(year, month);
    const data = Array(daysInMonth).fill(0);
    const filteredAvailabilities = this.getFilteredHouseAvailabilities();

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = new Date(year, month, day);

      filteredAvailabilities.forEach((availability: any) => {
        const start = new Date(availability.house_availability_start_date);
        const end = new Date(availability.house_availability_end_date);

        if (currentDay >= start && currentDay <= end) {
          data[day - 1] += availability[metric] || 0;
        }
      });
    }

    return data;
  }

  generateDataset() {
    this.resetTotalMonthlyData();
    
    this.selectedMetrics.forEach(metric => {
      this.initEmptyMetrics(metric);

      const currentDate = this.selectedMonth;
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const wantedDate = this.getYearMonthString(year, month);

      let data = Array(daysInMonth).fill(0);
      const isTaskMetric = metric.includes('tasks') || metric.includes('Tasks');
      const isOccupancyMetric = metric.includes('occupancy');

      if (isOccupancyMetric) {
        data = this.getOccupancyDataForMonth(year, month);

        if (this.selectedHouseNumber === ALL_HOUSES) {
          const dailyPercentages = this.sumArray(data);
          this.totalMonthlyData[metric] = Number((dailyPercentages / daysInMonth).toFixed(2));
        } else {
          const daysOccupied = data.reduce((count, val) => count + (val ? 1 : 0), 0);
          this.totalMonthlyData[metric] = Number(((daysOccupied / daysInMonth) * 100).toFixed(2));
        }
      } else if (isTaskMetric) {
        data = this.getTaskDataForMonth(metric, year, month);
        this.totalMonthlyData[metric] = this.sumArray(data);
      } else {
        data = this.getAvailabilityDataForMonth(metric, year, month);

        const filteredAvailabilities = this.getFilteredHouseAvailabilities()
          .filter(ha =>
            ha.house_availability_start_date.startsWith(wantedDate) ||
            ha.house_availability_end_date.startsWith(wantedDate)
          );

        this.totalMonthlyData[metric] = filteredAvailabilities.reduce(
          (sum, ha: any) => sum + (ha[metric] || 0), 0
        );
      }

      this.dataToDisplay[metric] = data;
    });

    this.isPieChartType() ? this.initPieChart() : this.initChart();
    this.cd.markForCheck();
  }

  generateYearlyDataset() {
    this.resetTotalMonthlyData();
    const year = this.selectedYear;

    this.selectedMetrics.forEach(metric => {
      this.initEmptyMetrics(metric);

      const monthlyData = this.initMonthlyData();
      const isTaskMetric = metric.includes('tasks') || metric.includes('Tasks');
      const isOccupancyMetric = metric.includes('occupancy');

      let metricData: number[];

      if (isOccupancyMetric) {
        metricData = this.calculateOccupancyMetric(metric, year, monthlyData);
        const monthsCount = this.timePeriod === PERIOD_SEASON ? this.season.length : this.months.length;
        const totalData = this.sumArray(metricData);
        this.totalMonthlyData[metric] = Number((totalData / monthsCount).toFixed(2));
      } else if (isTaskMetric) {
        metricData = this.calculateTaskMetric(metric, year, monthlyData);
        this.totalMonthlyData[metric] = this.sumArray(metricData);
      } else {
        metricData = this.calculateAvailabilityMetric(metric, year, monthlyData);
        this.totalMonthlyData[metric] = this.sumArray(metricData);
      }

      this.dataToDisplay[metric] = metricData;
    });

    this.isPieChartType() ? this.initPieChart() : this.initChart();
    this.cd.markForCheck();
  }

  displayPeriod(period: string) {
    this.timePeriod = period;

    if (period === PERIOD_YEAR) {
      this.setDataForYear();
    } else if (period === PERIOD_SEASON) {
      this.setDataForSeason();
    } else if (period === PERIOD_MONTH) {
      this.setDataForMonth();
    }
    this.cd.markForCheck();
  }

  pinChartToHome(chart: string) {
    this.statisticsService.createPinnedChart(chart);
    this.cd.markForCheck();
  }

  removeChartFromHome(chart: string) {
    this.statisticsService.deletePinnedChart(chart);
    this.cd.markForCheck();
  }

  isChartPinnedToHome(chart: string): boolean {
    return !!this.statisticsService.isChartPinnedToHome(chart); 
  }

  initPieChart(){
    if(isPlatformBrowser(this.platformId)){
      const documentStyle = getComputedStyle(document.documentElement);

      const isNightMode = this.layoutService._config.darkTheme

      const textColor = isNightMode ? 'white' : 'black';

      let pieData: number[] = [];
      let pieColors: string[] = [];
      let pieLabels: string[] = [];

      Object.keys(this.dataToDisplay).forEach((metric, index) => {
        pieColors.push(documentStyle.getPropertyValue(CHART_COLORS[index % CHART_COLORS.length]));
        pieLabels.push(this.getMetricName(metric));
        pieData.push(this.totalMonthlyData[metric]);
      });

      this.data = {
        labels: pieLabels,
        datasets: [{
          data: pieData,
          backgroundColor: pieColors,
          borderColor: 'white',
          borderWidth: 1
        }]
      };

      this.options = {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: textColor
            }
          }
        }
      };
    }
  }

  initChart() {
    if (isPlatformBrowser(this.platformId)) {
      const documentStyle = getComputedStyle(document.documentElement);

      const isNightMode = this.layoutService._config.darkTheme

      const textColor = isNightMode ? 'white' : 'black';
      const textColorSecondary = isNightMode ? 'white' : 'gray';
      const surfaceBorder = isNightMode ? 'gray' : 'lightgray';

      const allValues = Object.values(this.dataToDisplay).flat();
      const maxDataValue = Math.max(...allValues);

      const hasOccupancy = Object.keys(this.dataToDisplay).includes('occupancy');

      const datasets = Object.keys(this.dataToDisplay).map((metric, index) => {
        const colorVar = CHART_COLORS[index % CHART_COLORS.length];
        const colorValue = documentStyle.getPropertyValue(colorVar);

        if (this.chartType === 'line') {
          return {
            label: this.getMetricName(metric),
            data: this.dataToDisplay[metric],
            fill: true,
            tension: 0,
            borderColor: colorValue,
            backgroundColor: colorValue + '33',
          };
        } else {
          return {
            label: this.getMetricName(metric),
            data: this.dataToDisplay[metric],
            fill: true,
            tension: 0,
            borderColor: 'white',
            backgroundColor: colorValue,
            borderWidth: 1,
          };
        }
      });

      const chartData: ChartData = {
        textColor: textColor,
        textColorSecondary: textColorSecondary,
        surfaceBorder: surfaceBorder,
        maxDataValue: maxDataValue,
        hasOccupancy: hasOccupancy,
        datasets: datasets,
      }

      if (this.dataType === DATA_TYPE_STAFF) {
        this.createChartData(chartData, true);
      } else {
        this.createChartData(chartData);
      }

      this.cd.markForCheck();
    }
  }

  createChartData(chartData: ChartData, isHorizontalBar: boolean = false) {
    if (this.dataType === 'staff') {
      const combined = Object.entries(this.profileTaskMap).map(([label, value]) => ({
        label,
        value
      }));

      combined.sort((a, b) => b.value - a.value);

      const sortedLabels = combined.map(item => item.label);
      const sortedValues = combined.map(item => item.value);

      chartData.datasets[0].data = sortedValues;
      this.xLabels = sortedLabels;
    }

    this.data = {
      labels: this.xLabels,
      datasets: chartData.datasets
    };

    this.options = {
      maintainAspectRatio: false,
      aspectRatio: 0.6,
      ...(isHorizontalBar && { indexAxis: 'y' }),
      plugins: {
        legend: {
          labels: {
            color: chartData.textColor
          }
        }
      },
      scales: {
        x: isHorizontalBar ? {
          ticks: {
            color: chartData.textColor,
            callback: (value: any) => Number.isInteger(value) ? value : null
          },
          grid: {
            color: chartData.surfaceBorder
          }
        } : {
          ticks: {
            color: chartData.textColor,
            autoSkip: false,
            callback: (value: any, index: number) => this.xLabels[index]
          },
          grid: {
            color: chartData.surfaceBorder
          }
        },
        y: isHorizontalBar ? {
          ticks: {
            color: chartData.textColor,
            autoSkip: false,
            callback: (value: any, index: number) => this.xLabels[index]
          },
          grid: {
            color: chartData.surfaceBorder
          }
        } : {
          min: 0,
          max: chartData.hasOccupancy ? Math.max(100, chartData.maxDataValue) : undefined,
          ticks: {
            color: chartData.textColor,
            callback: (value: any) => Number.isInteger(value) ? value : null
          },
          grid: {
            color: chartData.surfaceBorder
          }
        }
      }
    };
  }
}

