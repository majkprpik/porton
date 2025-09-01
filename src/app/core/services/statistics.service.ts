import { Injectable } from '@angular/core';
import { Chart, ChartType } from '../models/data.models';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
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

  charts: Chart[] = [
    {
      title: 'General statistics',
      dataType: 'general',
      canSelectDiagramType: true,
      periods: this.generalMetricsPeriods,
      metrics: this.generalMetrics,
      metricFields: this.generalMetricsFields,
      isPinnableToHome: true,
      chartTypes: this.generalMetricsChartTypes
    },
    {
      title: 'Occupancy',
      dataType: 'occupancy',
      canSelectDiagramType: false,
      periods: this.occupancyMetricsPeriods,
      metrics: this.occupancyMetrics,
      metricFields: this.occupancyMetricsFields,
      isPinnableToHome: true,
      chartTypes: this.occupancyMetricsChartTypes
    },
    {
      title: 'Staff statistics',
      dataType: 'staff',
      canSelectDiagramType: false,
      periods: this.staffMetricsPeriods,
      metrics: this.staffMetrics,
      metricFields: this.staffMetricsFields,
      isPinnableToHome: true,
      chartTypes: this.staffMetricsChartTypes
    }
  ];

  constructor() { }
}
