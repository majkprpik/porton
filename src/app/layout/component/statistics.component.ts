import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, effect, inject, PLATFORM_ID } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { DataService, House, HouseAvailability, Task } from '../../pages/service/data.service';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { TaskService } from '../../pages/service/task.service';
import { MultiSelect } from 'primeng/multiselect';

@Component({
  selector: 'app-statistics',
  imports: [
    ChartModule,
    SelectModule,
    FormsModule,
    TranslateModule,
    ButtonModule,
    MultiSelect,
    FormsModule
  ],
  template: `
    <div class="statistics-container">
      <div class="buttons">
        <p-button
          [label]="'BUTTONS.YEAR' | translate" 
          [severity]="monthOrYearSelected == 'year' ? 'primary': 'secondary'"
          (click)="displayMonths()"
        />

        <p-button
          [label]="'BUTTONS.MONTH' | translate"
          [severity]="monthOrYearSelected == 'month' ? 'primary': 'secondary'"
          (click)="displayDays()"
        />  
      </div>

      <div class="fields">
        @if(monthOrYearSelected == 'month'){
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
      </div>
      <div class="card">
        <p-chart type="line" [data]="data" [options]="options" class="h-[30rem]" />
      </div>

      @if(selectedMetrics.length && selectedHouseNumber){
        <div class="total-monthly-data">
          @for(metric of selectedMetrics; track metric){
            <span>
              {{getMetricName(metric)}}: {{totalMonthlyData[metric]}}
            </span>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .statistics-container{
      height: 90vh;
      background-color: white;
      border-radius: 10px;
      box-sizing: border-box;
      padding: 10px;

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
export class StatisticsComponent {
  data: any;
  options: any;
  platformId = inject(PLATFORM_ID);
  xLabels: string[] = [];
  houseAvailabilities: HouseAvailability[] = [];
  houseAvailabilitiesForSelectedMonth: HouseAvailability[] = [];
  selectedMonth: Date = new Date();
  houses: House[] = [];
  houseNumbers: string[] = ['All'];
  selectedHouseNumber: string = '';
  selectedHouseId: number = -1;
  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  month: string = '';
  metrics = [
    { name: 'Adults', value: 'adults' },
    { name: 'Children', value: 'babies' },
    { name: 'Pets', value: 'dogs_d' },
    { name: 'Baby Cribs', value: 'cribs' },
    { name: 'Repair Tasks', value: 'Repair tasks' },
    { name: 'House Cleaning Tasks', value: 'House cleaning tasks' },
    { name: 'Deck Cleaning Tasks', value: 'Deck cleaning tasks' },
    { name: 'Sheet Change Tasks', value: 'Sheet change tasks' },
    { name: 'Towel Change Tasks', value: 'Towel change tasks' },
    { name: 'Unscheduled Tasks', value: 'Unscheduled tasks' },
    { name: 'Total Tasks', value: 'Total tasks' },
  ];
  selectedMetric: string = '';
  monthOrYearSelected: string = 'month';
  tasks: Task[] = [];
  selectedMetrics: string[] = [];
  totalMonthlyData: { [metric: string]: number } = {};
  dataToDisplay: { [metric: string]: number[] } = {};

  constructor(
    private cd: ChangeDetectorRef,
    private dataService: DataService,
    private taskService: TaskService,
  ) {

  }

  ngOnInit(){
    this.dataService.houseAvailabilities$.subscribe(houseAvailabilities => {
      this.houseAvailabilities = houseAvailabilities;

      this.loadAvailabilities();
    });

    this.dataService.houses$.subscribe(houses => {
      this.houses = houses;

      this.houses.forEach(house => {
        if(!this.houseNumbers.includes(house.house_number.toString())){
          this.houseNumbers.push(house.house_number.toString());
        }
      })

      this.houseNumbers.sort((a, b) => parseInt(a) - parseInt(b));
    });

    this.dataService.tasks$.subscribe(tasks => {
      this.tasks = tasks;
    });

    this.displayDays();
  }

  getMetricName(name: string){
    const metricObj = this.metrics.find(m => m.value == name);
    return metricObj ? metricObj.name : name;
  }

  onHouseNumberChange(){
    const house = this.houses.find(house => house.house_name == this.selectedHouseNumber);

    if(house){
      this.selectedHouseId = house?.house_id;
    }

    if(this.monthOrYearSelected == 'month'){
      this.generateDataset();
    } else if (this.monthOrYearSelected == 'year'){
      this.generateYearlyDataset();
    }
  }

  loadAvailabilities(){
    const selectedYear = this.selectedMonth.getFullYear();
    const selectedMonthIndex = this.selectedMonth.getMonth(); // 0-based

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
    const monthIndex = this.months.indexOf(this.month);;
    const selectedMonth = new Date(new Date().getFullYear(), monthIndex, 1);

    this.selectedMonth = selectedMonth;
    this.displayDays();
  }

  onMetricsSelect(){
    if(this.monthOrYearSelected == 'month'){
      this.generateDataset();
    } else if(this.monthOrYearSelected == 'year'){
      this.generateYearlyDataset();
    }
  }

  displayMonths(){
    this.monthOrYearSelected = 'year';
    this.xLabels = this.months;
    this.generateYearlyDataset();
  }

  displayDays() {
    this.monthOrYearSelected = 'month';
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

  generateYearlyDataset() {
    this.resetTotalMonthlyData();

    const year = new Date().getFullYear(); 
    
    this.selectedMetrics.forEach(metric => {
      this.initEmptyMetrics(metric);

      const monthlyData = Array(this.months.length).fill(0); 
      const isTaskMetric = metric.includes('tasks');

      if(isTaskMetric){
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
      } else {
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
      }

      monthlyData.forEach(data => {
        this.totalMonthlyData[metric] += data;
      });

      this.dataToDisplay[metric] = monthlyData;
    });

    this.xLabels = this.months;
    this.initChart();
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

      if(isTaskMetric){
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
        if(isTaskMetric){
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
        if(isTaskMetric){
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

  initChart() {
    if (isPlatformBrowser(this.platformId)) {
      const documentStyle = getComputedStyle(document.documentElement);
      const textColor = documentStyle.getPropertyValue('--p-text-color');
      const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
      const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

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
          label: this.metrics.find(m => m.value == metric)?.name,
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
