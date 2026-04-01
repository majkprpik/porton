import { ChangeDetectorRef, ChangeDetectionStrategy, Component, effect, inject, Input, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { MultiSelect } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { CommonModule, isPlatformBrowser, TitleCasePipe } from '@angular/common';
import { ChartType, House, HouseAvailability, Profile, Season, Task } from '../../core/models/data.models';
import { combineLatest, take } from 'rxjs';
import { LayoutService } from '../../layout/services/layout.service';
import { DataService } from '../../core/services/data.service';
import { nonNull } from '../../shared/rxjs-operators/non-null';
import { StatisticsService } from '../../core/services/statistics.service';
import { ChartDataService, MetricCalculationContext } from './chart-data.service';
import { ChartOptionsBuilder } from './chart-options.builder';
import {
  MONTHS,
  SEASON_MONTHS,
  EXCLUDED_HOUSE_NAMES,
  ALL_HOUSES,
  PERIOD_MONTH,
  PERIOD_YEAR,
  PERIOD_SEASON,
  DATA_TYPE_STAFF,
  DATA_TYPE_GENERAL,
  DATA_TYPE_OCCUPANCY,
  Metric,
} from './chart.constants';

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
    ::ng-deep p-chart canvas {
      max-width: 100% !important;
    }

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
      max-width: 100%;
      box-sizing: border-box;
      overflow: hidden;

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

    @media (max-width: 991px) {
      .chart-container {
        .header {
          flex-direction: row;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
          padding: 0 4px;

          h1 {
            font-size: 1.1rem;
            margin: 0;
            flex: 1;
          }

          .right-side {
            width: auto;
            flex-wrap: wrap;
            gap: 6px;
          }
        }

        .buttons {
          gap: 6px;
          flex-wrap: wrap;
          justify-content: flex-start;
          padding: 6px 4px;
        }

        .fields {
          display: flex !important;
          flex-direction: column !important;
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;

          .field {
            padding: 6px 4px;
            box-sizing: border-box;
            width: 100%;
            overflow: hidden;

            label {
              font-size: 0.75rem;
              margin-bottom: 4px !important;
            }
          }
        }

        ::ng-deep .fields .p-select,
        ::ng-deep .fields .p-multiselect {
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }

        .total-monthly-data {
          flex-wrap: wrap;
          height: auto;
          gap: 6px;
          padding: 4px;

          span {
            font-size: 14px;
          }
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

  // Data sources
  houseAvailabilities: HouseAvailability[] = [];
  houses: House[] = [];
  tasks: Task[] = [];
  profiles: Profile[] = [];
  seasons: Season[] = [];

  // UI state
  houseNumbers: string[] = [ALL_HOUSES];
  availableYears: number[] = [];
  selectedYear: number = new Date().getFullYear();
  selectedMonth: Date = new Date();
  selectedHouseNumber: string = ALL_HOUSES;
  selectedHouseId: number = -1;
  month: string = '';
  timePeriod: string = PERIOD_MONTH;
  selectedMetrics: string[] = [];
  chartType?: ChartType;

  // Chart data
  data: any;
  options: any;
  xLabels: string[] = [];
  totalMonthlyData: { [metric: string]: number } = {};
  dataToDisplay: { [metric: string]: number[] } = {};
  profileTaskMap: { [profileName: string]: number } = {};

  readonly months = [...MONTHS];
  readonly season = [...SEASON_MONTHS];
  staff: string[] = [];

  private chartOptionsBuilder?: ChartOptionsBuilder;

  constructor(
    private cd: ChangeDetectorRef,
    private dataService: DataService,
    private layoutService: LayoutService,
    private statisticsService: StatisticsService,
    private chartDataService: ChartDataService,
  ) {
    effect(() => {
      const isDark = this.layoutService.layoutConfig().darkTheme;
      if (this.isPieChartType()) {
        this.buildPieChart();
      } else {
        this.buildChart();
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
      this.profiles = profiles.filter(p => !p.is_test_user);
      this.staff = this.profiles.map(profile => profile.first_name ?? 'Staff');
      this.seasons = seasons;

      this.initializeAvailableYears();
      this.selectedMonth = new Date(this.selectedYear, this.selectedMonth.getMonth(), 1);
      this.initializeHouseNumbers();
      this.displayPeriod(PERIOD_MONTH);
    });
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
    this.refreshData();
  }

  onHouseNumberChange(): void {
    const house = this.houses.find(h => h.house_name === this.selectedHouseNumber);
    this.selectedHouseId = house?.house_id ?? -1;
    this.refreshData();
  }

  onMonthSelect(): void {
    const monthIndex = this.months.indexOf(this.month as typeof MONTHS[number]);
    this.selectedMonth = new Date(this.selectedYear, monthIndex, 1);
    this.displayPeriod(PERIOD_MONTH);
  }

  onChartSelect(): void {
    this.onMetricsSelect();
  }

  onMetricsSelect(): void {
    this.refreshData();
  }

  displayPeriod(period: string): void {
    this.timePeriod = period;

    if (period === PERIOD_YEAR) {
      this.xLabels = this.dataType === DATA_TYPE_STAFF ? this.staff : this.months;
      this.generateYearlyDataset();
    } else if (period === PERIOD_SEASON) {
      this.xLabels = this.dataType === DATA_TYPE_STAFF ? this.staff : this.season;
      this.generateYearlyDataset();
    } else if (period === PERIOD_MONTH) {
      this.setDataForMonth();
    }
    this.cd.markForCheck();
  }

  private refreshData(): void {
    if (this.timePeriod === PERIOD_MONTH) {
      this.generateDataset();
    } else {
      this.generateYearlyDataset();
    }
    this.cd.markForCheck();
  }

  private setDataForMonth(): void {
    const currentDate = this.selectedMonth;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = this.chartDataService.getDaysInMonth(year, month);

    this.month = this.months[month];
    this.xLabels = this.dataType === DATA_TYPE_STAFF
      ? this.staff
      : Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());

    this.generateDataset();
  }

  private getCalculationContext(): MetricCalculationContext {
    return {
      tasks: this.tasks,
      profiles: this.profiles,
      houses: this.houses,
      houseAvailabilities: this.houseAvailabilities,
      selectedHouseNumber: this.selectedHouseNumber,
      selectedHouseId: this.selectedHouseId,
      timePeriod: this.timePeriod,
      dataType: this.dataType,
    };
  }

  private generateDataset(): void {
    this.totalMonthlyData = {};
    this.dataToDisplay = {};

    const ctx = this.getCalculationContext();
    const year = this.selectedMonth.getFullYear();
    const month = this.selectedMonth.getMonth();
    const daysInMonth = this.chartDataService.getDaysInMonth(year, month);

    this.selectedMetrics.forEach(metric => {
      this.totalMonthlyData[metric] = 0;
      this.dataToDisplay[metric] = [];

      const isTaskMetric = metric.includes('tasks') || metric.includes('Tasks');
      const isOccupancyMetric = metric.includes('occupancy');

      let data: number[];

      if (isOccupancyMetric) {
        data = this.chartDataService.getOccupancyDataForMonth(year, month, ctx);
        this.totalMonthlyData[metric] = this.calculateOccupancyTotal(data, daysInMonth);
      } else if (isTaskMetric) {
        const result = this.chartDataService.getTaskDataForMonth(metric, year, month, ctx);
        data = result.data;
        this.totalMonthlyData[metric] = result.total;
        if (result.profileTaskMap) {
          this.profileTaskMap = result.profileTaskMap;
        }
      } else {
        data = this.chartDataService.getAvailabilityDataForMonth(metric, year, month, ctx);
        this.totalMonthlyData[metric] = this.chartDataService.calculateAvailabilityTotal(metric, year, month, ctx);
      }

      this.dataToDisplay[metric] = data;
    });

    this.isPieChartType() ? this.buildPieChart() : this.buildChart();
    this.cd.markForCheck();
  }

  private generateYearlyDataset(): void {
    this.totalMonthlyData = {};
    this.dataToDisplay = {};

    const ctx = this.getCalculationContext();
    const year = this.selectedYear;

    this.selectedMetrics.forEach(metric => {
      this.totalMonthlyData[metric] = 0;
      this.dataToDisplay[metric] = [];

      const monthlyData = this.chartDataService.initMonthlyData(this.timePeriod, this.dataType, this.profiles.length);
      const isTaskMetric = metric.includes('tasks') || metric.includes('Tasks');
      const isOccupancyMetric = metric.includes('occupancy');

      let metricData: number[];

      if (isOccupancyMetric) {
        metricData = this.chartDataService.calculateOccupancyMetric(year, monthlyData, ctx);
        const monthsCount = this.timePeriod === PERIOD_SEASON ? SEASON_MONTHS.length : MONTHS.length;
        this.totalMonthlyData[metric] = Number((this.chartDataService.sumArray(metricData) / monthsCount).toFixed(2));
      } else if (isTaskMetric) {
        const result = this.chartDataService.calculateTaskMetric(metric, year, monthlyData, ctx);
        metricData = result.data;
        this.profileTaskMap = result.profileTaskMap;
        this.totalMonthlyData[metric] = this.chartDataService.sumArray(metricData);
      } else {
        metricData = this.chartDataService.calculateAvailabilityMetric(metric, year, monthlyData, ctx);
        this.totalMonthlyData[metric] = this.chartDataService.sumArray(metricData);
      }

      this.dataToDisplay[metric] = metricData;
    });

    this.isPieChartType() ? this.buildPieChart() : this.buildChart();
    this.cd.markForCheck();
  }

  private calculateOccupancyTotal(data: number[], daysInMonth: number): number {
    if (this.selectedHouseNumber === ALL_HOUSES) {
      return Number((this.chartDataService.sumArray(data) / daysInMonth).toFixed(2));
    } else {
      const daysOccupied = data.reduce((count, val) => count + (val ? 1 : 0), 0);
      return Number(((daysOccupied / daysInMonth) * 100).toFixed(2));
    }
  }

  private isPieChartType(): boolean {
    return this.chartType === 'pie' || this.chartType === 'doughnut';
  }

  private ensureChartBuilder(): void {
    if (!this.chartOptionsBuilder && isPlatformBrowser(this.platformId)) {
      this.chartOptionsBuilder = new ChartOptionsBuilder();
    }
  }

  private buildPieChart(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.ensureChartBuilder();

    const isDarkMode = this.layoutService._config.darkTheme ?? false;
    const result = this.chartOptionsBuilder!.buildPieChart(
      this.dataToDisplay,
      this.totalMonthlyData,
      this.metrics,
      isDarkMode
    );

    this.data = result.data;
    this.options = result.options;
  }

  private buildChart(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.ensureChartBuilder();

    const isDarkMode = this.layoutService._config.darkTheme ?? false;
    const isStaffChart = this.dataType === DATA_TYPE_STAFF;

    const result = this.chartOptionsBuilder!.buildBarOrLineChart(
      this.dataToDisplay,
      this.xLabels,
      this.metrics,
      this.chartType!,
      isDarkMode,
      isStaffChart,
      this.profileTaskMap
    );

    this.data = result.data;
    this.options = result.options;

    if (isStaffChart && this.profileTaskMap) {
      const combined = Object.entries(this.profileTaskMap)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);
      this.xLabels = combined.map(item => item.label);
    }

    this.cd.markForCheck();
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

  pinChartToHome(chart: string): void {
    this.statisticsService.createPinnedChart(chart);
    this.cd.markForCheck();
  }

  removeChartFromHome(chart: string): void {
    this.statisticsService.deletePinnedChart(chart);
    this.cd.markForCheck();
  }

  isChartPinnedToHome(chart: string): boolean {
    return !!this.statisticsService.isChartPinnedToHome(chart);
  }
}
