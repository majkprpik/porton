
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartComponent } from './chart.component';

type ChartType = 'bar' | 'line' | 'scatter' | 'bubble' | 'pie' | 'doughnut' | 'polarArea' | 'radar';

@Component({
  selector: 'app-statistics',
  imports: [
    ChartComponent,
    FormsModule,
  ],
  template: `
    <div class="statistics-container">
      <div class="top-statistics">
        <div class="general-statistics-container">
          <app-chart
            [title]="'General statistics'"
            [dataType]="'general'"
            [canSelectDiagramType]="true"
            [periods]="generalMetricsPeriods"
            [metrics]="generalMetrics"
            [metricFields]="generalMetricsFields"
            [isPinnableToHome]="false"
            [chartTypes]="generalMetricsChartTypes"
          ></app-chart>
        </div>
  
        <div class="occupancy-container">
          <app-chart
            [title]="'Occupancy'"
            [dataType]="'occupancy'"
            [canSelectDiagramType]="false"
            [periods]="occupancyMetricsPeriods"
            [metrics]="occupancyMetrics"
            [metricFields]="occupancyMetricsFields"
            [isPinnableToHome]="true"
            [chartTypes]="occupancyMetricsChartTypes"
          ></app-chart>
        </div>
      </div>
      <!-- <div class="middle-statistics">
        <div class="profile-statistics">
          <app-chart
            [title]="'Staff statistics'"
            [dataType]="'staff'"
            [canSelectDiagramType]="false"
            [periods]="staffMetricsPeriods"
            [metrics]="staffMetrics"
            [metricFields]="staffMetricsFields"
            [isPinnableToHome]="true"
            [chartTypes]="staffMetricsChartTypes"
          ></app-chart>
        </div>
        <div class="profile-statistics">

        </div>
      </div> -->
    </div>
  `,
  styles: `
    .statistics-container{
      height: 1900px;
      width: 100%;
      display: flex;
      flex-direction: column;
      background-color: transparent;
      align-items: start;
      gap: 20px;

      .top-statistics, .middle-statistics{
        width: 100%;
        display: flex;
        flex-direction: row;
        gap: 20px;

        .general-statistics-container, .occupancy-container, .profile-statistics{
          height: 900px;
          width: 50%;
          background-color: var(--surface-card);
          border-radius: 10px;
          box-sizing: border-box;
          padding: 20px;
        }
      }

    }
  `
})
export class StatisticsComponent {
  generalMetricsFields = ['month', 'location', 'metrics'];
  occupancyMetricsFields = ['month', 'location'];
  staffMetricsFields = ['month', 'location', 'metrics'];

  generalMetrics = [
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
  ];

  staffMetrics = [
    { name: 'Total completed tasks', value: 'totalCompletedTasks' }
  ]

  generalMetricsPeriods: string[] = ['year', 'month'];
  occupancyMetricsPeriods: string[] = ['season', 'month'];
  staffMetricsPeriods: string[] = ['season', 'month'];

  generalMetricsChartTypes: ChartType[] = ['bar', 'line', 'bubble', 'pie', 'doughnut'];
  occupancyMetricsChartTypes: ChartType[] = ['line'];
  staffMetricsChartTypes: ChartType[] = ['bar'];

  constructor(

  ) {}
}
