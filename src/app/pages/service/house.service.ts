import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { DataService, HouseStatus, HouseStatusTask } from './data.service';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HouseService {
  constructor(
    private supabase: SupabaseService,
    private dataService: DataService) {

    }

  async setHouseAvailabilityDeparted(houseAvailabilityId: number, state: boolean){
    let houseAvailability;

    if(state){
      houseAvailability = await this.dataService.getHouseAvailabilityTypeByName('Free');
    } else{
      houseAvailability = await this.dataService.getHouseAvailabilityTypeByName('Occupied');
    }

    if(!houseAvailability)
      return;

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
      
    } catch (error) {
      console.error('Error updating house availability:', error);
    }
  }

  async setHouseAvailabilityArrived(houseAvailabilityId: number, state: boolean){
    let houseAvailability; 

    if(state){
      houseAvailability = await this.dataService.getHouseAvailabilityTypeByName('Occupied');
    } else{
      houseAvailability = await this.dataService.getHouseAvailabilityTypeByName('Free');
    }
    
    if(!houseAvailability)
      return;

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
    }
    catch (error) {
      console.error('Error updating house availability:', error);
    }
  }

  

  // Helper method to check if a house has active tasks
  hasActiveTasks(house: HouseStatus): boolean {
    if (!house.housetasks || house.housetasks.length === 0) {
      return false;
    }
    
    // Check if any task is active (has a startTime but no endTime)
    return house.housetasks.some(task => 
      task.startTime && task.endTime === null
    );
  }

  // Helper method to get pending tasks (tasks that are not completed)
  getPendingTasks(house: HouseStatus): HouseStatusTask[] {
    if (!house.housetasks || house.housetasks.length === 0) {
      return [];
    }
    
    return house.housetasks.filter(task => task.endTime === null);
  }

  async getHouseAvailabilityByHouseId(houseId: number) {
    try {
      const today = new Date(); 
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1); // Set yesterday's date
  
      // Manually format both today's and yesterday's date to YYYY-MM-DD
      const yesterdayString = yesterday.getFullYear() + '-' + 
                              String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + 
                              String(yesterday.getDate()).padStart(2, '0');
  
      const { data, error } = await this.supabase.getClient()
        .schema('porton')
        .from('house_availabilities')
        .select('*')
        .eq('house_id', houseId);
  
      if (error) throw error;
  
      const filteredData = data?.filter(item => {
        const startDate = new Date(item.house_availability_start_date);
        const endDate = new Date(item.house_availability_end_date);
  
        // Format endDate to YYYY-MM-DD (local time)
        const endDateString = endDate.getFullYear() + '-' + 
                              String(endDate.getMonth() + 1).padStart(2, '0') + '-' + 
                              String(endDate.getDate()).padStart(2, '0');
  
        // Check if the availability end date is yesterday
        return (today >= startDate && today <= endDate) || yesterdayString === endDateString;
      });
  
      return filteredData.length ? filteredData : null;
    } catch (error) {
      console.error('Error fetching house availability:', error);
      return null;
    }
  }

  // Mock implementation for current use
  getMockHomesForDate(date: string): Observable<HouseStatus[]> {
    const mockHomes: HouseStatus[] = [
      { house_id: 1, housename: '101', housetypeid: 1, housetypename: 'Standard', availabilityid: 1, availabilityname: 'Free', housetasks: [] },
      { house_id: 2, housename: '102', housetypeid: 2, housetypename: 'Deluxe', availabilityid: 2, availabilityname: 'Occupied', housetasks: [] },
      { house_id: 3, housename: '103', housetypeid: 3, housetypename: 'Premium', availabilityid: 3, availabilityname: 'Urgent', housetasks: [] },
      { house_id: 4, housename: '104', housetypeid: 4, housetypename: 'VIP', availabilityid: 4, availabilityname: 'Occupied', housetasks: [] },
      { house_id: 5, housename: '105', housetypeid: 5, housetypename: 'Executive', availabilityid: 5, availabilityname: 'Pending', housetasks: [] },
      { house_id: 6, housename: '106', housetypeid: 6, housetypename: 'Luxury', availabilityid: 6, availabilityname: 'Ready', housetasks: [] },
      { house_id: 7, housename: '107', housetypeid: 7, housetypename: 'Standard', availabilityid: 7, availabilityname: 'In Progress', housetasks: [] },
      { house_id: 8, housename: '108', housetypeid: 8, housetypename: 'Deluxe', availabilityid: 8, availabilityname: 'Occupied', housetasks: [] },
      { house_id: 9, housename: '109', housetypeid: 9, housetypename: 'Standard', availabilityid: 9, availabilityname: 'Ready', housetasks: [] },
      { house_id: 10, housename: '110', housetypeid: 10, housetypename: 'Deluxe', availabilityid: 10, availabilityname: 'Pending', housetasks: [] },
    ];

    return of(mockHomes);
  }

  /**
   * Locks a house by updating its availability status to "Locked"
   * @param houseId The ID of the house to lock
   * @returns Promise that resolves when the house is locked
   */
  async lockHouse(houseId: number): Promise<void> {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // First, check if there's an existing house_availability record for today
      const { data: existingAvailability, error: checkError } = await this.supabase.getClient()
        .schema('porton')
        .from('house_availabilities')
        .select('*')
        .eq('house_id', houseId)
        .gte('date', `${today}T00:00:00`)
        .lte('date', `${today}T23:59:59`)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      // Get the ID for "Locked" status from the availability_types table
      const { data: lockedStatus, error: statusError } = await this.supabase.getClient()
        .schema('porton')
        .from('availability_types')
        .select('availability_type_id')
        .eq('name', 'Locked')
        .single();
      
      if (statusError) {
        // If "Locked" status doesn't exist, use a default ID (you may need to adjust this)
        console.warn('Could not find "Locked" status, using default ID 99');
        const lockedStatusId = 99;
        
        if (existingAvailability) {
          // Update existing availability
          const { error: updateError } = await this.supabase.getClient()
            .schema('porton')
            .from('house_availabilities')
            .update({ availability_type_id: lockedStatusId })
            .eq('house_availability_id', existingAvailability.house_availability_id);
          
          if (updateError) throw updateError;
        } else {
          // Insert new availability
          const { error: insertError } = await this.supabase.getClient()
            .schema('porton')
            .from('house_availabilities')
            .insert({
              house_id: houseId,
              availability_type_id: lockedStatusId,
              date: new Date().toISOString()
            });
          
          if (insertError) throw insertError;
        }
      } else {
        const lockedStatusId = lockedStatus.availability_type_id;
        
        if (existingAvailability) {
          // Update existing availability
          const { error: updateError } = await this.supabase.getClient()
            .schema('porton')
            .from('house_availabilities')
            .update({ availability_type_id: lockedStatusId })
            .eq('house_availability_id', existingAvailability.house_availability_id);
          
          if (updateError) throw updateError;
        } else {
          // Insert new availability
          const { error: insertError } = await this.supabase.getClient()
            .schema('porton')
            .from('house_availabilities')
            .insert({
              house_id: houseId,
              availability_type_id: lockedStatusId,
              date: new Date().toISOString()
            });
          
          if (insertError) throw insertError;
        }
      }
    } catch (error) {
      console.error(`Error locking house ${houseId}:`, error);
      throw error;
    }
  }

  /**
   * Updates the status of a task
   * @param taskId The ID of the task to update
   * @param newStatus The new status to set (e.g., 'U tijeku', 'Dodijeljeno', 'Završeno')
   * @returns Promise that resolves when the task is updated
   */
  async updateTaskStatus(taskId: number, newStatus: string): Promise<void> {
    try {
      // First, get the task progress type ID for the new status
      const { data: progressType, error: progressTypeError } = await this.supabase.getClient()
        .schema('porton')
        .from('task_progress_types')
        .select('task_progress_type_id')
        .eq('task_progress_type_name', newStatus)
        .single();
      
      if (progressTypeError) {
        console.error('Error finding task progress type:', progressTypeError);
        throw progressTypeError;
      }
      
      const progressTypeId = progressType.task_progress_type_id;
      
      // Update the task with the new progress type
      const { error: updateError } = await this.supabase.getClient()
        .schema('porton')
        .from('tasks')
        .update({ 
          task_progress_type_id: progressTypeId,
          // If starting a task, set the start time
          ...(newStatus === 'u progresu' && { start_time: new Date().toISOString() }),
          // If completing a task, set the end time
          ...(newStatus === 'Završeno' && { end_time: new Date().toISOString() })
        })
        .eq('task_id', taskId);
      
      if (updateError) {
        console.error('Error updating task status:', updateError);
        throw updateError;
      }
    } catch (error) {
      console.error(`Error updating task ${taskId}:`, error);
      throw error;
    }
  }

}
