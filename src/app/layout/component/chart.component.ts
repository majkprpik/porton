import { ChangeDetectorRef, Component, effect, inject, Input, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { MultiSelect } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { CommonModule, isPlatformBrowser, TitleCasePipe } from '@angular/common';
import { DataService, House, HouseAvailability, Task } from '../../pages/service/data.service';
import { TaskService } from '../../pages/service/task.service';
import { combineLatest } from 'rxjs';
import { LayoutService } from '../service/layout.service';

type ChartType = 'bar' | 'line' | 'scatter' | 'bubble' | 'pie' | 'doughnut' | 'polarArea' | 'radar';

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
        <h1>{{title}}</h1>
        @if(dataType != 'occupancy'){
          <div class="field">
            <label for="location" class="font-bold block mb-2">{{ 'STATISTICS.SELECT.TITLE.CHART-TYPE' | translate }}*</label>
            <p-select 
              id="month" 
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
        @if(dataType == 'occupancy'){ 
          @if(isChartPinnedToHome('occupancy')){
            <p-button
              [label]="'BUTTONS.REMOVE-FROM-HOME' | translate" 
              [severity]="'danger'"
              (click)="removeChartFromHome('occupancy')"
            />
          } @else {
            <p-button
              [label]="'BUTTONS.ADD-TO-HOME' | translate" 
              [severity]="'primary'"
              (click)="pinChartToHome('occupancy')"
            />
          }
        }
      </div>
      <div class="buttons">
        @if(dataType == 'general'){
          <p-button
            [label]="'BUTTONS.YEAR' | translate" 
            [severity]="timePeriod == 'year' ? 'primary': 'secondary'"
            (click)="displayPeroid('year')"
          />
        }

        @if(dataType == 'occupancy'){
          <p-button
            [label]="'BUTTONS.SEASON' | translate" 
            [severity]="timePeriod == 'season' ? 'primary': 'secondary'"
            (click)="displayPeroid('season')"
          />
        }

        <p-button
          [label]="'BUTTONS.MONTH' | translate"
          [severity]="timePeriod == 'month' ? 'primary': 'secondary'"
          (click)="displayPeroid('month')"
        />  
      </div>

      <div class="fields">
        @if(timePeriod == 'month'){
          <div class="field">
            <label for="location" class="font-bold block mb-2">{{ 'STATISTICS.SELECT.TITLE.MONTH' | translate }}*</label>
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
        }

        <div class="field">
          <label for="location" class="font-bold block mb-2">{{ 'STATISTICS.SELECT.TITLE.LOCATION' | translate }}*</label>
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

        @if(dataType == 'general'){
          <div class="field">
            <label for="location" class="font-bold block mb-2">{{ 'STATISTICS.SELECT.TITLE.METRIC' | translate }}*</label>
            <p-multiselect 
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
          @for(metric of selectedMetrics; track metric){
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
  styles: `
    ::ng-deep .pie-card p-chart canvas {
      width: 100% !important;
      height: 100% !important;
    }

    .pie-card{
      width: 500px;
      padding: 50px 0 50px 0;
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
      }

      .buttons{
        width: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 50px;
  
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
  @Input() metrics: any = [];
  
  platformId = inject(PLATFORM_ID);
  houseAvailabilities: HouseAvailability[] = [];
  houseAvailabilitiesForSelectedMonth: HouseAvailability[] = [];
  houses: House[] = [];
  houseNumbers: string[] = ['All'];
  tasks: Task[] = [];

  data: any;
  options: any;
  xLabels: string[] = [];
  selectedMonth: Date = new Date();
  selectedHouseNumber: string = 'All';
  selectedHouseId: number = -1;
  totalMonthlyData: { [metric: string]: number } = {};
  dataToDisplay: { [metric: string]: number[] } = {};
  month: string = '';
  timePeriod: string = 'month';
  
  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  season = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November'];

  selectedMetric: string = '';
  selectedMetrics: string[] = [];

  isOccupancyChartAddedToHome: boolean = false

  chartType: ChartType = 'line';
  chartTypes: ChartType[] = ['bar', 'line', 'bubble', 'pie', 'doughnut'];

  constructor(
    private cd: ChangeDetectorRef,
    private dataService: DataService,
    private taskService: TaskService,
    private layoutService: LayoutService,
  ) {
    effect(() => {
      const isDark = this.layoutService.layoutConfig().darkTheme;
      console.log('Dark mode changed:', isDark);

      if(this.chartType == 'pie' || this.chartType == 'doughnut'){
        this.initPieChart();
      } else {
        this.initChart();
      }
    });
  }

  ngOnInit(){
    if(this.dataType == 'occupancy'){
      this.selectedMetrics = [];
      this.selectedMetrics.push('occupancy');
    }

    if(this.dataType == 'general'){
      this.selectedMetrics = [];
      this.selectedMetrics.push('adults');
    }

    combineLatest([
      this.dataService.houseAvailabilities$,
      this.dataService.houses$,
      this.dataService.tasks$
    ]).subscribe(([houseAvailabilities, houses, tasks]) => {
      this.houseAvailabilities = houseAvailabilities;
      this.houses = houses;
      this.tasks = tasks;

      this.houses.forEach(house => {
        if(!this.houseNumbers.includes(house.house_number.toString()) && house.house_name != 'Zgrada' && house.house_name != 'Parcele'){
          this.houseNumbers.push(house.house_number.toString());
        }
      });

      this.houseNumbers.sort((a, b) => parseInt(a) - parseInt(b));

      this.loadAvailabilities();
      this.displayPeroid('month');
    });
  }

  setDataForYear(){
    this.xLabels = this.months;
    this.generateYearlyDataset();
  }

  setDataForSeason(){
    this.xLabels = this.season;
    this.generateYearlyDataset();
  }

    getMetricName(name: string){
    const metricObj = this.metrics.find((m: any) => m.value == name);
    return metricObj ? metricObj.name : name;
  }

  onHouseNumberChange(){
    const house = this.houses.find(house => house.house_name == this.selectedHouseNumber);

    if(house){
      this.selectedHouseId = house?.house_id;
    }

    if(this.timePeriod == 'month'){
      this.generateDataset();
    } else if (this.timePeriod == 'year' || this.timePeriod == 'season'){
      this.generateYearlyDataset();
    }
  }

  loadAvailabilities(){
    const selectedYear = this.selectedMonth.getFullYear();
    const selectedMonthIndex = this.selectedMonth.getMonth();

    const startOfMonth = new Date(selectedYear, selectedMonthIndex, 1);
    const endOfMonth = new Date(selectedYear, selectedMonthIndex + 1, 0, 23, 59, 59);

    this.houseAvailabilitiesForSelectedMonth = this.houseAvailabilities.filter(h => {
      const isSameHouse = h.house_id === this.selectedHouseId;
      const start = new Date(h.house_availability_start_date);
      const end = new Date(h.house_availability_end_date);

      const overlapsMonth =
        (start >= startOfMonth && start <= endOfMonth) ||
        (end >= startOfMonth && end <= endOfMonth) ||
        (start <= startOfMonth && end >= endOfMonth);

      return isSameHouse && overlapsMonth;
    });
  }

  onChartSelect(){
    this.onMetricsSelect();
  }

  onMonthSelect(){
    const monthIndex = this.months.indexOf(this.month);
    const selectedMonth = new Date(new Date().getFullYear(), monthIndex, 1);

    this.selectedMonth = selectedMonth;
    this.displayPeroid('month');
  }

  onMetricsSelect(){
    if(this.timePeriod == 'month'){
      this.generateDataset();
    } else if(this.timePeriod == 'year' || this.timePeriod == 'season'){
      this.generateYearlyDataset();
    }
  }

  setDataForMonth(){
    const currentDate = this.selectedMonth;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    this.month = this.months[month];
    this.xLabels = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());

    this.generateDataset(); 
  }

  resetTotalMonthlyData() {
    for (const key in this.totalMonthlyData) {
      delete this.totalMonthlyData[key];
    }

    for (const key in this.dataToDisplay) {
      delete this.dataToDisplay[key];
    }
  }

  initEmptyMetrics(metric: string){
    this.totalMonthlyData[metric] = 0;
    this.dataToDisplay[metric] = [];
  }

  initMonthlyData(){
    if(this.timePeriod == 'year'){
      return Array(this.months.length).fill(0); 
    } else if (this.timePeriod == 'season'){
      return Array(this.season.length).fill(0);
    }

    return [];
  }

  getMonthIndex(index: number){
    if (this.timePeriod == 'season') {
      const monthName = this.season[index];
      return this.months.indexOf(monthName);
    }
    return index;
  }

  getOccupancyDataForMonth(year: number, month: number){
    let houseAvailabilitiesForSelectedHouse;
    let monthIndex = this.getMonthIndex(month);
    
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    let data = Array(daysInMonth).fill(0); 
    const houseCount = this.houses.filter(house => house.house_name != 'Zgrada' && house.house_name != 'Parcele').length;

    if(this.selectedHouseNumber == 'All'){
      houseAvailabilitiesForSelectedHouse = this.houseAvailabilities;
    } else {
      houseAvailabilitiesForSelectedHouse = this.houseAvailabilities.filter(ha => ha.house_id == this.selectedHouseId);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = new Date(year, monthIndex, day);

      if(this.selectedHouseNumber == 'All'){
        const houseAvailabilitiesForToday = houseAvailabilitiesForSelectedHouse.filter((availability: any) => {
          const start = new Date(availability.house_availability_start_date);
          const end = new Date(availability.house_availability_end_date);
          return currentDay >= start && currentDay <= end;
        });

        data[day - 1] = (houseAvailabilitiesForToday.length / houseCount) * 100;
      } else {
        data[day - 1] = houseAvailabilitiesForSelectedHouse.some((availability: any) => {
          const start = new Date(availability.house_availability_start_date);
          const end = new Date(availability.house_availability_end_date);
          return currentDay >= start && currentDay <= end;
        });

        data[day - 1] = data[day - 1] ? 100 : 0;
      }
    }

    return data;
  }

  getTaskDataForMonth(metric: string, year: number, month: number){
    const tasks = this.filterTasksForMetric(metric, year, month);
    const wantedDate = new Date(year, month + 1, 0).toISOString().split('T')[0].substring(0, 7);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let data = Array(daysInMonth).fill(0); 
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayString = `${wantedDate}-${day.toString().padStart(2, '0')}`;
      const countForDay = tasks.filter(task => task.created_at.startsWith(dayString)).length;

      data[day - 1] = countForDay;
    }

    return data;
  }

  calculateOccupancyMetric(metric: string, year: number, monthlyData: any){
    for (let month = 0; month < monthlyData.length - 1; month++){
      let monthIndex = this.getMonthIndex(month);
      
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      const data = this.getOccupancyDataForMonth(year, month);

      if(this.selectedHouseNumber == 'All'){
        let monthlyPercentages = 0;

        data.forEach(data => {
          monthlyPercentages += data;
        });

        this.totalMonthlyData[metric] = Number(((monthlyPercentages / daysInMonth)).toFixed(2)); 
      } else {
        let daysOccupied = 0;

        data.forEach(data => {
          daysOccupied += data ? 1 : 0;
        });

        this.totalMonthlyData[metric] = Number(((daysOccupied / daysInMonth) * 100).toFixed(2));
      }

      monthlyData[month] = this.totalMonthlyData[metric];
    }

    return monthlyData;
  }

  filterTasksForMetric(metric: string, year: number, month: number){
    let tasks;
  
    const wantedDate = new Date(year, month + 1, 0).toISOString().split('T')[0].substring(0, 7);
  
    if(this.selectedHouseNumber == 'All'){
      tasks = this.tasks.filter(task => 
        task.created_at.startsWith(wantedDate)
      );
    } else {
      tasks = this.tasks.filter(task => 
        task.house_id == this.selectedHouseId &&
        task.created_at.startsWith(wantedDate)
      );
    }
  
    if(metric.includes('Total')) return tasks;

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

    return tasks;
  }

  calculateTaskMetric(metric: string, year: number, monthlyData: any){
    for (let month = 0; month < this.months.length - 1; month++) {
      const tasks = this.filterTasksForMetric(metric, year, month);
  
      monthlyData[month] += tasks.length;
    }

    return monthlyData;
  }

  calculateAvailabilityMetric(metric: string, year: number, monthlyData: any){
    for (let month = 0; month < this.months.length - 1; month++){
      const wantedDate = new Date(year, month + 1, 0).toISOString().split('T')[0].substring(0, 7);
  
      if(this.selectedHouseNumber == 'All'){
        this.houseAvailabilities.forEach((availability: any) => {
          if(availability.house_availability_start_date.startsWith(wantedDate)){
            monthlyData[month] += availability[metric] ? availability[metric] : 0;
          }
        });
      } else {
        const houseAvailabilitiesForHouse = this.houseAvailabilities.filter(ha => ha.house_id == this.selectedHouseId);
    
        houseAvailabilitiesForHouse.forEach((availability: any) => {
          if(availability.house_availability_start_date.startsWith(wantedDate) || availability.house_availability_end_date.startsWith(wantedDate)){
            monthlyData[month] += availability[metric] ? availability[metric] : 0;
          }
        });
      }
    }

    return monthlyData;
  }

  getAvailabilityDataForMonth(metric: string, year: number, month: number){
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let data = Array(daysInMonth).fill(0);

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = new Date(year, month, day);

      if(this.selectedHouseNumber == 'All'){
        this.houseAvailabilities.forEach((availability: any) => {
          const start = new Date(availability.house_availability_start_date);
          const end = new Date(availability.house_availability_end_date);
    
          if (currentDay >= start && currentDay <= end) {
            data[day - 1] += availability[metric] || 0;
          }
        });
      } else {
        this.houseAvailabilities.forEach((availability: any) => {
          if (availability.house_id == this.selectedHouseId) {
            const start = new Date(availability.house_availability_start_date);
            const end = new Date(availability.house_availability_end_date);
    
            if (currentDay >= start && currentDay <= end) {
              data[day - 1] += availability[metric] || 0;
            }
          }
        });
      }
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
      const wantedDate = new Date(year, month + 1, 0).toISOString().split('T')[0].substring(0, 7);

      let data = Array(daysInMonth).fill(0);
      const isTaskMetric = metric.includes('tasks');
      const isOccupancyMetric = metric.includes('occupancy');

      if(isOccupancyMetric){
        data = this.getOccupancyDataForMonth(year, month);  

        if(this.selectedHouseNumber == 'All'){
          let dailyPercentages = 0;

          data.forEach(data => {
            dailyPercentages += data;
          });

          this.totalMonthlyData[metric] = Number(((dailyPercentages / daysInMonth)).toFixed(2));
        } else {
          let daysOccupied = 0;

          data.forEach(data => {
            daysOccupied += data ? 1 : 0;
          });

          this.totalMonthlyData[metric] = Number(((daysOccupied / daysInMonth) * 100).toFixed(2));
        }
      } else if(isTaskMetric){
        data = this.getTaskDataForMonth(metric, year, month);

        data.forEach(data => {
          this.totalMonthlyData[metric] += data;
        });
      } else {
        data = this.getAvailabilityDataForMonth(metric, year, month);

        let houseAvailabilitiesForSelectedMonth = this.houseAvailabilities
          .filter(ha => 
            (ha.house_availability_start_date.startsWith(wantedDate) || ha.house_availability_end_date.startsWith(wantedDate))
          );

        if(this.selectedHouseNumber != 'All'){
          houseAvailabilitiesForSelectedMonth = houseAvailabilitiesForSelectedMonth
            .filter(ha => ha.house_id == this.selectedHouseId
          );
        }
        
        houseAvailabilitiesForSelectedMonth.forEach((ha: any) => {
          this.totalMonthlyData[metric] += ha[metric];
        });
      }

      this.dataToDisplay[metric] = data;
    });

    (this.chartType == 'pie' || this.chartType == 'doughnut') ? this.initPieChart() : this.initChart();
  }

  
  generateYearlyDataset() {
    this.resetTotalMonthlyData();

    const year = new Date().getFullYear(); 
    
    this.selectedMetrics.forEach(metric => {
      this.initEmptyMetrics(metric);

      let monthlyData = this.initMonthlyData();

      const isTaskMetric = metric.includes('tasks');
      const isOccupancyMetric = metric.includes('occupancy');

      let metricData;

      if(isOccupancyMetric){
        metricData = this.calculateOccupancyMetric(metric, year, monthlyData);
        
        let totalData = 0;
        //preskoci zadnji mjesec jer nije u sezoni, u mjesecima je jer se samo displaya na grafu
        const monthsCount = this.timePeriod == 'season' ? monthlyData.length - 1 : monthlyData.length;

        for (let i = 0; i < monthlyData.length - 1; i++){
          totalData += metricData[i]
        }

        this.totalMonthlyData[metric] = Number((totalData / monthsCount).toFixed(2));
      } else if(isTaskMetric){
        metricData = this.calculateTaskMetric(metric, year, monthlyData);

        metricData.forEach((data: any) => {
          this.totalMonthlyData[metric] += data;
        });
      } else {
        metricData = this.calculateAvailabilityMetric(metric, year, monthlyData);
        
        metricData.forEach((data: any) => {
          this.totalMonthlyData[metric] += data;
        });
      }

      this.dataToDisplay[metric] = metricData;
    });

    (this.chartType == 'pie' || this.chartType == 'doughnut') ? this.initPieChart() : this.initChart();
  }

  displayPeroid(period: string){
    this.timePeriod = period;

    if(period == 'year'){
      this.setDataForYear();
    } else if (period == 'season'){
      this.setDataForSeason();
    } else if (period == 'month'){
      this.setDataForMonth();
    }
  }

  pinChartToHome(chart: string){
    this.layoutService.storePinnedChartToLocalStorage(chart);
  }

  removeChartFromHome(chart: string){
    this.layoutService.removePinnedChartFromLocalStorage(chart);
  }

  isChartPinnedToHome(chart: string){
    return this.layoutService.isChartPinnedToHome(chart);
  }

  initPieChart(){
    if(isPlatformBrowser(this.platformId)){
      const documentStyle = getComputedStyle(document.documentElement);

      const isNightMode = this.layoutService._config.darkTheme

      const textColor = isNightMode ? 'white' : 'black';

      let pieData: number[] = [];
      let pieColors: string[] = [];
      let pieLabels: string[] = [];

      const colors = [
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
      ];

      Object.keys(this.dataToDisplay).forEach((metric, index) => {
        pieColors.push(documentStyle.getPropertyValue(colors[index % colors.length]));
        pieLabels.push(this.metrics.find((m: any) => m.value == metric)?.name || metric);
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
        const colors = [
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
        ];

        const colorVar = colors[index % colors.length];

        if(this.chartType == 'line'){
          return {
            label: this.metrics.find((m: any) => m.value == metric)?.name,
            data: this.dataToDisplay[metric],
            fill: true,
            tension: 0,
            borderColor: documentStyle.getPropertyValue(colorVar),
            backgroundColor: documentStyle.getPropertyValue(colorVar) + '33',
          };
        } else {
          return {
            label: this.metrics.find((m: any) => m.value == metric)?.name,
            data: this.dataToDisplay[metric],
            fill: true,
            tension: 0,
            borderColor: 'white',
            backgroundColor: documentStyle.getPropertyValue(colorVar),
            borderWidth: 1,
          };
        }
      });

      if(this.chartType == 'line'){
        this.data = {
          labels: this.xLabels,
          datasets: datasets
        };

        this.options = {
          maintainAspectRatio: false,
          aspectRatio: 0.6,
          plugins: {
            legend: {
              labels: {
                color: textColor
              }
            }
          },
          scales: {
            x: {
              ticks: {
                color: textColorSecondary
              },
              grid: {
                color: surfaceBorder
              }
            },
            y: {
              min: 0,
              max: hasOccupancy ? Math.max(100, maxDataValue) : undefined,
              ticks: {
                color: textColorSecondary,
                callback: function (value: number | string) {
                  return Number(value) % 1 === 0 ? value : '';
                }
              },
              grid: {
                color: surfaceBorder
              }
            }
          }
        };
      } else {
        this.data = {
          labels: this.xLabels,
          datasets: datasets
        };

        this.options = {
          maintainAspectRatio: false,
          aspectRatio: 0.6,
          plugins: {
            legend: {
              labels: {
                color: textColor
              }
            }
          },
          scales: {
            x: {
              ticks: {
                color: textColorSecondary
              },
              grid: {
                color: surfaceBorder
              }
            },
            y: {
              min: 0,
              max: hasOccupancy ? Math.max(100, maxDataValue) : undefined,
              ticks: {
                color: textColorSecondary,
                callback: function (value: number | string) {
                  return Number(value) % 1 === 0 ? value : '';
                }
              },
              grid: {
                color: surfaceBorder
              }
            }
          }
        };
      }

      this.cd.markForCheck();
    }
  }
}
