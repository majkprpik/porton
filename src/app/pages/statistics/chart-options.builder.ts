import { CHART_COLORS, ChartDataConfig, ChartDataset, Metric } from './chart.constants';
import { ChartType } from '../../core/models/data.models';

export interface ChartColors {
  textColor: string;
  textColorSecondary: string;
  surfaceBorder: string;
}

export interface ChartBuildResult {
  data: any;
  options: any;
}

export class ChartOptionsBuilder {
  private documentStyle: CSSStyleDeclaration;

  constructor() {
    this.documentStyle = getComputedStyle(document.documentElement);
  }

  getColors(isDarkMode: boolean): ChartColors {
    return {
      textColor: isDarkMode ? 'white' : 'black',
      textColorSecondary: isDarkMode ? 'white' : 'gray',
      surfaceBorder: isDarkMode ? 'gray' : 'lightgray',
    };
  }

  getColorValue(index: number): string {
    const colorVar = CHART_COLORS[index % CHART_COLORS.length];
    return this.documentStyle.getPropertyValue(colorVar);
  }

  buildPieChart(
    dataToDisplay: { [metric: string]: number[] },
    totalMonthlyData: { [metric: string]: number },
    metrics: Metric[],
    isDarkMode: boolean
  ): ChartBuildResult {
    const colors = this.getColors(isDarkMode);

    const pieData: number[] = [];
    const pieColors: string[] = [];
    const pieLabels: string[] = [];

    Object.keys(dataToDisplay).forEach((metric, index) => {
      pieColors.push(this.getColorValue(index));
      pieLabels.push(this.getMetricName(metric, metrics));
      pieData.push(totalMonthlyData[metric]);
    });

    const data = {
      labels: pieLabels,
      datasets: [{
        data: pieData,
        backgroundColor: pieColors,
        borderColor: 'white',
        borderWidth: 1
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: colors.textColor
          }
        }
      }
    };

    return { data, options };
  }

  buildDatasets(
    dataToDisplay: { [metric: string]: number[] },
    metrics: Metric[],
    chartType: ChartType
  ): ChartDataset[] {
    return Object.keys(dataToDisplay).map((metric, index) => {
      const colorValue = this.getColorValue(index);

      if (chartType === 'line') {
        return {
          label: this.getMetricName(metric, metrics),
          data: dataToDisplay[metric],
          fill: true,
          tension: 0,
          borderColor: colorValue,
          backgroundColor: colorValue + '33',
        };
      } else {
        return {
          label: this.getMetricName(metric, metrics),
          data: dataToDisplay[metric],
          fill: true,
          tension: 0,
          borderColor: 'white',
          backgroundColor: colorValue,
          borderWidth: 1,
        };
      }
    });
  }

  buildBarOrLineChart(
    dataToDisplay: { [metric: string]: number[] },
    xLabels: string[],
    metrics: Metric[],
    chartType: ChartType,
    isDarkMode: boolean,
    isStaffChart: boolean = false,
    profileTaskMap?: { [profileName: string]: number }
  ): ChartBuildResult {
    const colors = this.getColors(isDarkMode);
    const datasets = this.buildDatasets(dataToDisplay, metrics, chartType);

    const allValues = Object.values(dataToDisplay).flat();
    const maxDataValue = Math.max(...allValues);
    const hasOccupancy = Object.keys(dataToDisplay).includes('occupancy');

    let finalLabels = xLabels;
    let finalDatasets = datasets;

    // Sort by value for staff charts
    if (isStaffChart && profileTaskMap) {
      const combined = Object.entries(profileTaskMap).map(([label, value]) => ({
        label,
        value
      }));

      combined.sort((a, b) => b.value - a.value);

      finalLabels = combined.map(item => item.label);
      const sortedValues = combined.map(item => item.value);

      if (finalDatasets[0]) {
        finalDatasets[0].data = sortedValues;
      }
    }

    const chartConfig: ChartDataConfig = {
      textColor: colors.textColor,
      textColorSecondary: colors.textColorSecondary,
      surfaceBorder: colors.surfaceBorder,
      maxDataValue,
      hasOccupancy,
      datasets: finalDatasets,
    };

    const data = {
      labels: finalLabels,
      datasets: chartConfig.datasets
    };

    const options = this.buildChartOptions(chartConfig, finalLabels, isStaffChart);

    return { data, options };
  }

  private buildChartOptions(
    chartConfig: ChartDataConfig,
    xLabels: string[],
    isHorizontalBar: boolean
  ): any {
    return {
      maintainAspectRatio: false,
      aspectRatio: 0.6,
      ...(isHorizontalBar && { indexAxis: 'y' }),
      plugins: {
        legend: {
          labels: {
            color: chartConfig.textColor
          }
        }
      },
      scales: {
        x: isHorizontalBar ? {
          ticks: {
            color: chartConfig.textColor,
            callback: (value: any) => Number.isInteger(value) ? value : null
          },
          grid: {
            color: chartConfig.surfaceBorder
          }
        } : {
          ticks: {
            color: chartConfig.textColor,
            autoSkip: true,
            maxTicksLimit: 16,
            callback: (_value: any, index: number) => xLabels[index]
          },
          grid: {
            color: chartConfig.surfaceBorder
          }
        },
        y: isHorizontalBar ? {
          ticks: {
            color: chartConfig.textColor,
            autoSkip: false,
            callback: (_value: any, index: number) => xLabels[index]
          },
          grid: {
            color: chartConfig.surfaceBorder
          }
        } : {
          min: 0,
          max: chartConfig.hasOccupancy ? Math.max(100, chartConfig.maxDataValue) : undefined,
          ticks: {
            color: chartConfig.textColor,
            callback: (value: any) => Number.isInteger(value) ? value : null
          },
          grid: {
            color: chartConfig.surfaceBorder
          }
        }
      }
    };
  }

  private getMetricName(metricValue: string, metrics: Metric[]): string {
    const metricObj = metrics.find((m: Metric) => m.value === metricValue);
    return metricObj ? metricObj.name : metricValue;
  }
}
