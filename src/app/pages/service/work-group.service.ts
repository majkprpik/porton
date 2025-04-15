import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { LockedTeam } from './data.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkGroupService {
  private activeGroupIdSubject = new BehaviorSubject<number | undefined>(undefined);
  private lockedTeams: LockedTeam[] = [];
  activeGroupId$ = this.activeGroupIdSubject.asObservable();
  $workGroupToDelete = new BehaviorSubject<any>(null);
  $newGroupWhileGroupActive = new BehaviorSubject<boolean>(false);

  constructor(
    private supabaseService: SupabaseService
  ) {
    
  }

  setActiveGroup(groupId: number | undefined) {
    this.activeGroupIdSubject.next(groupId);
  }

  getActiveGroup(): number | undefined {
    return this.activeGroupIdSubject.value;
  }

  setLockedTeams(lockedTeams: LockedTeam[]){
    this.lockedTeams = lockedTeams;
  }

  updateLockedTeam(updatedTeam: LockedTeam){
    const index = this.lockedTeams.findIndex(team => team.id == updatedTeam.id);
    if (index != -1) {
      this.lockedTeams[index] = updatedTeam;
    } else {
      this.lockedTeams.push(updatedTeam);
    }
  }

  getLockedTeams(){
    return this.lockedTeams;
  }

  async createWorkGroup(): Promise<any>{
    try{
      const { data: newWorkGroup, error: createWorkGroupError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_groups')
        .insert({ 
          created_at: this.getFormattedDateTimeNowForSupabase(),
          is_locked: false,
         })
        .select()
        .single();

      if(createWorkGroupError) throw createWorkGroupError;

      return newWorkGroup;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async lockWorkGroup(workGroupId: number){
    try{
      const { error: updateWorkGroupError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_groups')
        .update({
          is_locked: true
        })
        .eq('work_group_id', workGroupId);

      if(updateWorkGroupError) throw updateWorkGroupError

      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async createWorkGroupTask(workGroupId: number, taskId: number, index: number){
    try{
      const { data: newWorkGroupTask, error: createWorkGroupTaskError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_tasks')
        .insert({ 
          work_group_id: workGroupId,
          task_id: taskId,
          index: index,
         })
        .select()
        .single();

      if(createWorkGroupTaskError) throw createWorkGroupTaskError;

      return newWorkGroupTask;
    } catch (error){
      console.log(error);
      return {};
    }
  }

  async updateWorkGroupTaskIndex(taskId: number, index: number){
    try{
      const { error: updateTaskError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_tasks')
        .update({
          index: index
        })
        .eq('task_id', taskId);

      if(updateTaskError) throw updateTaskError

      return true;
    } catch(error) {
      console.log(error);
      return false;
    }
  }

  async deleteWorkGroup(teamId: string){
    try{
      const { error: updateTaskError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_groups')
        .delete()
        .eq('work_group_id', teamId);

      if(updateTaskError) throw updateTaskError

      return true;
    } catch(error) {
      console.log(error);
      return false;
    }
  }

  async deleteWorkGroupProfile(profileId: string, workGroupId: number){
    try{
      const { error: deleteWorkGroupProfileError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_profiles')
        .delete()
        .eq('profile_id', profileId)
        .eq('work_group_id', workGroupId);

      if(deleteWorkGroupProfileError) throw deleteWorkGroupProfileError

      return true;
    } catch(error) {
      console.log(error);
      return false;
    }
  }

  async deleteWorkGroupTask(taskId: number, workGroupId: number){
    try{
      const { error: deleteWorkGroupTaskError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_tasks')
        .delete()
        .eq('task_id', taskId)
        .eq('work_group_id', workGroupId);

      if(deleteWorkGroupTaskError) throw deleteWorkGroupTaskError

      return true;
    } catch(error) {
      console.log(error);
      return false;
    }
  }

  async deleteAllWorkGroupTasksByWorkGroupId(workGroupId: number){
    try{
      const { error: deleteWorkGroupTaskError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_tasks')
        .delete()
        .eq('work_group_id', workGroupId);

      if(deleteWorkGroupTaskError) throw deleteWorkGroupTaskError

      return true;
    } catch(error) {
      console.log(error);
      return false;
    }
  }

  async submitTechnicianForRepairTask(workGroupId: number, profileId: string){
    try{
      const { data: newTechnicianForRepairTask, error: newTechnicianForRepairTaskError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_profiles')
        .insert({ 
          work_group_id: workGroupId,
          profile_id: profileId,
         })
        .select()
        .single();

      if(newTechnicianForRepairTaskError) throw newTechnicianForRepairTaskError;

      return newTechnicianForRepairTask;
    } catch (error){
      console.log(error);
      return {};
    }
  }

  async createWorkGroupProfile(workGroupId: number, profileId: string){
    try{
      const { data: newWorkGroupProfile, error: newWorkGroupProfileError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_profiles')
        .insert({ 
          work_group_id: workGroupId,
          profile_id: profileId,
         })
        .select()
        .single();

      if(newWorkGroupProfileError) throw newWorkGroupProfileError;

      return newWorkGroupProfile;
    } catch (error){
      console.log(error);
      return {};
    }
  }

  async createWorkGroupForHouse(workGroupId: number, houseId: number){
    try{
      const { data: newWorkGroupForHouseTask, error: newWorkGroupForHouseTaskError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_houses')
        .insert({ 
          work_group_id: workGroupId,
          house_id: houseId,
         })
        .select()
        .single();

      if(newWorkGroupForHouseTaskError) throw newWorkGroupForHouseTaskError;

      return newWorkGroupForHouseTask;
    } catch (error){
      console.log(error);
      return {};
    }
  }

  async getWorkGroupByWorkGroupId(workGroupId: number): Promise<any>{
    try{
      const { data: existingWorkGroup, error: existingWorkGroupError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_groups')
        .select('*')
        .eq('work_group_id', workGroupId)
        .single();

      if(existingWorkGroupError) throw existingWorkGroupError;

      return existingWorkGroup;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async getWorkGroupProfilesByWorkGroupId(workGroupId: number): Promise<any>{
    try{
      const { data: existingWorkGroup, error: existingWorkGroupError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_profiles')
        .select('*')
        .eq('work_group_id', workGroupId);

      if(existingWorkGroupError) throw existingWorkGroupError;

      return existingWorkGroup;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async getWorkGroupTasksByWorkGroupId(workGroupId: number){
    try{
      const { data: existingWorkGroupTask, error: existingWorkGroupTaskError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_tasks')
        .select('*')
        .eq('work_group_id', workGroupId);

      if(existingWorkGroupTaskError) throw existingWorkGroupTaskError;

      return existingWorkGroupTask;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async getWorkGroupTasksByTaskId(taskId: number){
    try{
      const { data: existingWorkGroupTask, error: existingWorkGroupTaskError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_tasks')
        .select('*')
        .eq('task_id', taskId)
        .single();

      if(existingWorkGroupTaskError) throw existingWorkGroupTaskError;

      return existingWorkGroupTask;
    } catch (error) {
      console.log(error);
      return {};
    }
  }

  async deleteWorkGroupProfileByProfileId(profileId: string){
    try{
      const { error: deleteWorkGroupProfileError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_profiles')
        .delete()
        .eq('profile_id', profileId);

      if(deleteWorkGroupProfileError) throw deleteWorkGroupProfileError

      return true;
    } catch(error) {
      console.log(error);
      return false;
    }
  }

  async deleteWorkGroupTaskByTaskId(taskId: string){
    try{
      const { error: deleteWorkGroupTaskError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('work_group_tasks')
        .delete()
        .eq('task_id', taskId);

      if(deleteWorkGroupTaskError) throw deleteWorkGroupTaskError

      return true;
    } catch(error) {
      console.log(error);
      return false;
    }
  }

  private getFormattedDateTimeNowForSupabase(){
    const now = new Date();
    const isoString = now.toISOString(); // Example: 2025-03-14T11:26:33.350Z
  
    // Convert to required format: "YYYY-MM-DD HH:MM:SS.ssssss+00"
    return isoString.replace('T', ' ').replace('Z', '+00');
  }
}
