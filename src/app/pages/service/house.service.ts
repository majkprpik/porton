import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { DataService, House, HouseAvailability, HouseAvailabilityType, HouseStatus, HouseStatusTask } from './data.service';
import { TaskService } from './task.service';

@Injectable({
  providedIn: 'root'
})
export class HouseService {
  houseAvailabilityTypes: HouseAvailabilityType[] = [];
  houseAvailabilities: HouseAvailability[] = [];
  houses: House[] = [];
  houseStatuses = signal<HouseStatus[]>([]);

  constructor(
    private supabase: SupabaseService,
    private dataService: DataService,
    private taskService: TaskService,
  ) {

    this.dataService.houseAvailabilityTypes$.subscribe(ha => {
      this.houseAvailabilityTypes = ha;
    });

    this.dataService.houseAvailabilities$.subscribe(ha => {
      this.houseAvailabilities = ha;
    });

    this.dataService.houses$.subscribe(houses => {
      this.houses = houses;
    })

    this.dataService.houseStatuses$.subscribe((statuses) => {
        this.houseStatuses.set(statuses);
    });
  }

  isHouseOccupied(houseId: number){
    let houseAvailability = this.getTodaysHouseAvailabilityForHouse(houseId);

    if(houseAvailability.length == 1){
      return !houseAvailability[0].has_departed;
    } else if(houseAvailability.length == 2){
      if(houseAvailability[0].has_departed && houseAvailability[1].has_arrived){
        return true;
      } else if(houseAvailability[0].has_departed && !houseAvailability[1].has_arrived){
        return false;
      } else if(!houseAvailability[0].has_departed && !houseAvailability[1].has_arrived){
        return true;
      } else if(!houseAvailability[0].has_departed && houseAvailability[1].has_arrived){
        return true;
      }
    }

    return false;
  }

  hasCompletedTasks(houseId: number): boolean {
    const status = this.houseStatuses().find((s) => s.house_id === houseId);
    if (!status?.housetasks?.length) return false;
    let hasCompletedTasks = status.housetasks.some((task) => this.taskService.isTaskCompleted(task));
    
    return hasCompletedTasks;
  }

  hasInProgressTasks(houseId: number): boolean {
    const status = this.houseStatuses().find((s) => s.house_id === houseId);
    if (!status?.housetasks?.length) return false;
    let hasTasksInProgress = status.housetasks.some((task) => this.taskService.isTaskInProgress(task)); 

    return hasTasksInProgress;
  }

  hasAnyTasks(houseId: number): boolean {
    const status = this.houseStatuses().find((s) => s.house_id === houseId);

    return !!status?.housetasks?.length;
  }

  getHouseTasks(houseId: number): HouseStatusTask[] {
    const status = this.houseStatuses().find((s) => s.house_id === houseId);

    return status?.housetasks || [];
  }

  getHouseNumber(houseId: number): string {
    const house = this.houses.find(h => h.house_id === houseId);
    return house ? house.house_number.toString() : '?';
  }

  getTodaysHouseAvailabilityForHouse(houseId: number){
    const today = new Date(); 
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1); // Set yesterday's date

    // Manually format both today's and yesterday's date to YYYY-MM-DD
    const yesterdayString = yesterday.getFullYear() + '-' + 
                            String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + 
                            String(yesterday.getDate()).padStart(2, '0');

    const houseAvailabilties = this.houseAvailabilities?.filter(item => {
      if(item.house_id == houseId){
        const startDate = new Date(item.house_availability_start_date);
        const endDate = new Date(item.house_availability_end_date);
    
        // Format endDate to YYYY-MM-DD (local time)
        const endDateString = endDate.getFullYear() + '-' + 
                              String(endDate.getMonth() + 1).padStart(2, '0') + '-' + 
                              String(endDate.getDate()).padStart(2, '0');
    
        // Check if the availability end date is yesterday
        return (today >= startDate && today <= endDate) || yesterdayString === endDateString;
      } 
    
      return false;
    });

    return houseAvailabilties.sort((a, b) => 
      new Date(a.house_availability_start_date).getTime() - new Date(b.house_availability_start_date).getTime()
    );
  }

  async setHouseAvailabilityDeparted(houseAvailabilityId: number, state: boolean){
    let houseAvailability;

    if(state){
      houseAvailability = this.houseAvailabilityTypes.find(ha => ha.house_availability_type_name == 'Free');
    } else{
      houseAvailability = this.houseAvailabilityTypes.find(ha => ha.house_availability_type_name == 'Occupied');
    }

    if(!houseAvailability)
      return false;

    try {
      const { data, error } = await this.supabase.getClient()
        .schema('porton')
        .from('house_availabilities')
        .update({ 
          has_departed: state,
          house_availability_type_id: houseAvailability.house_availability_type_id
         })
        .eq('house_availability_id', houseAvailabilityId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error updating house availability:', error);
      return false;
    }
  }

  async setHouseAvailabilityArrived(houseAvailabilityId: number, state: boolean){
    let houseAvailability; 

    if(state){
      houseAvailability = this.houseAvailabilityTypes.find(ha => ha.house_availability_type_name == 'Occupied');
    } else{
      houseAvailability = this.houseAvailabilityTypes.find(ha => ha.house_availability_type_name == 'Free');
    }
    
    if(!houseAvailability)
      return false;

    try {
      const { data, error } = await this.supabase.getClient()
        .schema('porton')
        .from('house_availabilities')
        .update({ 
          has_arrived: state,
          house_availability_type_id: houseAvailability.house_availability_type_id
         })
        .eq('house_availability_id', houseAvailabilityId);

      if (error) throw error;

      return true;
    }
    catch (error) {
      console.error('Error updating house availability:', error);
      return false;
    }
  }

  /**
   * Updates arrival_time or departure_time for a house availability
   * @param houseAvailabilityId The ID of the house availability to update
   * @param timeField The field to update ('arrival_time' or 'departure_time')
   * @param timeValue The time value in 'HH:MM' format
   * @returns Promise that resolves to true when successful, false otherwise
   */
  async updateHouseAvailabilityTime(houseAvailabilityId: number, timeField: 'arrival_time' | 'departure_time', timeValue: string): Promise<boolean> {
    try {
      if (!houseAvailabilityId || !timeField || !timeValue) {
        console.error('Missing required parameters for updateHouseAvailabilityTime');
        return false;
      }

      const updateData: any = {};
      updateData[timeField] = timeValue;

      const { data, error } = await this.supabase.getClient()
        .schema('porton')
        .from('house_availabilities')
        .update(updateData)
        .eq('house_availability_id', houseAvailabilityId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error(`Error updating ${timeField} for house availability ${houseAvailabilityId}:`, error);
      return false;
    }
  }
}
