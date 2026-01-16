
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
          min-height: 600px;
          background: var(--glass-bg);
          backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
          -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
          border: 1px solid var(--glass-border);
          box-shadow: var(--glass-shadow);
          border-radius: 10px;
          padding: 20px;
          box-sizing: border-box;
        }
      }
    }

    @media (max-width: 768px) {
      .statistics-container .chart-row .chart-container {
        flex: 1 1 100%;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatisticsComponent {

  constructor(public statisticsService: StatisticsService) {}
}
