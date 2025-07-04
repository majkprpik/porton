import { ChangeDetectorRef, Component, inject, Input, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { MultiSelect } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { isPlatformBrowser } from '@angular/common';
import { DataService, House, HouseAvailability, Task } from '../../pages/service/data.service';
import { TaskService } from '../../pages/service/task.service';
import { combineLatest } from 'rxjs';
import { LayoutService } from '../service/layout.service';

@Component({
  selector: 'app-chart',
  imports: [
    ChartModule,
    SelectModule,
    FormsModule,
    TranslateModule,
    ButtonModule,
    MultiSelect,
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>{{title}}</h1>
        @if(dataType == 'occupancy'){ 
          @if(isOccupancyChartAddedToHome){
            <p-button
              [label]="'BUTTONS.REMOVE-FROM-HOME' | translate" 
              [severity]="'danger'"
              (click)="toggleOccupancyChartOnHomeScreen(false)"
            />
          } @else {
            <p-button
              [label]="'BUTTONS.ADD-TO-HOME' | translate" 
              [severity]="'primary'"
              (click)="toggleOccupancyChartOnHomeScreen(true)"
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

      <div class="card">
        <p-chart type="line" [data]="data" [options]="options" class="h-[30rem]" />
      </div>

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
    .container{
      .header{
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
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

  constructor(
    private cd: ChangeDetectorRef,
    private dataService: DataService,
    private taskService: TaskService,
    private layoutService: LayoutService,
  ) {
        
  }

  ngOnInit(){
    if(this.dataType == 'occupancy'){
      this.selectedMetrics = [];
      this.selectedMetrics.push('occupancy');

      this.layoutService.$isOccupancyChartVisible.subscribe(res => {
        this.isOccupancyChartAddedToHome = res;
      });
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
        if(!this.houseNumbers.includes(house.house_number.toString())){
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

  calculateOccupancyMetric(metric: string, year: number, monthlyData: any){
    const houseCount = this.houses.filter(house => house.house_name != 'Zgrada' && house.house_name != 'Parcela').length;
    let houseAvailabilitesForHouse;

    if(this.selectedHouseNumber == 'All'){
      houseAvailabilitesForHouse = this.houseAvailabilities;
    } else {
      houseAvailabilitesForHouse = this.houseAvailabilities.filter(ha => ha.house_id == this.selectedHouseId);
    }

    for (let month = 0; month < monthlyData.length; month++){
      let haArray = [];
      let monthIndex = this.getMonthIndex(month);
      
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      const data = Array(daysInMonth).fill(0);

      for (let day = 1; day <= daysInMonth; day++) {
        const currentDay = new Date(year, monthIndex, day);

        haArray = houseAvailabilitesForHouse.filter((availability: any) => {
          const start = new Date(availability.house_availability_start_date);
          const end = new Date(availability.house_availability_end_date);
          return currentDay >= start && currentDay <= end;
        });

        if(this.selectedHouseNumber == 'All'){
          data[day - 1] = (haArray.length / houseCount) * 100;
        } else {
          data[day - 1] = houseAvailabilitesForHouse.some((availability: any) => {
            const start = new Date(availability.house_availability_start_date);
            const end = new Date(availability.house_availability_end_date);
            return currentDay >= start && currentDay <= end;
          });

          data[day - 1] = data[day - 1] ? 100 : 0;
        }
      }

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

  calculateTaskMetric(metric: string, year: number, monthlyData: any){
    for (let month = 0; month < this.months.length - 1; month++) {
      const wantedDate = new Date(year, month + 1, 0).toISOString().split('T')[0].substring(0, 7);
      let tasks
  
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
  
      if(!metric.includes('Total')){
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

  generateDataset() {
    this.resetTotalMonthlyData();

    const currentDate = this.selectedMonth;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const wantedDate = new Date(year, month + 1, 0).toISOString().split('T')[0].substring(0, 7);

    this.selectedMetrics.forEach(metric => {
      this.initEmptyMetrics(metric);

      const data = Array(daysInMonth).fill(0);
      const isTaskMetric = metric.includes('tasks');
      const isOccupancyMetric = metric.includes('occupancy');

      if(isOccupancyMetric){
        let houseAvailabilitesForHouse;
        const houseCount = this.houses.filter(house => house.house_name != 'Zgrada' && house.house_name != 'Parcela').length;

        if(this.selectedHouseNumber == 'All'){
          houseAvailabilitesForHouse = this.houseAvailabilities;
        } else {
          houseAvailabilitesForHouse = this.houseAvailabilities.filter(ha => ha.house_id == this.selectedHouseId);
        }
        
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month, daysInMonth);

        houseAvailabilitesForHouse = houseAvailabilitesForHouse.filter(availability => {
          const start = new Date(availability.house_availability_start_date);
          const end = new Date(availability.house_availability_end_date);
          return end >= monthStart && start <= monthEnd;
        });

        for (let day = 1; day <= daysInMonth; day++) {
          const currentDay = new Date(year, month, day);

          if(this.selectedHouseNumber == 'All'){
            const haArray = houseAvailabilitesForHouse.filter((availability: any) => {
              const start = new Date(availability.house_availability_start_date);
              const end = new Date(availability.house_availability_end_date);
              return currentDay >= start && currentDay <= end;
            });

            data[day - 1] = (haArray.length / houseCount) * 100;
          } else {
            data[day - 1] = houseAvailabilitesForHouse.some((availability: any) => {
              const start = new Date(availability.house_availability_start_date);
              const end = new Date(availability.house_availability_end_date);
              return currentDay >= start && currentDay <= end;
            });
            data[day - 1] = data[day - 1] ? 100 : 0;
          }
        }
      } else if(isTaskMetric){
        let tasks;

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

        if(!metric.includes('Total')){
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

        for (let day = 1; day <= daysInMonth; day++) {
          const dayString = `${wantedDate}-${day.toString().padStart(2, '0')}`;
          const countForDay = tasks.filter(task => task.created_at.startsWith(dayString)).length;

          data[day - 1] = countForDay;
        }

        data.forEach(data => {
          this.totalMonthlyData[metric] += data;
        });
      } else {
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
      }

      if(this.selectedHouseNumber == 'All'){
        if(isOccupancyMetric){
          let dailyPercentages = 0;

          data.forEach(data => {
            dailyPercentages += data;
          });

          this.totalMonthlyData[metric] = Number(((dailyPercentages / daysInMonth)).toFixed(2));
        } else if(isTaskMetric){
          data.forEach(data => {
            this.totalMonthlyData[metric] += data;
          });
        } else {
          const houseAvailabilitiesForSelectedMonth = this.houseAvailabilities
            .filter(ha => 
              (ha.house_availability_start_date.startsWith(wantedDate) || ha.house_availability_end_date.startsWith(wantedDate))
            );
  
          houseAvailabilitiesForSelectedMonth.forEach((ha: any) => {
            this.totalMonthlyData[metric] += ha[metric];
          });
        }
      } else {
        if(isOccupancyMetric){
          let daysOccupied = 0;

          data.forEach(data => {
            daysOccupied += data ? 1 : 0;
          });

          this.totalMonthlyData[metric] = Number(((daysOccupied / daysInMonth) * 100).toFixed(2));
        } else if(isTaskMetric){
          data.forEach(data => {
            this.totalMonthlyData[metric] += data;
          });
        } else {
          const houseAvailabilitiesForSelectedMonth = this.houseAvailabilities
            .filter(ha => 
              ha.house_id == this.selectedHouseId && 
              (ha.house_availability_start_date.startsWith(wantedDate) || ha.house_availability_end_date.startsWith(wantedDate))
            );

          houseAvailabilitiesForSelectedMonth.forEach((ha: any) => {
            this.totalMonthlyData[metric] += ha[metric];
          });
        }
      }

      this.dataToDisplay[metric] = data;
    });

    this.initChart();
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
      } else if(isTaskMetric){
        metricData = this.calculateTaskMetric(metric, year, monthlyData);
      } else {
        metricData = this.calculateAvailabilityMetric(metric, year, monthlyData);
      }

      if(!isOccupancyMetric){
        metricData.forEach((data: any) => {
          this.totalMonthlyData[metric] += data;
        });
      } else {
        let totalData = 0;

        for (let i = 0; i < monthlyData.length - 1; i++){
          totalData += metricData[i]
        }
        
        //preskoci zadnji mjesec jer nije u sezoni, u mjesecima je jer se samo displaya na grafu
        const monthsCount = this.timePeriod == 'season' ? monthlyData.length - 1 : monthlyData.length;

        this.totalMonthlyData[metric] = Number((totalData / monthsCount).toFixed(2));
      }

      this.dataToDisplay[metric] = metricData;
    });

    this.initChart();
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

  toggleOccupancyChartOnHomeScreen(state: boolean){
    this.layoutService.$isOccupancyChartVisible.next(state);
  }

  initChart() {
    if (isPlatformBrowser(this.platformId)) {
      const documentStyle = getComputedStyle(document.documentElement);
      const textColor = documentStyle.getPropertyValue('--p-text-color');
      const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
      const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

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

        return {
          label: this.metrics.find((m: any) => m.value == metric)?.name,
          data: this.dataToDisplay[metric],
          fill: true,
          tension: 0,
          borderColor: documentStyle.getPropertyValue(colorVar),
          backgroundColor: documentStyle.getPropertyValue(colorVar) + '33'
        };
      });

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

      this.cd.markForCheck();
    }
  }
}
