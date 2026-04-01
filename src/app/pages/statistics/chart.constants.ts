export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;

export const SEASON_MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November'] as const;

export const CHART_COLORS = [
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
] as const;

export const EXCLUDED_HOUSE_NAMES = ['Zgrada', 'Parcele'] as const;

export const ALL_HOUSES = 'All';

export const PERIOD_MONTH = 'month';
export const PERIOD_YEAR = 'year';
export const PERIOD_SEASON = 'season';

export const DATA_TYPE_STAFF = 'staff';
export const DATA_TYPE_GENERAL = 'general';
export const DATA_TYPE_OCCUPANCY = 'occupancy';

export interface Metric {
  name: string;
  value: string;
}

export interface ChartDataConfig {
  textColor: string;
  textColorSecondary: string;
  surfaceBorder: string;
  maxDataValue: number;
  hasOccupancy: boolean;
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  fill: boolean;
  tension: number;
  borderColor: string;
  backgroundColor: string;
  borderWidth?: number;
}

export type MonthName = typeof MONTHS[number];
export type SeasonMonthName = typeof SEASON_MONTHS[number];
export type ChartColorVar = typeof CHART_COLORS[number];
