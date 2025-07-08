
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartComponent } from './chart.component';

@Component({
  selector: 'app-statistics',
  imports: [
    ChartComponent,
    FormsModule,
  ],
  template: `
    <div class="statistics-container">
      <div class="general-statistics-container">
        <app-chart
          [title]="'General statistics'"
          [dataType]="'general'"
          [metrics]="metrics"
        ></app-chart>
      </div>

      <div class="occupancy-container">
        <app-chart
          [title]="'Occupancy'"
          [dataType]="'occupancy'"
          [metrics]="occupancyMetrics"
        ></app-chart>
      </div>
    </div>
  `,
  styles: `
    .statistics-container{
      height: 1900px;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;

      .general-statistics-container, .occupancy-container{
        height: 900px;
        width: 100%;
        background-color: white;
        border-radius: 10px;
        box-sizing: border-box;
        padding: 20px;
      }
    }
  `
})
export class StatisticsComponent {
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

  occupancyMetrics = [
    { name: 'Occupancy', value: 'occupancy' },
  ]

  constructor(

  ) {

  }
}
