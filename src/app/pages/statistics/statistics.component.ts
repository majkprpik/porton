
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartComponent } from './chart.component';
import { StatisticsService } from '../../core/services/statistics.service';

@Component({
  selector: 'app-statistics',
  imports: [
    ChartComponent,
    FormsModule,
  ],
  template: `
    <div class="statistics-container">
      <div class="chart-row">
        @for(chart of statisticsService.charts; track $index){
          <div class="chart-container">
            <app-chart
              [title]="chart.title"
              [dataType]="chart.dataType"
              [canSelectDiagramType]="chart.canSelectDiagramType"
              [periods]="chart.periods"
              [metrics]="chart.metrics"
              [metricFields]="chart.metricFields"
              [isPinnableToHome]="chart.isPinnableToHome"
              [chartTypes]="chart.chartTypes"
            ></app-chart>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .statistics-container{
      width: 100%;
      display: flex;
      flex-direction: column;
      background-color: transparent;
      align-items: start;
      gap: 10px;
      margin-bottom: 20px;

      .chart-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;

        .chart-container {
          flex: 1 1 45%; 
          height: 900px;
          background-color: var(--surface-card);
          border-radius: 10px;
          padding: 20px;
          box-sizing: border-box;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
      }
    }
  `
})
export class StatisticsComponent {

  constructor(public statisticsService: StatisticsService) {}
}
