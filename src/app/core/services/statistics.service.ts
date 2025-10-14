import { Injectable } from '@angular/core';
import { Chart, ChartType, PinnedChart } from '../models/data.models';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { DataService } from './data.service';
import { nonNull } from '../../shared/rxjs-operators/non-null';

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

  generalMetricsChartTypes: ChartType[] = ['bar', 'line', 'pie', 'doughnut'];
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

  pinnedCharts: PinnedChart[] = [];

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService,
    private dataService: DataService,
  ) {
    this.dataService.pinnedCharts$
      .pipe(nonNull())
      .subscribe(pinnedCharts => {
        this.pinnedCharts = pinnedCharts;
      });
  }

  async createPinnedChart(chartName: string){
    try {
      const { data: createdPinnedChart, error: createPinnedChartError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('pinned_charts')
        .insert({
          profile_id: this.authService.getStoredUserId(),
          chart_name: chartName,
        })
        .select()
        .single();

      if(createPinnedChartError) throw createPinnedChartError;

      if(createdPinnedChart && !this.pinnedCharts.find(s => s.id == createdPinnedChart.id)) {
        this.dataService.setPinnedCharts([...this.pinnedCharts, createdPinnedChart]);
      }

      return createdPinnedChart;
    } catch(error){
      console.error("Error creating pinned chart: ", error);
      return null;
    }
  }

  async deletePinnedChart(chartName: string){
    try{
      const { data: deletedPinnedChart, error: deletePinnedChartError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('pinned_charts')
        .delete()
        .eq('profile_id', this.authService.getStoredUserId())
        .eq('chart_name', chartName)
        .select()
        .single();

      if(deletePinnedChartError) throw deletePinnedChartError;

      if(deletedPinnedChart && deletedPinnedChart.id) {
        const filteredPinnedCharts = this.pinnedCharts.filter(s => s.id != deletedPinnedChart.id);
        this.dataService.setPinnedCharts(filteredPinnedCharts);
      }

      return deletedPinnedChart;
    } catch (error){
      console.error('Error deleting seasons:', error);
      return null;
    }
  }

  isChartPinnedToHome(chartName: string){
    return this.pinnedCharts.find(pc => pc.chart_name == chartName && pc.profile_id == this.authService.getStoredUserId());
  }
}
