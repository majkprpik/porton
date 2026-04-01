
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ChartComponent } from './chart.component';
import { StatisticsService } from '../../core/services/statistics.service';
import { Chart } from '../../core/models/data.models';

@Component({
  selector: 'app-statistics',
  imports: [
    ChartComponent,
  ],
  template: `
    <div class="statistics-container">
      <div class="chart-row">
        @for(chart of charts; track trackByChartId($index, chart)){
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
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        width: 100%;

        .chart-container {
          min-height: 600px;
          background: var(--glass-bg);
          backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
          -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
          border: 1px solid var(--glass-border);
          box-shadow: var(--glass-shadow);
          border-radius: 10px;
          padding: 20px;
          box-sizing: border-box;

          &:last-child:nth-child(odd) {
            grid-column: 1;
          }
        }
      }
    }

    @media (max-width: 991px) {
      .statistics-container {
        overflow-x: hidden;
        max-width: 100%;
      }

      .statistics-container .chart-row {
        grid-template-columns: 1fr;
      }

      .statistics-container .chart-container {
        padding: 8px !important;
        min-height: unset !important;
        overflow: hidden;
        max-width: 100%;
        box-sizing: border-box;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatisticsComponent {
  
  get charts(): Chart[] {
    return this.statisticsService.charts;
  }

  constructor(private statisticsService: StatisticsService) {}

  trackByChartId(index: number, chart: Chart): string {
    return chart.dataType;
  }
}
