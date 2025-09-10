import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { House, HouseAvailability, Task, TaskProgressTypeName, WorkGroupProfile, WorkGroupTask, PushNotification, WorkGroup, Profile, HouseOccupant, HouseType, TaskTypeName } from '../models/data.models';
import { combineLatest } from 'rxjs';
import { TaskService } from './task.service';
import { DataService } from './data.service';
import { PushNotificationsService } from './push-notifications.service';
import { TranslateService } from '@ngx-translate/core';
import { nonNull } from '../../shared/rxjs-operators/non-null';


@Injectable({
  providedIn: 'root'
})
export class HouseService {
  houseAvailabilities: HouseAvailability[] = [];
  tempHouseAvailabilities: HouseAvailability[] = [];
  houses: House[] = [];
  tasks: Task[] = [];
  workGroupTasks: WorkGroupTask[] = [];
  workGroupProfiles: WorkGroupProfile[] = [];
  workGroups: WorkGroup[] = [];
  profiles: Profile[] = [];
  houseTypes: HouseType[] = [];

  constructor(
    private supabase: SupabaseService,
    private dataService: DataService,
    private taskService: TaskService,
    private pushNotificationService: PushNotificationsService,
    private translateService: TranslateService,
  ) {
    combineLatest([
      this.dataService.houseAvailabilities$.pipe(nonNull()),
      this.dataService.tempHouseAvailabilities$.pipe(nonNull()),
      this.dataService.houses$.pipe(nonNull()),
      this.dataService.houseTypes$.pipe(nonNull()),
      this.dataService.tasks$.pipe(nonNull()),
      this.dataService.workGroupTasks$.pipe(nonNull()),
      this.dataService.workGroupProfiles$.pipe(nonNull()),
      this.dataService.workGroups$.pipe(nonNull()),
    ]).subscribe({
      next: ([houseAvailabilities, tempHouseAvailabilities, houses, houseTypes, tasks, workGroupTasks, workGroupProfiles, workGroups]) => {
        this.houseAvailabilities = houseAvailabilities;
        this.tempHouseAvailabilities = tempHouseAvailabilities;
        this.houses = houses;
        this.houseTypes = houseTypes;
        this.tasks = tasks;
        this.workGroupTasks = workGroupTasks;
        this.workGroupProfiles = workGroupProfiles;
        this.workGroups = workGroups;
      },
      error: (error) => {
        console.error(error);
      }
    });
  }

  isHouseOccupied(houseId: number): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayTime = yesterday.getTime();

    const houseAvailabilities = this.houseAvailabilities
      .filter((availability) => {
        if (availability.house_id == houseId) {
          const start = new Date(availability.house_availability_start_date);
          start.setHours(0, 0, 0, 0);

          const end = new Date(availability.house_availability_end_date);
          end.setHours(23, 59, 59, 999);

          const isTodayInRange = start.getTime() <= todayTime && end.getTime() >= todayTime;
          const endedYesterday = end.getTime() >= yesterdayTime && end.getTime() < todayTime;

          return isTodayInRange || endedYesterday;
        }

        return false;
      })
      .sort((a, b) => {
        const endA = new Date(a.house_availability_end_date).getTime();
        const endB = new Date(b.house_availability_end_date).getTime();
        return endA - endB;
      });

    if (houseAvailabilities && houseAvailabilities.length == 1) {
      if(!houseAvailabilities[0].has_arrived){
        return false;
      } else if(houseAvailabilities[0].has_arrived && !houseAvailabilities[0].has_departed){
        return true;
      } else if(houseAvailabilities[0].has_departed){
        return false;
      }
    } else if (houseAvailabilities && houseAvailabilities.length == 2) {
      if (!houseAvailabilities[0].has_departed) {
        return true;
      } else if (houseAvailabilities[0].has_departed && !houseAvailabilities[1].has_arrived) {
        return false;
      } else if (houseAvailabilities[0].has_departed && houseAvailabilities[1].has_arrived) {
        return true;
      }
    }

    return false;
  }

  hasNotCompletedTasks(houseId: number): boolean {
    const notCompletedTasksForHouse = this.tasks
      .filter(task => 
        task.house_id == houseId && 
        task.task_progress_type_id != this.taskService.getTaskProgressTypeByName(TaskProgressTypeName.Completed)?.task_progress_type_id
      );

    return !!notCompletedTasksForHouse.length;
  }

  hasScheduledNotCompletedTasks(houseId: number): boolean {
    const notCompletedTasksForHouse = this.tasks
      .filter(task => 
        task.house_id == houseId &&
        task.task_progress_type_id != this.taskService.getTaskProgressTypeByName(TaskProgressTypeName.Completed)?.task_progress_type_id &&
        !task.is_unscheduled
      );

    return !!notCompletedTasksForHouse.length;
  }

  getTasksForHouse(houseId: number): Task[] {
    return this.tasks.filter(task => task.house_id == houseId);
  }

  getHouseByName(name: string){
    return this.houses.find(house => house.house_name == name);
  }

  getHouseNumber(houseId: number) {
    return this.houses.find(h => h.house_id === houseId)?.house_number;
  }

  getHouseName(houseId: number | undefined){
    return this.houses.find(h => h.house_id === houseId)?.house_name;
  }

  getHouseType(houseTypeId: number){
    return this.houseTypes.find(ht => ht.house_type_id == houseTypeId);
  }

  getTodaysHouseAvailabilityForHouse(houseId: number){
    const today = new Date(); 
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const yesterdayString = yesterday.getFullYear() + '-' + 
                            String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + 
                            String(yesterday.getDate()).padStart(2, '0');

    const houseAvailabilties = this.houseAvailabilities?.filter(item => {
      if(item.house_id == houseId){
        const startDate = new Date(item.house_availability_start_date);
        const endDate = new Date(item.house_availability_end_date);
    
        const endDateString = endDate.getFullYear() + '-' + 
                              String(endDate.getMonth() + 1).padStart(2, '0') + '-' + 
                              String(endDate.getDate()).padStart(2, '0');
    
        return (today >= startDate && today <= endDate) || yesterdayString === endDateString;
      } 
    
      return false;
    });

    return houseAvailabilties.sort((a, b) => 
      new Date(a.house_availability_start_date).getTime() - new Date(b.house_availability_start_date).getTime()
    );
  }

  getNextHouseAvailabilityForHouse(houseId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureAvailabilities = this.houseAvailabilities?.filter(item => {
      return item.house_id === houseId &&
            new Date(item.house_availability_start_date) > today;
    }) || [];

    return futureAvailabilities
      .sort((a, b) =>
        new Date(a.house_availability_start_date).getTime() -
        new Date(b.house_availability_start_date).getTime()
      )[0] || null;
  }

  getPreviousHouseAvailabilityFromHouseAvailability(currentAvailability: Partial<HouseAvailability>) {
    if (!currentAvailability.house_availability_start_date) return null;

    const currentDate = new Date(currentAvailability.house_availability_start_date);

    const availabilities = currentAvailability.house_id! > 0
        ? this.houseAvailabilities
        : this.tempHouseAvailabilities;

    const pastAvailabilities = availabilities?.filter(item =>
        item.house_id === currentAvailability.house_id &&
        new Date(item.house_availability_start_date) < currentDate
    ) || [];

    return pastAvailabilities
      .sort((a, b) =>
        new Date(b.house_availability_start_date).getTime() -
        new Date(a.house_availability_start_date).getTime()
      )[0] || null;
  }

  getNextHouseAvailabilityFromHouseAvailability(currentAvailability: Partial<HouseAvailability>) {
    const currentDate = new Date(currentAvailability.house_availability_start_date!);

    const availabilities = currentAvailability.house_id! > 0
        ? this.houseAvailabilities
        : this.tempHouseAvailabilities;

    const futureAvailabilities = availabilities?.filter(item =>
        item.house_id === currentAvailability.house_id &&
        new Date(item.house_availability_start_date) > currentDate
    ) || [];

    return futureAvailabilities
      .sort((a, b) =>
        new Date(a.house_availability_start_date).getTime() -
        new Date(b.house_availability_start_date).getTime()
      )[0] || null;
  }

  isHouseReservedToday(houseId: number){
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.houseAvailabilities.find(ha => {
      const start = new Date(ha.house_availability_start_date);
      const end = new Date(ha.house_availability_end_date);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      return ha.house_id == houseId && today >= start && today <= end;
    });
  } 

  hasDepartureForToday(houseId: number){
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const specificDateStr = yesterday.toISOString().split('T')[0];

    return this.houseAvailabilities.find(ha => ha.house_availability_end_date.split('T')[0] == specificDateStr && ha.house_id == houseId);
  }

  hasArrivalForToday(houseId: number) {
    const today = new Date();
    const specificDateStr = today.toISOString().split('T')[0];

    return this.houseAvailabilities.find(ha =>
      ha.house_availability_start_date.split('T')[0] == specificDateStr &&
      ha.house_id == houseId
    );
  }

  getTimeObjFromTimeString(timeString: string): Date {
    const date = new Date();
    const [hours, minutes] = timeString.split(':').map(n => parseInt(n, 10));

    date.setHours(hours || 0);
    date.setMinutes(minutes || 0);
    date.setSeconds(0);
    
    return date;
  }

  getCurrentOccupantCount(houseId: number, key: keyof HouseAvailability){
    const todayAvailabilities = this.getTodaysHouseAvailabilityForHouse(houseId);

    if (
      !todayAvailabilities || 
      todayAvailabilities.length == 0 || 
      (todayAvailabilities.length == 1 && this.hasDepartureForToday(houseId) && todayAvailabilities[0].has_departed)
    ) {
      const nextAvailability = this.getNextHouseAvailabilityForHouse(houseId);
      return nextAvailability ? nextAvailability[key] ?? 0 : 0;
    }

    if (todayAvailabilities.length == 1) {
      return todayAvailabilities[0][key] ?? 0;
    }

    if (todayAvailabilities.length == 2) {
      const relevant = todayAvailabilities[0].has_departed ? todayAvailabilities[1] : todayAvailabilities[0];
      return relevant[key] ?? 0;
    }

    return 0;
  }

  getCurrentNumberOfAdults(houseId: number){
    return this.getCurrentOccupantCount(houseId, HouseOccupant.Adults);
  }

  getCurrentNumberOfBabies(houseId: number){
    return this.getCurrentOccupantCount(houseId, HouseOccupant.Children);
  }

  getCurrentNumberOfCribs(houseId: number){
    return this.getCurrentOccupantCount(houseId, HouseOccupant.Cribs);
  }

  getCurrentNumberOfPets(houseId: number){
    return this.getCurrentOccupantCount(houseId, HouseOccupant.Pets);
  }

  getHouseStatus(house: House): 'OCCUPIED' | 'ARRIVAL-DAY' | 'NOT-CLEANED' | 'FREE' {
    if (this.isHouseOccupied(house.house_id)) return 'OCCUPIED';
    if (!this.isHouseOccupied(house.house_id) && this.hasScheduledNotCompletedTasks(house.house_id)) return 'NOT-CLEANED';
    if (!this.isHouseOccupied(house.house_id) && this.isHouseReservedToday(house.house_id)) return 'ARRIVAL-DAY';
    if (!this.isHouseOccupied(house.house_id) && !this.hasScheduledNotCompletedTasks(house.house_id)) return 'FREE';
    return 'FREE';
  }

  async setHouseAvailabilityDeparted(houseAvailabilityId: number, state: boolean){
    try {
      const { data: updatedHouseAvailability, error: updateHouseAvailabilityError } = await this.supabase.getClient()
        .schema('porton')
        .from('house_availabilities')
        .update({ 
          has_departed: state,
         })
        .eq('house_availability_id', houseAvailabilityId)
        .select()
        .single();

      if (updateHouseAvailabilityError) throw updateHouseAvailabilityError;

      if(updatedHouseAvailability && updatedHouseAvailability.house_availability_id) {
        const updatedHouseAvailabilities = this.houseAvailabilities.map(ha => 
          ha.house_availability_id == updatedHouseAvailability.house_availability_id ? updatedHouseAvailability : ha
        );
        this.dataService.setHouseAvailabilites(updatedHouseAvailabilities);
      }

      if(state){
        this.handleHouseDepartureNotificationSend(houseAvailabilityId);
      }

      return updatedHouseAvailability;
    } catch (error) {
      console.error('Error updating house availability:', error);
      return null;
    }
  }

  async setHouseAvailabilityArrived(houseAvailabilityId: number, state: boolean){
    try {
      const { data: updatedHouseAvailability, error: updateHouseAvailabilityError } = await this.supabase.getClient()
        .schema('porton')
        .from('house_availabilities')
        .update({ 
          has_arrived: state,
         })
        .eq('house_availability_id', houseAvailabilityId)
        .select()
        .single();

      if (updateHouseAvailabilityError) throw updateHouseAvailabilityError;

      if(updatedHouseAvailability && updatedHouseAvailability.house_availability_id) {
        const updatedHouseAvailabilities = this.houseAvailabilities.map(ha => 
          ha.house_availability_id == updatedHouseAvailability.house_availability_id ? updatedHouseAvailability : ha
        );
        this.dataService.setHouseAvailabilites(updatedHouseAvailabilities);
      }

      return updatedHouseAvailability;
    }
    catch (error) {
      console.error('Error updating house availability:', error);
      return null;
    }
  }

  handleHouseDepartureTaskCreation(updatedHouseAvailability: HouseAvailability){
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const departureDay = new Date(updatedHouseAvailability.house_availability_end_date);
    departureDay.setHours(0, 0, 0 ,0);  
    departureDay.setDate(departureDay.getDate() + 1);

    if(departureDay.getTime() > today.getTime()){
      this.taskService.createTask(updatedHouseAvailability.house_id, '', TaskTypeName.HouseCleaning, false);
      this.taskService.createTask(updatedHouseAvailability.house_id, '', TaskTypeName.DeckCleaning, false);
    }
  }

  private handleHouseDepartureNotificationSend(houseAvailabilityId : number){
    const houseAvailability = this.houseAvailabilities.find(ha => ha.house_availability_id == houseAvailabilityId);
    if(!houseAvailability) return; 

    const house = this.houses.find(house => house.house_id == houseAvailability.house_id);
    if(!house) return;

    const tasksForHouse = this.tasks.filter(task => 
      task.house_id == house.house_id &&
      this.taskService.isTaskAssigned(task)
    );

    const today = new Date();

    const workGroupTasksForHouse = this.workGroupTasks.filter(wgt => tasksForHouse.some(t => t.task_id == wgt.task_id));
    const todaysWorkGroups = this.workGroups.filter(wg => 
      wg.created_at.startsWith(today.toISOString().split('T')[0]) &&
      workGroupTasksForHouse.some(wgt => wgt.work_group_id == wg.work_group_id) &&
      !wg.is_repair
    );

    const workGroupProfiles = this.workGroupProfiles.filter(wgp => todaysWorkGroups.some(wgt => wgt.work_group_id == wgp.work_group_id));

    const notification: PushNotification = {
      title: this.translateService.instant('NOTIFICATIONS.HOUSE-DEPARTED.TITLE'),
      body: this.translateService.instant('NOTIFICATIONS.HOUSE-DEPARTED.BODY', {
        house_name: house.house_name,
      }),
    }

    for(let wgp of workGroupProfiles){
      this.pushNotificationService.sendNotification(wgp.profile_id, notification);
    }
  }

  async updateHouseAvailabilityTime(houseAvailabilityId: number, timeField: 'arrival_time' | 'departure_time', timeValue: string) {
    try {
      if (!houseAvailabilityId || !timeField || !timeValue) {
        console.error('Missing required parameters for updateHouseAvailabilityTime');
        return false;
      }

      const updateData: any = {};
      updateData[timeField] = timeValue;

      const { data: updatedHouseAvailability, error: updateHouseAvailabilityError } = await this.supabase.getClient()
        .schema('porton')
        .from('house_availabilities')
        .update(updateData)
        .eq('house_availability_id', houseAvailabilityId)
        .select()
        .single();

      if (updateHouseAvailabilityError) throw updateHouseAvailabilityError;

      if(updatedHouseAvailability && updatedHouseAvailability.house_availability_id) {
        const updatedHouseAvailabilities = this.houseAvailabilities.map(ha => 
          ha.house_availability_id == updatedHouseAvailability.house_availability_id ? updatedHouseAvailability : ha
        );
        this.dataService.setHouseAvailabilites(updatedHouseAvailabilities);
      }

      return updatedHouseAvailability;
    } catch (error) {
      console.error(`Error updating ${timeField} for house availability ${houseAvailabilityId}:`, error);
      return null;
    }
  }

  async createHouseAvailability(houseAvailability: HouseAvailability){
    try{
      const table = (houseAvailability.house_id > 0) ? 'house_availabilities' : 'temp_house_availabilities';
      const { house_availability_id, ...houseAvailabilityToCreate } = houseAvailability;

      const { data: createdHouseAvailability, error: createHouseAvailabilityError } = await this.supabase.getClient()
        .schema('porton')
        .from(table)
        .insert(houseAvailabilityToCreate)
        .select()
        .single();
      
      if(createHouseAvailabilityError) throw createHouseAvailabilityError;

      if(
        createdHouseAvailability.house_id > 0 &&
        createdHouseAvailability && 
        !this.houseAvailabilities.find(ha => ha.house_availability_id == createdHouseAvailability.house_availability_id)
      ) {
        this.dataService.setHouseAvailabilites([...this.houseAvailabilities, createdHouseAvailability]);
      } else if(
        createdHouseAvailability.house_id < 0 &&
        createdHouseAvailability && 
        !this.tempHouseAvailabilities.find(ha => ha.house_availability_id == createdHouseAvailability.house_availability_id)
      ) {
        this.dataService.setTempHouseAvailabilities([...this.tempHouseAvailabilities, createdHouseAvailability]);
      }

      return createdHouseAvailability;
    } catch(error) {
      console.error('Error creating house availability:', error);
      return null;
    }
  }

  async updateHouseAvailability(houseAvailability: HouseAvailability){
    try {
      const table = (houseAvailability.house_id > 0) ? 'house_availabilities' : 'temp_house_availabilities';
      const { house_availability_id, ...houseAvailabilityToUpdate } = houseAvailability;

      const { data: updatedHouseAvailability, error: updateHouseAvailabilityError } = await this.supabase.getClient()
        .schema('porton')
        .from(table)
        .update(houseAvailabilityToUpdate)
        .eq('house_availability_id', house_availability_id)
        .select()
        .single();

      if(updateHouseAvailabilityError) throw updateHouseAvailabilityError;

      if(updatedHouseAvailability && updatedHouseAvailability.house_availability_id && updatedHouseAvailability.house_id > 0){
        const updatedHouseAvailabilities = this.houseAvailabilities.map(ha => 
          ha.house_availability_id == updatedHouseAvailability.house_availability_id ? updatedHouseAvailability : ha
        );
        this.dataService.setHouseAvailabilites(updatedHouseAvailabilities);
      } else if(updatedHouseAvailability && updatedHouseAvailability.house_availability_id && updatedHouseAvailability.house_id < 0){
        const updatedTempHouseAvailabilities = this.tempHouseAvailabilities.map(tha => 
          tha.house_availability_id == updatedHouseAvailability.house_availability_id ? updatedHouseAvailability : tha
        );
        this.dataService.setTempHouseAvailabilities(updatedTempHouseAvailabilities);
      }

      return updatedHouseAvailability;
    } catch(error) {
      console.error('Error updating house availability:', error);
      return null;
    }
  }

  async deleteHouseAvailability(houseAvailabilityId: number, houseId: number){
    try{
      const table = (houseId > 0) ? 'house_availabilities' : 'temp_house_availabilities';

      const { data: deletedHouseAvailability, error: deleteHouseAvailabilityError } = await this.supabase.getClient()
        .schema('porton')
        .from(table)
        .delete()
        .eq('house_availability_id', houseAvailabilityId)
        .select()
        .single();

      if (deleteHouseAvailabilityError) throw deleteHouseAvailabilityError;

      if(houseId > 0 && deletedHouseAvailability && deletedHouseAvailability.house_availability_id){
        const filteredHouseAvailabilities = this.houseAvailabilities.filter(ha => ha.house_availability_id != deletedHouseAvailability.house_availability_id);
        this.dataService.setHouseAvailabilites(filteredHouseAvailabilities);
      } else if(houseId < 0 && deletedHouseAvailability && deletedHouseAvailability.house_availability_id) {
        const filteredTempHouseAvailabilities = this.tempHouseAvailabilities.filter(ha => ha.house_availability_id != deletedHouseAvailability.house_availability_id);
        this.dataService.setTempHouseAvailabilities(filteredTempHouseAvailabilities);
      }

      return deletedHouseAvailability;
    } catch(error) {
      console.error('Error updating house availability:', error);
      return null;
    }
  }

  async createHouse(house: Partial<House>){
    try{      
      const { house_id, ...houseToCreate } = house;

      const { data: createdHouse, error: createdHouseError } = await this.supabase.getClient()
        .schema('porton')
        .from('houses')
        .insert(houseToCreate)
        .select()
        .single();
      
      if(createdHouseError) throw createdHouseError;

      if(createdHouse && !this.houses.find(h => h.house_id == createdHouse.house_id)){
        this.dataService.setHouses([...this.houses, createdHouse]);
      }

      return createdHouse;
    } catch(error){
      console.error("Error creating house ", error);
      return null;
    }
  }

  async updateHouse(house: House){
    try{
      const { house_id, ...houseToUpdate } = house;

      const { data: updatedHouse, error: updateHouseError } = await this.supabase.getClient()
        .schema('porton')
        .from('houses')
        .update(houseToUpdate)
        .eq('house_id', house_id)
        .select()
        .single();

      if(updateHouseError) throw updateHouseError;

      if(updatedHouse && updatedHouse.house_id){
        const updatedHouses = this.houses.map(h => h.house_id == updatedHouse.house_id ? updatedHouse : h);
        this.dataService.setHouses(updatedHouses);
      }

      return updatedHouse
    } catch(error) {
      console.error("Error updating house ", error)
      return null;
    }
  }

  async softDeleteHouse(houseId: number){
    try{
      const { data: deletedHouse, error: deleteHouseError } = await this.supabase.getClient()
        .schema('porton')
        .from('houses')
        .update({
          is_deleted: true,
        })
        .eq('house_id', houseId)
        .select()
        .single();

      if(deleteHouseError) throw deleteHouseError;

      if(deletedHouse && deletedHouse.house_id){
        const filteredHouses = this.houses.filter(h => h.house_id != deletedHouse.house_id);
        this.dataService.setHouses(filteredHouses);
      }
      
      return deletedHouse;
    } catch(error) {
      console.error("Error deleting house ", error);
      return null;
    }
  }
}
