import { Injectable } from '@angular/core';
import { House, HouseAvailability, Profile, Task } from '../../core/models/data.models';
import { TaskService } from '../../core/services/task.service';
import {
  MONTHS,
  SEASON_MONTHS,
  EXCLUDED_HOUSE_NAMES,
  ALL_HOUSES,
  PERIOD_YEAR,
  PERIOD_SEASON,
  DATA_TYPE_STAFF,
} from './chart.constants';

export interface MetricCalculationContext {
  tasks: Task[];
  profiles: Profile[];
  houses: House[];
  houseAvailabilities: HouseAvailability[];
  selectedHouseNumber: string;
  selectedHouseId: number;
  timePeriod: string;
  dataType: string;
}

export interface MonthlyDataResult {
  data: number[];
  total: number;
  profileTaskMap?: { [profileName: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class ChartDataService {

  constructor(private taskService: TaskService) {}

  getYearMonthString(year: number, month: number): string {
    return `${year}-${(month + 1).toString().padStart(2, '0')}`;
  }

  getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  sumArray(arr: number[]): number {
    return arr.reduce((sum, val) => sum + val, 0);
  }

  getMonthIndex(index: number, timePeriod: string): number {
    if (timePeriod === PERIOD_SEASON) {
      const monthName = SEASON_MONTHS[index];
      return MONTHS.indexOf(monthName);
    }
    return index;
  }

  getValidHouseCount(houses: House[]): number {
    return houses.filter(house =>
      !EXCLUDED_HOUSE_NAMES.includes(house.house_name as typeof EXCLUDED_HOUSE_NAMES[number])
    ).length;
  }

  getFilteredHouseAvailabilities(
    houseAvailabilities: HouseAvailability[],
    selectedHouseNumber: string,
    selectedHouseId: number
  ): HouseAvailability[] {
    if (selectedHouseNumber === ALL_HOUSES) {
      return houseAvailabilities;
    }
    return houseAvailabilities.filter(ha => ha.house_id === selectedHouseId);
  }

  initMonthlyData(timePeriod: string, dataType: string, profilesCount: number): number[] {
    if (timePeriod === PERIOD_YEAR) {
      return Array(MONTHS.length).fill(0);
    } else if (timePeriod === PERIOD_SEASON) {
      if (dataType === DATA_TYPE_STAFF) {
        return Array(profilesCount).fill(0);
      } else {
        return Array(SEASON_MONTHS.length).fill(0);
      }
    }
    return [];
  }

  calculateOccupancyForDay(
    currentDay: Date,
    availabilities: HouseAvailability[],
    houseCount: number,
    selectedHouseNumber: string
  ): number {
    if (selectedHouseNumber === ALL_HOUSES) {
      const houseAvailabilitiesForToday = availabilities.filter(availability => {
        const start = new Date(availability.house_availability_start_date);
        const end = new Date(availability.house_availability_end_date);
        return currentDay >= start && currentDay <= end;
      });
      return (houseAvailabilitiesForToday.length / houseCount) * 100;
    } else {
      const isOccupied = availabilities.some(availability => {
        const start = new Date(availability.house_availability_start_date);
        const end = new Date(availability.house_availability_end_date);
        return currentDay >= start && currentDay <= end;
      });
      return isOccupied ? 100 : 0;
    }
  }

  getOccupancyDataForMonth(
    year: number,
    month: number,
    ctx: MetricCalculationContext
  ): number[] {
    const monthIndex = this.getMonthIndex(month, ctx.timePeriod);
    const daysInMonth = this.getDaysInMonth(year, monthIndex);
    const data = Array(daysInMonth).fill(0);
    const houseCount = this.getValidHouseCount(ctx.houses);
    const filteredAvailabilities = this.getFilteredHouseAvailabilities(
      ctx.houseAvailabilities,
      ctx.selectedHouseNumber,
      ctx.selectedHouseId
    );

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = new Date(year, monthIndex, day);
      data[day - 1] = this.calculateOccupancyForDay(
        currentDay,
        filteredAvailabilities,
        houseCount,
        ctx.selectedHouseNumber
      );
    }

    return data;
  }

  calculateOccupancyMetric(
    year: number,
    monthlyData: number[],
    ctx: MetricCalculationContext
  ): number[] {
    const monthCount = ctx.timePeriod === PERIOD_SEASON ? SEASON_MONTHS.length : MONTHS.length;

    for (let month = 0; month < monthCount; month++) {
      const monthIndex = this.getMonthIndex(month, ctx.timePeriod);
      const daysInMonth = this.getDaysInMonth(year, monthIndex);
      const data = this.getOccupancyDataForMonth(year, month, ctx);

      let occupancyPercent: number;
      if (ctx.selectedHouseNumber === ALL_HOUSES) {
        const monthlyPercentages = this.sumArray(data);
        occupancyPercent = Number((monthlyPercentages / daysInMonth).toFixed(2));
      } else {
        const daysOccupied = data.reduce((count, val) => count + (val ? 1 : 0), 0);
        occupancyPercent = Number(((daysOccupied / daysInMonth) * 100).toFixed(2));
      }

      monthlyData[month] = occupancyPercent;
    }

    return monthlyData;
  }

  filterTasksForMetric(
    metric: string,
    year: number,
    month: number,
    ctx: MetricCalculationContext
  ): Task[] {
    const wantedDate = this.getYearMonthString(year, month);
    let tasks: Task[];

    if (metric === 'totalCompletedTasks') {
      if (ctx.selectedHouseNumber === ALL_HOUSES) {
        tasks = ctx.tasks.filter(task =>
          task.completed_by &&
          task.end_time?.split('T')[0].substring(0, 7) === wantedDate
        );
      } else {
        tasks = ctx.tasks.filter(task =>
          task.completed_by &&
          task.house_id === ctx.selectedHouseId &&
          task.end_time?.split('T')[0].substring(0, 7) === wantedDate
        );
      }
    } else {
      if (ctx.selectedHouseNumber === ALL_HOUSES) {
        tasks = ctx.tasks.filter(task =>
          task.created_at.startsWith(wantedDate)
        );
      } else {
        tasks = ctx.tasks.filter(task =>
          task.house_id === ctx.selectedHouseId &&
          task.created_at.startsWith(wantedDate)
        );
      }

      if (metric.includes('Total') || metric.includes('total')) return tasks;

      if (metric.includes('Repair')) {
        tasks = tasks.filter(task => this.taskService.isRepairTask(task));
      } else if (metric.includes('House')) {
        tasks = tasks.filter(task => this.taskService.isHouseCleaningTask(task));
      } else if (metric.includes('Deck')) {
        tasks = tasks.filter(task => this.taskService.isDeckCleaningTask(task));
      } else if (metric.includes('Unscheduled')) {
        tasks = tasks.filter(task => task.is_unscheduled);
      } else if (metric.includes('Towel')) {
        tasks = tasks.filter(task => this.taskService.isTowelChangeTask(task));
      } else if (metric.includes('Sheet')) {
        tasks = tasks.filter(task => this.taskService.isSheetChangeTask(task));
      }
    }

    return tasks;
  }

  getTaskDataForMonth(
    metric: string,
    year: number,
    month: number,
    ctx: MetricCalculationContext
  ): MonthlyDataResult {
    const tasks = this.filterTasksForMetric(metric, year, month, ctx);
    const wantedDate = this.getYearMonthString(year, month);
    let data: number[];
    let profileTaskMap: { [profileName: string]: number } = {};

    if (ctx.dataType === DATA_TYPE_STAFF) {
      const numberOfProfiles = ctx.profiles.length;
      data = Array(numberOfProfiles).fill(0);

      for (let profileIndex = 0; profileIndex < numberOfProfiles; profileIndex++) {
        const profile = ctx.profiles[profileIndex];
        let completedTasksByProfileCount: number;

        if (ctx.selectedHouseNumber === ALL_HOUSES) {
          completedTasksByProfileCount = ctx.tasks.filter(t =>
            t.completed_by === profile.id &&
            t.end_time?.split('T')[0].substring(0, 7) === wantedDate
          ).length;
        } else {
          const house = ctx.houses.find(h => h.house_name === ctx.selectedHouseNumber);
          completedTasksByProfileCount = ctx.tasks.filter(t =>
            t.completed_by === profile.id &&
            t.house_id === house?.house_id &&
            t.end_time?.split('T')[0].substring(0, 7) === wantedDate
          ).length;
        }

        data[profileIndex] = completedTasksByProfileCount;
        profileTaskMap[profile.first_name!] = completedTasksByProfileCount;
      }
    } else {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      data = Array(daysInMonth).fill(0);

      for (let day = 1; day <= daysInMonth; day++) {
        const dayString = `${wantedDate}-${day.toString().padStart(2, '0')}`;
        const countForDay = tasks.filter(task => task.created_at.startsWith(dayString)).length;
        data[day - 1] = countForDay;
      }
    }

    return {
      data,
      total: this.sumArray(data),
      profileTaskMap
    };
  }

  calculateTaskMetric(
    metric: string,
    year: number,
    monthlyData: number[],
    ctx: MetricCalculationContext
  ): { data: number[]; profileTaskMap: { [key: string]: number } } {
    const monthCount = ctx.timePeriod === PERIOD_SEASON ? SEASON_MONTHS.length : MONTHS.length;
    let profileTaskMap: { [key: string]: number } = {};

    if (ctx.timePeriod === PERIOD_SEASON && metric === 'totalCompletedTasks') {
      const completedTasksInSeason: Task[] = [];

      for (let month = 0; month < monthCount; month++) {
        const tasks = this.filterTasksForMetric(metric, year, this.getMonthIndex(month, ctx.timePeriod), ctx);
        completedTasksInSeason.push(...tasks);
      }

      ctx.profiles.forEach((profile, profileIndex) => {
        const completedTasksForProfile = completedTasksInSeason.filter(t => t.completed_by === profile.id);
        monthlyData[profileIndex] += completedTasksForProfile.length;
        profileTaskMap[profile.first_name!] = completedTasksForProfile.length;
      });
    } else {
      for (let month = 0; month < monthCount; month++) {
        const monthIndex = ctx.timePeriod === PERIOD_SEASON ? this.getMonthIndex(month, ctx.timePeriod) : month;
        const tasks = this.filterTasksForMetric(metric, year, monthIndex, ctx);
        monthlyData[month] += tasks.length;
      }
    }

    return { data: monthlyData, profileTaskMap };
  }

  getAvailabilityDataForMonth(
    metric: string,
    year: number,
    month: number,
    ctx: MetricCalculationContext
  ): number[] {
    const daysInMonth = this.getDaysInMonth(year, month);
    const data = Array(daysInMonth).fill(0);
    const filteredAvailabilities = this.getFilteredHouseAvailabilities(
      ctx.houseAvailabilities,
      ctx.selectedHouseNumber,
      ctx.selectedHouseId
    );

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = new Date(year, month, day);

      filteredAvailabilities.forEach((availability: any) => {
        const start = new Date(availability.house_availability_start_date);
        const end = new Date(availability.house_availability_end_date);

        if (currentDay >= start && currentDay <= end) {
          data[day - 1] += availability[metric] || 0;
        }
      });
    }

    return data;
  }

  calculateAvailabilityMetric(
    metric: string,
    year: number,
    monthlyData: number[],
    ctx: MetricCalculationContext
  ): number[] {
    const filteredAvailabilities = this.getFilteredHouseAvailabilities(
      ctx.houseAvailabilities,
      ctx.selectedHouseNumber,
      ctx.selectedHouseId
    );

    for (let month = 0; month < MONTHS.length; month++) {
      const wantedDate = this.getYearMonthString(year, month);

      filteredAvailabilities.forEach((availability: any) => {
        if (
          availability.house_availability_start_date.startsWith(wantedDate) ||
          availability.house_availability_end_date.startsWith(wantedDate)
        ) {
          monthlyData[month] += availability[metric] || 0;
        }
      });
    }

    return monthlyData;
  }

  calculateAvailabilityTotal(
    metric: string,
    year: number,
    month: number,
    ctx: MetricCalculationContext
  ): number {
    const wantedDate = this.getYearMonthString(year, month);
    const filteredAvailabilities = this.getFilteredHouseAvailabilities(
      ctx.houseAvailabilities,
      ctx.selectedHouseNumber,
      ctx.selectedHouseId
    ).filter(ha =>
      ha.house_availability_start_date.startsWith(wantedDate) ||
      ha.house_availability_end_date.startsWith(wantedDate)
    );

    return filteredAvailabilities.reduce(
      (sum, ha: any) => sum + (ha[metric] || 0), 0
    );
  }
}
