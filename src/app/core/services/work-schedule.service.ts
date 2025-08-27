import { Injectable } from '@angular/core';
import { DataService } from './data.service';
import { ProfileWorkDay, ProfileWorkSchedule } from '../models/data.models';
import { SupabaseService } from './supabase.service';
import { combineLatest } from 'rxjs';
import { nonNull } from '../../shared/rxjs-operators/non-null';

@Injectable({
  providedIn: 'root'
})
export class WorkScheduleService {
  profileWorkSchedule: ProfileWorkSchedule[] = [];
  profileWorkDays: ProfileWorkDay[] = [];

  constructor(
    private dataService: DataService,
    private supabaseService: SupabaseService,
  ) {
    combineLatest([
      this.dataService.profileWorkSchedule$.pipe(nonNull()),
      this.dataService.profileWorkDays$.pipe(nonNull()),
    ])
    .subscribe(([profileWorkSchedule, profileWorkDays]) => {
      this.profileWorkSchedule = profileWorkSchedule;
      this.profileWorkDays = profileWorkDays;
    });
  }
  
  async createProfileWorkSchedule(newProfileWorkSchedule: Partial<ProfileWorkSchedule>){
    try{
      const { data: createdProfileWorkSchedule, error: createProfileWorkScheduleError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('profile_work_schedule')
        .insert(newProfileWorkSchedule)
        .select()
        .single();

      if (createProfileWorkScheduleError) throw createProfileWorkScheduleError;

      if(createdProfileWorkSchedule && !this.profileWorkSchedule.find(p => p.id == createdProfileWorkSchedule.id)){
        this.dataService.setFullWorkSchedule([...this.profileWorkSchedule, createdProfileWorkSchedule]);
      }

      return createdProfileWorkSchedule;
    } catch(error){
      console.error('Error updating profile work schedules:', error);
      return null;
    }
  }

  async updateProfileWorkSchedule(profileWorkSchedule: ProfileWorkSchedule){
    try{
      const { id, ...fieldsToUpdate } = profileWorkSchedule;

      const { data: updatedProfileWorkSchedule, error: updateProfileWorkScheduleError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('profile_work_schedule')
        .update(fieldsToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (updateProfileWorkScheduleError) throw updateProfileWorkScheduleError;

      if(updatedProfileWorkSchedule && updatedProfileWorkSchedule.id){
        const profileWorkSchedule = this.profileWorkSchedule.map(p => p.id == updatedProfileWorkSchedule.id ? updatedProfileWorkSchedule : p);
        this.dataService.setFullWorkSchedule(profileWorkSchedule);
      }

      return updatedProfileWorkSchedule;
    } catch(error){
      console.error('Error updating profile work schedules:', error);
      return null;
    }
  }

  async deleteProfileWorkSchedule(profileWorkScheduleId: number){
    try{
      const { data: deletedProfileWorkSchedule, error: deleteProfileWorkScheduleError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('profile_work_schedule')
        .delete()
        .eq('id', profileWorkScheduleId)
        .select()
        .single();

      if(deleteProfileWorkScheduleError) throw deleteProfileWorkScheduleError;

      if(deletedProfileWorkSchedule && deletedProfileWorkSchedule.id) {
        const filteredProfileWorkSchedule = this.profileWorkSchedule.filter(pws => pws.id != deletedProfileWorkSchedule.id);
        this.dataService.setFullWorkSchedule(filteredProfileWorkSchedule);
      }

      return deletedProfileWorkSchedule
    } catch(error){
      console.error('Error deleting profile work schedule:', error);
      return null;
    }
  }

  async deleteProfileWorkSchedules(profileWorkSchedulesIds: number[]){
    try{
      const { data: deletedProfileWorkSchedules, error: deleteProfileWorkSchedulesError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('profile_work_schedule')
        .delete()
        .in('id', profileWorkSchedulesIds)
        .select();

      if (deleteProfileWorkSchedulesError) throw deleteProfileWorkSchedulesError;

      if(deletedProfileWorkSchedules && deletedProfileWorkSchedules.length > 0){
        const filteredProfileWorkSchedules = this.profileWorkSchedule.filter(p => !deletedProfileWorkSchedules.some(dp => dp.id == p.id));
        this.dataService.setFullWorkSchedule(filteredProfileWorkSchedules);
      }

      return deletedProfileWorkSchedules;
    } catch(error){
      console.error('Error deleting profile work schedules:', error);
      return null;
    }
  }

  async createProfileWorkDays(profileWorkDays: ProfileWorkDay[]){
    try{
      const profileWorkDaysToCreate = profileWorkDays.map(({ id, is_checked, ...rest }) => rest);

      const { data: createdProfileWorkDays, error: createProfileWorkDaysError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('profile_work_days')
        .insert(profileWorkDaysToCreate)
        .select();
      
      if (createProfileWorkDaysError) throw createProfileWorkDaysError;

      if(createdProfileWorkDays.length) {
        const filteredProfileWorkDays = createdProfileWorkDays.filter(pwd => !this.profileWorkDays.some(p => p.id == pwd.id));
        this.dataService.setProfileWorkDays([...this.profileWorkDays, ...filteredProfileWorkDays]);
      }

      return createdProfileWorkDays;
    } catch(error){
      console.error('Error creating profile work days:', error);
      return null;
    }
  }

  async updateProfileWorkDay(profileWorkDay: ProfileWorkDay){
    try{
      const { id, is_checked, ...fieldsToUpdate } = profileWorkDay;

      const { data: updatedProfileWorkDay, error: updateProfileWorkDayError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('profile_work_days')
        .update(fieldsToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (updateProfileWorkDayError) throw updateProfileWorkDayError;

      if(updatedProfileWorkDay && updatedProfileWorkDay.id){
        const updatedProfileWorkDays = this.profileWorkDays.map(pwd => pwd.id == updatedProfileWorkDay.id ? updatedProfileWorkDay : pwd);
        this.dataService.setProfileWorkDays(updatedProfileWorkDays);
      }

      return updatedProfileWorkDay;
    } catch(error){
      console.error('Error updating profile work day:', error);
      return null;
    }
  }
}
